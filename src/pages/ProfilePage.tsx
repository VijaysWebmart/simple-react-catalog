import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { User as UserIcon, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import AuthenticatedHeader from '../components/AuthenticatedHeader';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle();
      if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
      }
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
    });
    setSaving(false);
    if (error) toast.error('Failed to update profile');
    else toast.success('Profile updated');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user ? <AuthenticatedHeader /> : <Header />}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2"><UserIcon className="w-7 h-7" /> My Profile</h1>
        <p className="text-gray-600 mb-8">Manage your personal information</p>

        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : (
          <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={user?.email || ''} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
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
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
