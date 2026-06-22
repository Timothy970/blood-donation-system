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
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <Navigation />

      {/* Main Panel */}
      <main className="flex-1 p-6 lg:p-10 max-w-4xl mx-auto w-full flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Profile Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Configure your donor metrics, contact preferences, and location accuracy</p>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            <span className="text-slate-500 font-semibold">Loading settings...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Account Overview Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass p-5 rounded-2xl border border-slate-900 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Account Username</p>
                  <p className="font-semibold text-slate-100 mt-0.5">{user?.username}</p>
                </div>
              </div>

              <div className="glass p-5 rounded-2xl border border-slate-900 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Email Address</p>
                  <p className="font-semibold text-slate-100 mt-0.5">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Notification Messages */}
            {successMsg && (
              <div className="bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 px-5 py-4 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-sm font-semibold">{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-950/30 border border-red-500/20 text-red-400 px-5 py-4 rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* Settings Form */}
            <form onSubmit={handleSave} className="glass p-6 lg:p-8 rounded-3xl border border-slate-900 flex flex-col gap-6">
              <h3 className="font-bold text-slate-100 text-lg border-b border-slate-900/60 pb-3">Personal & Health Details</h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Blood Type Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-300">Blood Type</label>
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-800 focus:border-red-500 rounded-xl px-4 py-3 text-slate-100 outline-none transition"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                      <option key={bt} value={bt} className="bg-slate-950 text-slate-100">
                        {bt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone Number Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-300">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. +254 700 000 000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 focus:border-red-500 rounded-xl pl-12 pr-4 py-3 text-slate-100 outline-none transition"
                      required
                    />
                  </div>
                </div>

                {/* City Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-300">City / Region</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. Nairobi"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 focus:border-red-500 rounded-xl pl-12 pr-4 py-3 text-slate-100 outline-none transition"
                      required
                    />
                  </div>
                </div>

                {/* Date of Birth Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-300">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 focus:border-red-500 rounded-xl pl-12 pr-4 py-3 text-slate-100 outline-none transition"
                      required
                    />
                  </div>
                </div>

                {/* Gender Toggle Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-300">Gender</label>
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
                        className={`py-3 rounded-xl border text-sm font-bold transition ${
                          gender === g.key
                            ? 'bg-red-950/30 border-red-500 text-red-500'
                            : 'bg-slate-900/20 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability Toggle Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-300">Availability</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Anyday', 'Weekdays', 'Weekends'].map((av) => (
                      <button
                        type="button"
                        key={av}
                        onClick={() => setAvailability(av)}
                        className={`py-3 rounded-xl border text-sm font-bold transition ${
                          availability === av
                            ? 'bg-red-950/30 border-red-500 text-red-500'
                            : 'bg-slate-900/20 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Geolocation Section */}
              <div className="border-t border-slate-900/60 pt-6 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                      <Compass className="w-4 h-4 text-red-500" /> GPS Geolocation Location
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Allow matching compatible blood request SOS signals near you</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {detectingLocation ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Compass className="w-3.5 h-3.5" />
                        Locate Me
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">Latitude</span>
                    <p className="font-mono text-sm text-slate-300 mt-0.5">{latitude !== null ? latitude.toFixed(6) : 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">Longitude</span>
                    <p className="font-mono text-sm text-slate-300 mt-0.5">{longitude !== null ? longitude.toFixed(6) : 'Not set'}</p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 mt-4 border-t border-slate-900/60 pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-red-950/15 transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
