'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, User, Mail, Lock, Phone, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { authApi } from '@/lib/api';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-12 px-6 relative">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-80 h-80 bg-red-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-2xl flex flex-col gap-8 relative">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Link href="/" className="bg-red-600 p-3 rounded-2xl shadow-xl shadow-red-900/30">
            <Heart className="w-7 h-7 text-white fill-white" />
          </Link>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-100">Create Donor Profile</h2>
            <p className="text-xs text-slate-400 mt-1">Register to start logging donations and receiving alerts</p>
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

          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-5">
            {/* Username */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="donor_hero"
                  className="w-full bg-slate-950/65 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm font-semibold transition"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="hero@example.com"
                  className="w-full bg-slate-950/65 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm font-semibold transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/65 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm font-semibold transition"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="date"
                  name="date_of_birth"
                  required
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/65 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm font-semibold transition"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="tel"
                  name="phone_number"
                  required
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="+254700000000"
                  className="w-full bg-slate-950/65 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm font-semibold transition"
                />
              </div>
            </div>

            {/* City */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">City</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Nairobi"
                  className="w-full bg-slate-950/65 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm font-semibold transition"
                />
              </div>
            </div>

            {/* Blood Type */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Blood Group</label>
              <select
                name="blood_type"
                value={formData.blood_type}
                onChange={handleInputChange}
                className="w-full bg-slate-950/65 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-3 px-4 text-sm font-semibold transition"
              >
                {bloodTypes.map((type) => (
                  <option key={type} value={type} className="bg-slate-950">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Availability</label>
              <select
                name="availability"
                value={formData.availability}
                onChange={handleInputChange}
                className="w-full bg-slate-950/65 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-3 px-4 text-sm font-semibold transition"
              >
                {availabilities.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-950">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full bg-slate-950/65 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-3 px-4 text-sm font-semibold transition"
              >
                {genders.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-950">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Tracker */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Geo-Coordinates (For SOS Matching)</label>
              <button
                type="button"
                onClick={detectLocation}
                disabled={locating}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold py-3 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2"
              >
                <MapPin className={`w-4 h-4 text-red-500 ${locating ? 'animate-bounce' : ''}`} />
                {formData.latitude !== 0 ? 'Location Detected ✓' : locating ? 'Locating...' : 'Use Current GPS'}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="sm:col-span-2 mt-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition duration-150 transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link href="/login" className="text-red-400 font-bold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
