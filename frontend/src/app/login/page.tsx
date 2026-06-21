'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Lock, User, AlertCircle } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.login({ username, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-6 relative">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-red-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md flex flex-col gap-8 relative">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Link href="/" className="bg-red-600 p-3 rounded-2xl shadow-xl shadow-red-900/30">
            <Heart className="w-7 h-7 text-white fill-white" />
          </Link>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">Welcome Back</h2>
            <p className="text-xs text-slate-400 mt-1">Sign in to coordinate donations and track rewards</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass p-8 rounded-3xl flex flex-col gap-6 shadow-2xl">
          {error && (
            <div className="bg-red-950/40 border border-red-900/30 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Username */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-slate-950/65 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm font-semibold transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/65 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm font-semibold transition"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition duration-150 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link href="/register" className="text-red-400 font-bold hover:underline">
            Register as a Donor
          </Link>
        </p>
      </div>
    </div>
  );
}
