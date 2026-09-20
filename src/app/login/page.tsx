'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, getStoredUser } from '@/lib/salonApi';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('beardlounge');
  const [password, setPassword] = useState('Beard@123');
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
        setError(res.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Beard Lounge
          </h1>
          <p className="text-xs text-slate-500 mt-1">Premium Salon &bull; Sign in to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setUsername('admin');
              setPassword('admin@123');
            }}
            className="text-slate-500 hover:text-slate-900 underline transition-colors"
          >
            Admin (<strong>admin</strong>)
          </button>
          <span className="text-slate-300">&bull;</span>
          <button
            type="button"
            onClick={() => {
              setUsername('beardlounge');
              setPassword('Beard@123');
            }}
            className="text-slate-500 hover:text-slate-900 underline transition-colors"
          >
            Staff (<strong>beardlounge</strong>)
          </button>
        </div>
      </div>
    </div>
  );
}
