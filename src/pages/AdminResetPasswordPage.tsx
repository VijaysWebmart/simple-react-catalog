import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../integrations/supabase/client';

const AdminResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validRecovery, setValidRecovery] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const checkRecovery = async () => {
      const isRecoveryLink = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
      const { data: { session } } = await supabase.auth.getSession();
      if (active) {
        setValidRecovery(Boolean(isRecoveryLink || session));
        setChecking(false);
      }
    };
    checkRecovery();
    return () => { active = false; };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 10) {
      toast.error('Use at least 10 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.auth.signOut();
    toast.success('Password updated. Sign in with your new password.');
    navigate('/admin', { replace: true });
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <section className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 text-center">Reset admin password</h1>
        {checking ? (
          <p className="mt-6 text-center text-gray-600">Checking reset link...</p>
        ) : !validRecovery ? (
          <div className="mt-6 text-center">
            <p className="text-red-600 mb-4">This reset link is invalid or expired.</p>
            <Link to="/admin" className="text-blue-600 hover:text-blue-800">Request a new link</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input id="new-password" type="password" autoComplete="new-password" required minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input id="confirm-password" type="password" autoComplete="new-password" required minLength={10} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg">
              {saving ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export default AdminResetPasswordPage;