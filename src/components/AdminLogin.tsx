
import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

interface AdminLoginProps {
  onLogin: (adminData: any) => void;
}

const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      if (signInError) {
        toast.error('Invalid credentials');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-login');

      if (error || !data?.adminUser) {
        await supabase.auth.signOut();
        toast.error(data?.error || 'Admin access required');
        setIsLoading(false);
        return;
      }

      const adminUser = data.adminUser;
      toast.success('Login successful!');
      onLogin(adminUser);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = formData.email.trim().toLowerCase();
    if (!email) {
      toast.error('Enter your super-admin email first');
      return;
    }
    setIsResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setIsResetting(false);
    if (error) {
      toast.error('Unable to send reset email. Please try again.');
      return;
    }
    toast.success('If that super-admin account exists, a reset link has been sent.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>
          <p className="text-gray-600">Sign in to access admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@example.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isResetting}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {isResetting ? 'Sending reset link...' : 'Forgot password?'}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Use your registered admin email and password to sign in.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
