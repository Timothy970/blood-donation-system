'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { authApi } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

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
    <div className="min-h-screen bg-[#131314] text-[#E5E2E3] flex flex-col justify-between px-6 py-8 relative selection:bg-[#FF0033] selection:text-white">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF0033]/15 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#00F1FE]/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Top Header Bar */}
      <header className="max-w-7xl mx-auto w-full flex justify-between items-center z-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF0033] to-[#FF5357] shadow-[0_0_15px_rgba(255,0,51,0.4)]">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <span className="font-headline font-bold text-lg text-[#E5E2E3]">BloodHero</span>
            <span className="block text-[9px] font-mono-hud text-[#00F1FE] uppercase tracking-widest">v2.4</span>
          </div>
        </Link>
        <ThemeToggle />
      </header>

      {/* Center Form Card */}
      <div className="w-full max-w-md mx-auto my-auto flex flex-col gap-6 z-10">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-[#1C1B1C] border border-[#FF5357]/40 shadow-[0_0_20px_rgba(255,0,51,0.2)]">
            <ShieldCheck className="w-7 h-7 text-[#FF5357]" />
          </div>
          <div>
            <h2 className="font-headline font-black text-2xl tracking-tight text-[#E5E2E3]">AUTHENTICATE SESSION</h2>
            <p className="text-xs font-mono-hud text-[#919095] mt-1">Access donor metrics, emergency alerts & live chat</p>
          </div>
        </div>

        {/* Card Container */}
        <div className="glass-card p-8 rounded-3xl border border-[#2A2A2B] shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col gap-6">
          {error && (
            <div className="bg-[#FF0033]/15 border border-[#FF0033]/40 p-4 rounded-xl flex items-center gap-3 text-[#FF5357] text-xs font-mono-hud">
              <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 text-[#FF0033]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Username Field */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">USERNAME</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#919095]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-[#E5E2E3] placeholder-[#919095]/60 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">PASSWORD</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#919095]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-[#E5E2E3] placeholder-[#919095]/60 transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-gradient-to-r from-[#FF0033] to-[#FF5357] hover:from-[#FF5357] hover:to-[#FF0033] disabled:opacity-50 text-white font-headline font-bold text-sm py-3.5 rounded-xl transition duration-200 shadow-[0_0_20px_rgba(255,0,51,0.35)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-xs font-mono-hud text-[#919095]">
          NEW TO BLOODHERO?{' '}
          <Link href="/register" className="text-[#FF5357] font-bold hover:underline">
            REGISTER DONOR ACCOUNT
          </Link>
        </p>
      </div>

      {/* Bottom Footer */}
      <footer className="text-center text-[10px] font-mono-hud text-[#919095]/60 z-10">
        BLOODHERO SYSTEM v2.4 &bull; ENCRYPTED SESSION
      </footer>
    </div>
  );
}
