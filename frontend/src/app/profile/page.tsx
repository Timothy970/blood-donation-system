'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { authApi, getCurrentUser, User } from '@/lib/api';
import { User as UserIcon, Phone, MapPin, Calendar, Compass, Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ProfileSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('M');
  const [availability, setAvailability] = useState('Anyday');
  const [bloodType, setBloodType] = useState('A+');
  const [dob, setDob] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const profile = currentUser.profile;
      if (profile) {
        setPhone(profile.phone_number || '');
        setCity(profile.city || '');
        setGender(profile.gender || 'M');
        setAvailability(profile.availability || 'Anyday');
        setBloodType(profile.blood_type || 'A+');
        setLatitude(profile.latitude || null);
        setLongitude(profile.longitude || null);
        if (profile.date_of_birth) {
          // Format date of birth to YYYY-MM-DD for input[type="date"]
          const date = new Date(profile.date_of_birth);
          if (!isNaN(date.getTime())) {
            setDob(date.toISOString().split('T')[0]);
          }
        }
      }
    }
    setLoading(false);
  }, []);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    setErrorMsg('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setDetectingLocation(false);
      },
      (error) => {
        console.error('Error fetching location:', error);
        setErrorMsg('Failed to obtain location access. Please verify permissions.');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        phone_number: phone,
        city: city,
        gender: gender,
        availability: availability,
        blood_type: bloodType,
        latitude: latitude ? Number(latitude) : 0,
        longitude: longitude ? Number(longitude) : 0,
        date_of_birth: dob ? new Date(dob).toISOString() : undefined,
      };

      const res = await authApi.updateProfile(payload);
      setSuccessMsg(res.message || 'Profile updated successfully!');
      
      // Update local state and trigger side navigation update
      if (res.user) {
        setUser(res.user);
        window.dispatchEvent(new Event('profileUpdate'));
      }

      // Hide success message after 4 seconds
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA] dark:bg-[#131314] text-[#1A1A1A] dark:text-[#E5E2E3] selection:bg-[#FF0033] selection:text-white">
      {/* Navigation */}
      <Navigation />

      {/* Main Panel */}
      <main className="flex-1 p-6 lg:p-10 max-w-4xl mx-auto w-full flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#00FF94] pulse-active shadow-[0_0_12px_rgba(0,255,148,0.8)]" />
            <h1 className="font-headline text-2xl lg:text-3xl font-extrabold text-[#E5E2E3] tracking-tight">Digital Donor Card & Profile</h1>
          </div>
          <p className="text-xs font-mono-hud text-[#00F1FE] tracking-wider uppercase">CLINIC SCAN IDENTIFIER & BIOLOGICAL PROFILE METRICS</p>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="w-10 h-10 text-[#FF5357] animate-spin" />
            <span className="text-[#919095] font-mono-hud text-sm">INITIALIZING DONOR METRICS...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Holographic Digital Donor Card */}
            <div className="relative overflow-hidden p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-[#1C1B1C] via-[#2A2A2B] to-[#0E0E0F] border border-white/15 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
              {/* Scanline backdrop */}
              <div className="absolute inset-0 bg-[radial-gradient(#00F1FE_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-[#00FF94]/15 border border-[#00FF94]/40 text-[#00FF94] font-mono-hud text-xs font-bold tracking-widest uppercase">
                      ✓ ELIGIBLE DONOR
                    </span>
                    <span className="text-xs font-mono-hud text-[#919095]">ID: BH-884920</span>
                  </div>

                  <h2 className="font-headline font-black text-2xl lg:text-3xl text-white tracking-tight">{user?.username}</h2>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono-hud text-[#919095]">
                    <span>CITY: <strong className="text-white">{city || 'NAIROBI'}</strong></span>
                    <span>•</span>
                    <span>PHONE: <strong className="text-[#00F1FE]">{phone || 'UNREGISTERED'}</strong></span>
                  </div>
                </div>

                {/* Blood Group Badge & Mock QR */}
                <div className="flex items-center gap-4 bg-[#0E0E0F]/80 p-4 rounded-2xl border border-[#00F1FE]/30 shadow-[inset_0_0_15px_rgba(0,241,254,0.1)]">
                  <div className="flex flex-col items-center justify-center p-3 bg-[#1C1B1C] rounded-xl border border-white/10">
                    <div className="w-14 h-14 bg-white p-1 rounded-lg flex items-center justify-center">
                      {/* Stylized QR Code placeholder matrix */}
                      <div className="w-full h-full bg-[#0E0E0F] grid grid-cols-4 gap-0.5 p-0.5 rounded">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className={`rounded-[1px] ${i % 3 === 0 || i % 5 === 0 ? 'bg-white' : 'bg-transparent'}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-[9px] font-mono-hud text-[#919095] mt-1">SCAN QR</span>
                  </div>

                  <div className="flex flex-col items-center justify-center px-4">
                    <span className="text-[10px] font-mono-hud text-[#919095] uppercase">BLOOD TYPE</span>
                    <span className="font-headline font-black text-3xl text-[#FF5357] drop-shadow-[0_0_10px_rgba(255,83,87,0.5)]">
                      {bloodType}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Messages */}
            {successMsg && (
              <div className="bg-[#00FF94]/15 border border-[#00FF94]/30 text-[#00FF94] px-5 py-4 rounded-2xl flex items-center gap-3 font-mono-hud text-xs">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-[#FF0033]/15 border border-[#FF0033]/30 text-[#FF5357] px-5 py-4 rounded-2xl flex items-center gap-3 font-mono-hud text-xs">
                <AlertCircle className="w-5 h-5 shrink-0 text-[#FF0033]" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Settings Form Card */}
            <form onSubmit={handleSave} className="glass-card p-6 lg:p-8 rounded-3xl border border-[#2A2A2B] flex flex-col gap-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between border-b border-[#2A2A2B] pb-3">
                <h3 className="font-headline font-bold text-[#E5E2E3] text-base uppercase tracking-wider">
                  PERSONAL & HEALTH METRICS
                </h3>
                <span className="text-[10px] font-mono-hud text-[#00F1FE] uppercase">SECURE INPUT</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Blood Type Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">BLOOD GROUP</label>
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl px-4 py-3 text-[#E5E2E3] text-sm font-semibold outline-none transition"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                      <option key={bt} value={bt} className="bg-[#0E0E0F] text-[#E5E2E3]">
                        {bt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone Number Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">PHONE NUMBER</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-4.5 h-4.5 text-[#919095]" />
                    <input
                      type="text"
                      placeholder="e.g. +254 700 000 000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl pl-11 pr-4 py-3 text-[#E5E2E3] text-sm font-semibold placeholder-[#919095]/60 outline-none transition"
                      required
                    />
                  </div>
                </div>

                {/* City Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">CITY / REGION</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 w-4.5 h-4.5 text-[#919095]" />
                    <input
                      type="text"
                      placeholder="e.g. Nairobi"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl pl-11 pr-4 py-3 text-[#E5E2E3] text-sm font-semibold placeholder-[#919095]/60 outline-none transition"
                      required
                    />
                  </div>
                </div>

                {/* Date of Birth Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">DATE OF BIRTH</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-3.5 w-4.5 h-4.5 text-[#919095]" />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl pl-11 pr-4 py-3 text-[#E5E2E3] text-sm font-semibold outline-none transition"
                      required
                    />
                  </div>
                </div>

                {/* Gender Toggle Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">GENDER</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'M', label: 'Male' },
                      { key: 'F', label: 'Female' },
                      { key: 'O', label: 'Other' },
                    ].map((g) => (
                      <button
                        type="button"
                        key={g.key}
                        onClick={() => setGender(g.key)}
                        className={`py-3 rounded-xl border text-xs font-mono-hud font-bold transition ${
                          gender === g.key
                            ? 'bg-[#FF0033]/20 border-[#FF0033]/40 text-[#FF5357] shadow-[0_0_10px_rgba(255,0,51,0.2)]'
                            : 'bg-[#0E0E0F] border-[#2A2A2B] text-[#919095] hover:text-[#E5E2E3]'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability Toggle Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">AVAILABILITY</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Anyday', 'Weekdays', 'Weekends'].map((av) => (
                      <button
                        type="button"
                        key={av}
                        onClick={() => setAvailability(av)}
                        className={`py-3 rounded-xl border text-xs font-mono-hud font-bold transition ${
                          availability === av
                            ? 'bg-[#FF0033]/20 border-[#FF0033]/40 text-[#FF5357] shadow-[0_0_10px_rgba(255,0,51,0.2)]'
                            : 'bg-[#0E0E0F] border-[#2A2A2B] text-[#919095] hover:text-[#E5E2E3]'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Geolocation Section */}
              <div className="border-t border-[#2A2A2B] pt-6 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <h4 className="font-headline font-bold text-[#E5E2E3] text-sm flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#00F1FE]" />
                      <span>GPS GEOLOCATION SYNC</span>
                    </h4>
                    <p className="text-xs font-mono-hud text-[#919095] mt-0.5">Automates matching with nearby hospital SOS blood requests</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    className="bg-[#0E0E0F] border border-[#00F1FE]/40 hover:border-[#00F1FE] text-[#00F1FE] font-mono-hud font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition disabled:opacity-50 shadow-[0_0_15px_rgba(0,241,254,0.1)]"
                  >
                    {detectingLocation ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>LOCATING...</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-3.5 h-3.5" />
                        <span>LOCATE GPS POSITION</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-[#0E0E0F]/80 border border-[#2A2A2B] p-4 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-[#919095] font-mono-hud uppercase">LATITUDE</span>
                    <p className="font-mono text-sm text-[#00F1FE] font-bold mt-0.5">{latitude !== null ? latitude.toFixed(6) : 'NOT SET'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#919095] font-mono-hud uppercase">LONGITUDE</span>
                    <p className="font-mono text-sm text-[#00F1FE] font-bold mt-0.5">{longitude !== null ? longitude.toFixed(6) : 'NOT SET'}</p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 mt-4 border-t border-[#2A2A2B] pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-[#FF0033] to-[#FF5357] hover:from-[#FF5357] hover:to-[#FF0033] text-white font-headline font-bold text-xs uppercase px-7 py-3.5 rounded-xl shadow-[0_0_20px_rgba(255,0,51,0.35)] transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>SAVE PROFILE SETTINGS</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
