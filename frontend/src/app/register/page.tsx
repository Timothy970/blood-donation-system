'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, User, Mail, Lock, Phone, MapPin, Calendar, AlertCircle, ArrowRight, UserPlus, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    date_of_birth: '',
    photo_url: '',
    availability: 'Anyday',
    gender: 'M',
    blood_type: 'A+',
    city: 'Nairobi',
    phone_number: '',
    latitude: 0,
    longitude: 0,
  });
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setLocating(false);
      },
      (err) => {
        console.error(err);
        setError('Failed to retrieve location. Please fill form manually.');
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Parse ISO timestamp for Go backend
      const dobISO = new Date(formData.date_of_birth).toISOString();
      await authApi.register({
        ...formData,
        date_of_birth: dobISO,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const availabilities = [
    { value: 'Anyday', label: 'Any Day' },
    { value: 'Weekdays', label: 'Weekdays Only' },
    { value: 'Weekends', label: 'Weekends Only' },
  ];
  const genders = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'O', label: 'Other' },
  ];

  return (
    <div className="min-h-screen bg-[#131314] text-[#E5E2E3] flex flex-col justify-between px-6 py-8 relative selection:bg-[#FF0033] selection:text-white">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-96 h-96 bg-[#FF0033]/15 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-[#00F1FE]/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Top Header Bar */}
      <header className="max-w-7xl mx-auto w-full flex justify-between items-center z-10 mb-6">
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

      {/* Form Container */}
      <div className="w-full max-w-2xl mx-auto my-auto flex flex-col gap-6 z-10">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-[#1C1B1C] border border-[#00F1FE]/40 shadow-[0_0_20px_rgba(0,241,254,0.2)]">
            <UserPlus className="w-7 h-7 text-[#00F1FE]" />
          </div>
          <div>
            <h2 className="font-headline font-black text-2xl tracking-tight text-[#E5E2E3]">REGISTER DONOR PROFILE</h2>
            <p className="text-xs font-mono-hud text-[#919095] mt-1">Join the emergency donor network & track donation rewards</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card p-8 rounded-3xl border border-[#2A2A2B] shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col gap-6">
          {error && (
            <div className="bg-[#FF0033]/15 border border-[#FF0033]/40 p-4 rounded-xl flex items-center gap-3 text-[#FF5357] text-xs font-mono-hud">
              <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 text-[#FF0033]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-5">
            {/* Username */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">USERNAME</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#919095]" />
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="donor_hero"
                  className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-[#E5E2E3] placeholder-[#919095]/60 transition"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">EMAIL ADDRESS</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#919095]" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="hero@example.com"
                  className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-[#E5E2E3] placeholder-[#919095]/60 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">PASSWORD</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#919095]" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-[#E5E2E3] placeholder-[#919095]/60 transition"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">DATE OF BIRTH</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#919095]" />
                <input
                  type="date"
                  name="date_of_birth"
                  required
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-[#E5E2E3] transition"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">PHONE NUMBER</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#919095]" />
                <input
                  type="tel"
                  name="phone_number"
                  required
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="+254700000000"
                  className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-[#E5E2E3] placeholder-[#919095]/60 transition"
                />
              </div>
            </div>

            {/* City */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">CITY / REGION</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#919095]" />
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Nairobi"
                  className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-[#E5E2E3] placeholder-[#919095]/60 transition"
                />
              </div>
            </div>

            {/* Blood Type */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">BLOOD GROUP</label>
              <select
                name="blood_type"
                value={formData.blood_type}
                onChange={handleInputChange}
                className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-3 px-4 text-sm font-semibold text-[#E5E2E3] transition"
              >
                {bloodTypes.map((type) => (
                  <option key={type} value={type} className="bg-[#0E0E0F] text-[#E5E2E3]">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">AVAILABILITY</label>
              <select
                name="availability"
                value={formData.availability}
                onChange={handleInputChange}
                className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-3 px-4 text-sm font-semibold text-[#E5E2E3] transition"
              >
                {availabilities.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0E0E0F] text-[#E5E2E3]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">GENDER</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-3 px-4 text-sm font-semibold text-[#E5E2E3] transition"
              >
                {genders.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0E0E0F] text-[#E5E2E3]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Tracker Button */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">GEO-COORDINATES</label>
              <button
                type="button"
                onClick={detectLocation}
                disabled={locating}
                className="w-full bg-[#0E0E0F] hover:bg-[#1C1B1C] border border-[#00F1FE]/40 text-[#00F1FE] font-mono-hud font-semibold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,241,254,0.1)]"
              >
                {formData.latitude !== 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#00FF94]" />
                    <span>GPS LINKED ({formData.latitude.toFixed(2)}, {formData.longitude.toFixed(2)})</span>
                  </>
                ) : locating ? (
                  <span>SCANNING SATELLITE GPS...</span>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 text-[#00F1FE]" />
                    <span>AUTO-DETECT GPS POSITION</span>
                  </>
                )}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="sm:col-span-2 mt-3 bg-gradient-to-r from-[#FF0033] to-[#FF5357] hover:from-[#FF5357] hover:to-[#FF0033] disabled:opacity-50 text-white font-headline font-bold text-sm py-3.5 rounded-xl transition duration-200 shadow-[0_0_20px_rgba(255,0,51,0.35)] hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>{loading ? 'CREATING DONOR ACCOUNT...' : 'REGISTER ACCOUNT'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs font-mono-hud text-[#919095]">
          ALREADY REGISTERED?{' '}
          <Link href="/login" className="text-[#FF5357] font-bold hover:underline">
            SIGN IN
          </Link>
        </p>
      </div>

      {/* Bottom Footer */}
      <footer className="text-center text-[10px] font-mono-hud text-[#919095]/60 z-10 mt-6">
        BLOODHERO SYSTEM v2.4 &bull; SECURE NETWORK REGISTRATION
      </footer>
    </div>
  );
}
