import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { User as UserIcon, Save, MapPin, Plus, Trash2, Star, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import AuthenticatedHeader from '../components/AuthenticatedHeader';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AddressForm, { AddressInput } from '../components/AddressForm';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { toast } from 'sonner';

interface Address extends AddressInput {
  id: string;
  is_default: boolean;
}

const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadAddresses = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    setAddresses((data as Address[]) || []);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('profiles').select('full_name, phone, avatar_url' as any).eq('id', user.id).maybeSingle();
      if (data) {
        setFullName((data as any).full_name || '');
        setPhone((data as any).phone || '');
        setAvatarUrl((data as any).avatar_url || '');
      }
      await loadAddresses();
      setLoading(false);
    })();
  }, [user]);

  if (!authLoading && !user) return <Navigate to="/auth" replace />;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      phone,
      updated_at: new Date().toISOString(),
    } as any);
    setSaving(false);
    if (error) toast.error('Failed to update profile');
    else toast.success('Profile updated');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      const { error: updErr } = await supabase.from('profiles').update({ avatar_url: publicUrl } as any).eq('id', user.id);
      if (updErr) throw updErr;
      setAvatarUrl(publicUrl);
      toast.success('Profile photo updated');
    } catch (err: any) {
      toast.error('Failed to upload photo');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const addAddress = async (a: AddressInput) => {
    if (!user) return;
    const isFirst = addresses.length === 0;
    const { error } = await (supabase as any).from('addresses').insert({
      user_id: user.id,
      ...a,
      is_default: isFirst,
    });
    if (error) { toast.error('Failed to save address'); return; }
    toast.success('Address saved');
    setShowAddForm(false);
    await loadAddresses();
  };

  const removeAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    const { error } = await (supabase as any).from('addresses').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    await loadAddresses();
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    await (supabase as any).from('addresses').update({ is_default: false }).eq('user_id', user.id);
    const { error } = await (supabase as any).from('addresses').update({ is_default: true }).eq('id', id);
    if (error) { toast.error('Failed'); return; }
    toast.success('Default address updated');
    await loadAddresses();
  };

  const initials = (fullName || user?.email || '?').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user ? <AuthenticatedHeader /> : <Header />}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2"><UserIcon className="w-7 h-7" /> My Profile</h1>
        <p className="text-gray-600 mb-8">Manage your personal information and saved addresses</p>

        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : (
          <>
            <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm p-6 space-y-4 mb-8">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <label className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full cursor-pointer shadow">
                    <Camera className="w-3.5 h-3.5" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                  </label>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{fullName || 'Add your name'}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  {uploading && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2"><MapPin className="w-5 h-5" /> My Addresses</h2>
                {!showAddForm && (
                  <button onClick={() => setShowAddForm(true)} className="inline-flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                )}
              </div>

              {showAddForm && (
                <div className="border rounded-lg p-4 mb-4 bg-gray-50">
                  <AddressForm onSubmit={addAddress} onCancel={() => setShowAddForm(false)} submitLabel="Save Address" />
                </div>
              )}

              {addresses.length === 0 && !showAddForm ? (
                <p className="text-gray-500 text-sm">No saved addresses yet. Add one to speed up checkout.</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map(a => (
                    <div key={a.id} className={`border rounded-lg p-4 flex justify-between gap-4 ${a.is_default ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'}`}>
                      <div className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">{a.full_name}</p>
                          {a.is_default && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Default</span>}
                        </div>
                        <p className="text-gray-700">{a.phone}</p>
                        <p className="text-gray-600 mt-1">{a.address}, {a.city}, {a.state} - {a.pincode}</p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {!a.is_default && (
                          <button onClick={() => setDefault(a.id)} title="Set as default" className="p-1.5 text-gray-500 hover:text-blue-600">
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => removeAddress(a.id)} title="Delete" className="p-1.5 text-gray-500 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
