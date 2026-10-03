'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, getStoredUser } from '@/lib/salonApi';
import { SalonLogo } from '@/components/SalonLogo';
import { Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    if (user && user.token) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(username, password);
      if (res.success) {
        router.push('/');
      } else {
        setError(res.error || 'Invalid username or password');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0b0f17]">
      <div className="w-full max-w-sm bg-[#111622] border border-white/10 rounded-xl p-6 md:p-8 space-y-6">
        
        {/* Salon Logo */}
        <div className="flex flex-col items-center text-center">
          <SalonLogo size="md" showSubtitle={true} showLocation={true} centered={true} />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#d4af37] mb-1.5 flex items-center gap-1.5">
              <User size={13} /> Username
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-3 py-2 text-sm bg-[#0b0f17] border border-white/10 rounded-lg focus:outline-none focus:border-[#d4af37] text-white placeholder:text-gray-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#d4af37] mb-1.5 flex items-center gap-1.5">
              <Lock size={13} /> Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 pr-10 text-sm bg-[#0b0f17] border border-white/10 rounded-lg focus:outline-none focus:border-[#d4af37] text-white placeholder:text-gray-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#d4af37] p-1 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#d4af37] hover:bg-[#c49f27] text-[#0b0f17] font-semibold text-xs tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Authorizing...</span>
            ) : (
              <span className="flex items-center gap-1.5">
                Sign In <ArrowRight size={14} />
              </span>
            )}
          </button>
        </form>

        {/* Location Footer */}
        <div className="text-center pt-2 border-t border-white/5">
          <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
            <ShieldCheck size={12} className="text-[#d4af37]" />
            Beard Lounge &bull; Farwaniya Block 1, Kuwait
          </p>
        </div>
      </div>
    </div>
  );
}


