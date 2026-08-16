'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Lock, Mail, User, UserPlus, ArrowRight, AlertCircle, Phone, MapPin, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    phone_number: '',
    city: '',
    blood_type: 'A+',
    gender: 'M',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await authApi.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number,
        city: formData.city,
        blood_type: formData.blood_type,
        gender: formData.gender,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to register account. Ensure username and email are unique.');
    } finally {
      setLoading(false);
    }
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = [
    { key: 'M', label: 'Male' },
    { key: 'F', label: 'Female' },
    { key: 'O', label: 'Other' }
  ];

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

      {/* Register Card */}
      <div className="max-w-2xl w-full mx-auto glass-card p-8 rounded-3xl border border-[#E9ECEF] dark:border-[#2A2A2B] shadow-sm flex flex-col gap-6 z-10 my-8">
        <div className="flex items-center gap-3 border-b border-[#DEE2E6] dark:border-[#2A2A2B] pb-4">
          <div className="p-3 rounded-2xl bg-[#0096C7]/15 dark:bg-[#00F1FE]/15 border border-[#0096C7]/30 dark:border-[#00F1FE]/30">
            <UserPlus className="w-7 h-7 text-[#0096C7] dark:text-[#00F1FE]" />
          </div>
          <div>
            <h2 className="font-headline font-black text-2xl tracking-tight text-[#1A1A1A] dark:text-[#E5E2E3]">REGISTER DONOR PROFILE</h2>
            <p className="text-xs font-mono-hud text-[#6C757D] dark:text-[#919095] mt-1">Join the emergency donor network & track donation rewards</p>
          </div>
        </div>

        {error && (
          <div className="bg-[#FF0033]/15 border border-[#FF0033]/30 p-3.5 rounded-2xl text-[#FF5357] text-xs font-mono-hud flex items-center gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 text-[#FF0033]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">USERNAME</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#6C757D] dark:text-[#919095] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="username"
                required
                placeholder="john_doe"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] placeholder-[#6C757D]/60 dark:placeholder-[#919095]/60 transition"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">EMAIL ADDRESS</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6C757D] dark:text-[#919095] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                required
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] placeholder-[#6C757D]/60 dark:placeholder-[#919095]/60 transition"
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
                className="w-full bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 pl-10 pr-10 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] placeholder-[#6C757D]/60 dark:placeholder-[#919095]/60 transition"
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

          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">CONFIRM PASSWORD</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6C757D] dark:text-[#919095] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirm_password"
                required
                placeholder="••••••••"
                value={formData.confirm_password}
                onChange={handleInputChange}
                className="w-full bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 pl-10 pr-10 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] placeholder-[#6C757D]/60 dark:placeholder-[#919095]/60 transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6C757D] dark:text-[#919095] hover:text-[#FF5357] cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">PHONE NUMBER</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#6C757D] dark:text-[#919095] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="phone_number"
                required
                placeholder="+254 700 000 000"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] placeholder-[#6C757D]/60 dark:placeholder-[#919095]/60 transition"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">CITY / REGION</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#6C757D] dark:text-[#919095] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="city"
                required
                placeholder="Nairobi"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] placeholder-[#6C757D]/60 dark:placeholder-[#919095]/60 transition"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">BLOOD TYPE</label>
            <select
              name="blood_type"
              value={formData.blood_type}
              onChange={handleInputChange}
              className="w-full bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] transition"
            >
              {bloodTypes.map(t => (
                <option key={t} value={t} className="bg-[#FFFFFF] dark:bg-[#0E0E0F] text-[#1A1A1A] dark:text-[#E5E2E3]">{t}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">GENDER</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] transition"
            >
              {genders.map(g => (
                <option key={g.key} value={g.key} className="bg-[#FFFFFF] dark:bg-[#0E0E0F] text-[#1A1A1A] dark:text-[#E5E2E3]">{g.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="sm:col-span-2 mt-3 bg-gradient-to-r from-[#FF0033] to-[#FF5357] hover:from-[#FF5357] hover:to-[#FF0033] disabled:opacity-50 text-white font-headline font-bold text-sm py-3.5 rounded-xl transition duration-200 shadow-[0_0_20px_rgba(255,0,51,0.35)] hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{loading ? 'CREATING DONOR ACCOUNT...' : 'REGISTER ACCOUNT'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs font-mono-hud text-[#6C757D] dark:text-[#919095]">
          ALREADY REGISTERED?{' '}
          <Link href="/login" className="text-[#FF5357] font-bold hover:underline">
            SIGN IN
          </Link>
        </p>
      </div>

      {/* Bottom Footer */}
      <footer className="text-center text-[10px] font-mono-hud text-[#6C757D] dark:text-[#919095]/60 z-10 mt-6">
        BLOODHERO SYSTEM v2.4 &bull; SECURE NETWORK REGISTRATION
      </footer>
    </div>
  );
}
