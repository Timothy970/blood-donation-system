'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { User, Phone, MapPin, Activity, CheckCircle, AlertCircle, Save, Navigation as NavIcon } from 'lucide-react';
import { authApi, getCurrentUser, rewardApi, Reward } from '@/lib/api';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rewards, setRewards] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingLoc, setDetectingLoc] = useState(false);

  const [formData, setFormData] = useState({
    phone_number: '',
    city: '',
    blood_type: 'O-',
    gender: 'M',
    availability: 'Anyday',
    latitude: 0,
    longitude: 0,
  });

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      const profile = user.profile;
      if (profile) {
        setFormData({
          phone_number: profile.phone_number || '',
          city: profile.city || '',
          blood_type: profile.blood_type || 'O-',
          gender: profile.gender || 'M',
          availability: profile.availability || 'Anyday',
          latitude: profile.latitude || 0,
          longitude: profile.longitude || 0,
        });
      }
    }

    rewardApi.get()
      .then(res => setRewards(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setDetectingLoc(false);
      },
      (err) => {
        console.error(err);
        setError('Could not get device location. Enter city manually.');
        setDetectingLoc(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!formData.phone_number.trim()) {
      setError('Phone Number is required.');
      return;
    }
    if (!formData.city.trim()) {
      setError('City / Region is required.');
      return;
    }

    setSaving(true);
    try {
      await authApi.updateProfile({
        phone_number: formData.phone_number,
        city: formData.city,
        blood_type: formData.blood_type,
        gender: formData.gender,
        availability: formData.availability,
        latitude: Number(formData.latitude) || 0,
        longitude: Number(formData.longitude) || 0,
      });

      setSuccess('Profile metrics updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = [
    { key: 'M', label: 'Male' },
    { key: 'F', label: 'Female' },
    { key: 'O', label: 'Other' },
  ];
  const availabilityOptions = ['Anyday', 'Weekdays', 'Weekends'];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA] dark:bg-[#131314] text-[#1A1A1A] dark:text-[#E5E2E3] selection:bg-[#FF0033] selection:text-white">
      {/* Navigation */}
      <Navigation />

      {/* Main Container */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#00FF94] pulse-active shadow-[0_0_12px_rgba(0,255,148,0.8)]" />
            <h1 className="font-headline text-3xl font-extrabold text-[#1A1A1A] dark:text-[#E5E2E3] tracking-tight">Digital Donor Card & Profile</h1>
          </div>
          <p className="text-xs font-mono-hud text-[#0096C7] dark:text-[#00F1FE] mt-1 tracking-wider uppercase">CLINIC SCAN IDENTIFIER & BIOLOGICAL PROFILE METRICS</p>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <Activity className="w-10 h-10 text-[#FF5357] animate-spin" />
            <span className="text-[#6C757D] dark:text-[#919095] font-mono-hud text-xs">ASSEMBLING YOUR DONOR PROFILE...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Holographic Digital Donor Card */}
            <div className="relative overflow-hidden p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-[#F1F3F5] via-white to-[#F1F3F5] dark:from-[#1C1B1C] dark:via-[#2A2A2B] dark:to-[#0E0E0F] border border-[#DEE2E6] dark:border-white/15 shadow-sm">
              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono-hud font-bold text-[#0096C7] dark:text-[#00F1FE] uppercase tracking-widest">BLOODHERO MEMBER ID</span>
                    <h2 className="font-headline font-black text-2xl lg:text-3xl text-[#1A1A1A] dark:text-[#E5E2E3] mt-1">{currentUser?.username}</h2>
                    <p className="text-xs font-mono-hud text-[#6C757D] dark:text-[#919095] mt-1">BH-884920 &bull; NAIROBI REGISTRY</p>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-[#FF0033] text-white font-mono-hud font-black text-2xl shadow-[0_0_20px_rgba(255,0,51,0.5)]">
                    {formData.blood_type}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-[#DEE2E6] dark:border-white/10 text-xs font-mono-hud">
                  <div>
                    <span className="text-[#6C757D] dark:text-[#919095] block text-[9px] uppercase">CITY / REGION</span>
                    <span className="text-[#1A1A1A] dark:text-[#E5E2E3] font-bold mt-0.5 block">{formData.city || 'Nairobi'}</span>
                  </div>
                  <div>
                    <span className="text-[#6C757D] dark:text-[#919095] block text-[9px] uppercase">CONTACT PHONE</span>
                    <span className="text-[#1A1A1A] dark:text-[#E5E2E3] font-bold mt-0.5 block">{formData.phone_number || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="text-[#6C757D] dark:text-[#919095] block text-[9px] uppercase">AVAILABILITY</span>
                    <span className="text-[#00A86B] dark:text-[#00FF94] font-bold mt-0.5 block">{formData.availability}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-mono-hud">
                  <span className="text-[#00A86B] dark:text-[#00FF94] font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> VERIFIED DONOR HERO
                  </span>
                  <span className="text-[#FF5357] font-headline font-bold">♥ BLOODHERO</span>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="glass-card p-6 lg:p-8 rounded-3xl border border-[#E9ECEF] dark:border-[#2A2A2B] flex flex-col gap-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-[#DEE2E6] dark:border-[#2A2A2B] pb-4">
                <h3 className="font-headline font-bold text-[#1A1A1A] dark:text-[#E5E2E3] text-base uppercase tracking-wider">
                  PERSONAL & HEALTH METRICS
                </h3>
                <span className="text-[10px] font-mono-hud text-[#0096C7] dark:text-[#00F1FE] uppercase">SECURE INPUT</span>
              </div>

              {success && (
                <div className="bg-[#00FF94]/15 border border-[#00FF94]/30 p-4 rounded-2xl text-[#00A86B] dark:text-[#00FF94] text-xs font-mono-hud flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div className="bg-[#FF0033]/15 border border-[#FF0033]/30 p-4 rounded-2xl text-[#FF5357] text-xs font-mono-hud flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#FF0033]" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">PHONE NUMBER</label>
                    <input
                      type="text"
                      name="phone_number"
                      required
                      placeholder="+254 700 000 000"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-3 px-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] placeholder-[#6C757D]/60 dark:placeholder-[#919095]/60 transition"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">CITY / REGION</label>
                    <input
                      type="text"
                      name="city"
                      required
                      placeholder="e.g. Mombasa"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-3 px-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] placeholder-[#6C757D]/60 dark:placeholder-[#919095]/60 transition"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">BLOOD TYPE</label>
                    <select
                      name="blood_type"
                      value={formData.blood_type}
                      onChange={handleInputChange}
                      className="bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-3 px-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] transition"
                    >
                      {bloodTypes.map(t => (
                        <option key={t} value={t} className="bg-[#FFFFFF] dark:bg-[#0E0E0F] text-[#1A1A1A] dark:text-[#E5E2E3]">{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">GENDER</label>
                    <div className="grid grid-cols-3 gap-2">
                      {genders.map(g => (
                        <button
                          key={g.key}
                          type="button"
                          onClick={() => setFormData({ ...formData, gender: g.key })}
                          className={`py-3 rounded-xl text-xs font-mono-hud font-bold border transition cursor-pointer ${
                            formData.gender === g.key
                              ? 'bg-[#FF0033]/15 border-[#FF5357] text-[#FF5357]'
                              : 'bg-[#F1F3F5] dark:bg-[#0E0E0F] border-[#DEE2E6] dark:border-[#2A2A2B] text-[#6C757D] dark:text-[#919095] hover:text-[#1A1A1A] dark:hover:text-white'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">AVAILABILITY</label>
                    <div className="grid grid-cols-3 gap-2">
                      {availabilityOptions.map(av => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setFormData({ ...formData, availability: av })}
                          className={`py-3 rounded-xl text-xs font-mono-hud font-bold border transition cursor-pointer ${
                            formData.availability === av
                              ? 'bg-[#FF0033]/15 border-[#FF5357] text-[#FF5357]'
                              : 'bg-[#F1F3F5] dark:bg-[#0E0E0F] border-[#DEE2E6] dark:border-[#2A2A2B] text-[#6C757D] dark:text-[#919095] hover:text-[#1A1A1A] dark:hover:text-white'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* GPS Coordinates Bar */}
                <div className="p-4 rounded-2xl bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-headline font-bold text-sm text-[#1A1A1A] dark:text-[#E5E2E3]">GPS Location Coordinates</p>
                    <p className="text-xs font-mono-hud text-[#6C757D] dark:text-[#919095] mt-0.5">
                      Lat: <strong className="text-[#0096C7] dark:text-[#00F1FE]">{formData.latitude ? formData.latitude.toFixed(6) : 'Not synced'}</strong> &bull; Long: <strong className="text-[#0096C7] dark:text-[#00F1FE]">{formData.longitude ? formData.longitude.toFixed(6) : 'Not synced'}</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={detectingLoc}
                    className="bg-[#DEE2E6] dark:bg-[#2A2A2B] hover:bg-[#0096C7] dark:hover:bg-[#00F1FE] hover:text-white dark:hover:text-black text-[#1A1A1A] dark:text-[#E5E2E3] px-4 py-2.5 rounded-xl text-xs font-mono-hud font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <NavIcon className="w-4 h-4" />
                    <span>{detectingLoc ? 'LOCATING...' : 'SYNC DEVICE GPS'}</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-2 bg-gradient-to-r from-[#FF0033] to-[#FF5357] hover:from-[#FF5357] hover:to-[#FF0033] text-white font-headline font-bold text-xs uppercase py-4 rounded-2xl transition duration-150 shadow-[0_0_25px_rgba(255,0,51,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'SAVING METRICS...' : 'SAVE PROFILE METRICS'}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
