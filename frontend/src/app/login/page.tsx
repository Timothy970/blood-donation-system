'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.login(formData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#131314] text-[#1A1A1A] dark:text-[#E5E2E3] flex flex-col justify-between p-6 selection:bg-[#FF0033] selection:text-white transition-colors duration-300">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center z-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF0033] to-[#FF5357] shadow-[0_0_15px_rgba(255,0,51,0.4)]">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <span className="font-headline font-bold text-lg text-[#1A1A1A] dark:text-[#E5E2E3]">BloodHero</span>
            <span className="block text-[9px] font-mono-hud text-[#0096C7] dark:text-[#00F1FE] uppercase tracking-widest">v2.4</span>
          </div>
        </Link>
        <ThemeToggle />
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full mx-auto glass-card p-8 rounded-3xl border border-[#E9ECEF] dark:border-[#2A2A2B] shadow-sm flex flex-col gap-6 z-10 my-8">
        <div className="flex items-center gap-3 border-b border-[#DEE2E6] dark:border-[#2A2A2B] pb-4">
          <div className="p-3 rounded-2xl bg-[#FF0033]/15 border border-[#FF0033]/30">
            <ShieldCheck className="w-7 h-7 text-[#FF5357]" />
          </div>
          <div>
            <h2 className="font-headline font-black text-2xl tracking-tight text-[#1A1A1A] dark:text-[#E5E2E3]">AUTHENTICATE SESSION</h2>
            <p className="text-xs font-mono-hud text-[#6C757D] dark:text-[#919095] mt-1">Access donor metrics, emergency alerts & live chat</p>
          </div>
        </div>

        {error && (
          <div className="bg-[#FF0033]/15 border border-[#FF0033]/30 p-3.5 rounded-2xl text-[#FF5357] text-xs font-mono-hud flex items-center gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">USERNAME OR EMAIL</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6C757D] dark:text-[#919095] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="username"
                required
                placeholder="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-3 pl-10 pr-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] placeholder-[#6C757D]/60 dark:placeholder-[#919095]/60 transition"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">PASSWORD</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6C757D] dark:text-[#919095] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-3 pl-10 pr-10 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] placeholder-[#6C757D]/60 dark:placeholder-[#919095]/60 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6C757D] dark:text-[#919095] hover:text-[#FF5357] cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-gradient-to-r from-[#FF0033] to-[#FF5357] hover:from-[#FF5357] hover:to-[#FF0033] disabled:opacity-50 text-white font-headline font-bold text-sm py-3.5 rounded-xl transition duration-200 shadow-[0_0_20px_rgba(255,0,51,0.35)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs font-mono-hud text-[#6C757D] dark:text-[#919095] pt-2 border-t border-[#DEE2E6] dark:border-[#2A2A2B]">
          NEW TO BLOODHERO?{' '}
          <Link href="/register" className="text-[#FF5357] font-bold hover:underline">
            REGISTER DONOR ACCOUNT
          </Link>
        </p>
      </div>

      {/* Bottom Footer */}
      <footer className="text-center text-[10px] font-mono-hud text-[#6C757D] dark:text-[#919095]/60 z-10">
        BLOODHERO SYSTEM v2.4 &bull; ENCRYPTED SESSION
      </footer>
    </div>
  );
}
