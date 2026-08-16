'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { AlertCircle, PlusCircle, MapPin, Phone, CheckCircle, Activity, Users, Navigation as NavIcon, MessageSquare } from 'lucide-react';
import { requestApi, getCurrentUser, BloodRequest, chatApi } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    blood_type: 'A+',
    contact_number: '',
    location: '',
    latitude: 0,
    longitude: 0,
    is_emergency: false,
  });

  const [matchedDonors, setMatchedDonors] = useState<any[]>([]);
  const [locating, setLocating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setFormData(prev => ({
        ...prev,
        first_name: user.username,
        contact_number: user.profile?.phone_number || '',
        location: user.profile?.city || '',
      }));
    }
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await requestApi.list();
      setRequests(data || []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load blood requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setFormData({
      ...formData,
      [target.name]: value,
    });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setLocating(false);
      },
      (err) => {
        console.error(err);
        setError('Could not get position. Please input location manually.');
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setMatchedDonors([]);
    setSubmitting(true);

    try {
      const result = await requestApi.create({
        first_name: formData.first_name,
        last_name: formData.last_name,
        blood_type: formData.blood_type,
        contact_number: formData.contact_number,
        location: formData.location,
        latitude: formData.latitude ? Number(formData.latitude) : 0,
        longitude: formData.longitude ? Number(formData.longitude) : 0,
        is_emergency: formData.is_emergency,
      });

      setSuccess('SOS Alert broadcasted successfully to the network!');
      if (result.matching_donors && result.matching_donors.length > 0) {
        setMatchedDonors(result.matching_donors);
      }

      setShowForm(false);
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'Failed to broadcast SOS request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartChat = (otherUser: any) => {
    router.push(`/chat?other_id=${otherUser.id}`);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA] dark:bg-[#131314] text-[#1A1A1A] dark:text-[#E5E2E3]">
      <Navigation />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 glass-card p-6 rounded-3xl border border-[#E9ECEF] dark:border-white/10 backdrop-blur-xl shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#FF0033] pulse-active shadow-[0_0_12px_rgba(255,0,51,0.8)]" />
              <h1 className="font-headline text-2xl lg:text-3xl font-extrabold text-[#1A1A1A] dark:text-[#E5E2E3] tracking-tight">SOS Emergency Network</h1>
            </div>
            <p className="text-xs font-mono-hud text-[#0096C7] dark:text-[#00F1FE] mt-1.5 tracking-wider uppercase">REAL-TIME PROXIMITY & BIOLOGICAL COMPATIBILITY MATCHING</p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setMatchedDonors([]);
            }}
            className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#FF0033] to-[#FF5357] hover:from-[#FF0033] hover:to-[#FF5357] text-white font-headline font-bold text-sm px-6 py-3.5 rounded-2xl shadow-[0_0_25px_rgba(255,0,51,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] transform cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-white" />
            <span>BROADCAST EMERGENCY SOS</span>
          </button>
        </div>

        {/* Messaging Results Banner */}
        {success && (
          <div className="bg-[#00FF94]/15 border border-[#00FF94]/30 p-4.5 rounded-3xl text-[#00A86B] dark:text-[#00FF94] text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold">{success}</p>
              {matchedDonors.length > 0 && (
                <p className="text-xs mt-1 text-[#00A86B] dark:text-[#00FF94]">
                  Found {matchedDonors.length} matching compatible donors within distance! See match details below.
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-[#FF0033]/15 border border-[#FF0033]/30 p-4 rounded-2xl text-[#FF5357] text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Matching Donors Result Grid */}
        {matchedDonors.length > 0 && (
          <div className="glass-card border border-[#00A86B]/30 dark:border-[#00FF94]/30 p-6.5 rounded-3xl flex flex-col gap-4 shadow-sm">
            <h3 className="font-extrabold text-[#1A1A1A] dark:text-[#E5E2E3] text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FF5357]" /> Compatible Matches Found Nearby
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {matchedDonors.map((donor, idx) => (
                <div key={idx} className="bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] p-4.5 rounded-2xl hover:border-[#FF5357]/40 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-[#1A1A1A] dark:text-[#E5E2E3] text-sm">{donor.username}</p>
                      <p className="text-xs text-[#6C757D] dark:text-[#919095] flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0096C7] dark:text-[#00F1FE]" /> {donor.city}
                      </p>
                    </div>
                    <span className="bg-[#FF0033]/15 border border-[#FF0033]/30 text-[#FF5357] text-xs font-black px-2.5 py-1 rounded-xl">
                      {donor.blood_type}
                    </span>
                  </div>
                  <div className="mt-4 pt-3.5 border-t border-[#DEE2E6] dark:border-[#2A2A2B] flex justify-between items-center text-xs">
                    <span className="text-[#6C757D] dark:text-[#919095] font-medium">Distance: {donor.distance_km || 'unknown'} km</span>
                    <button
                      onClick={() => handleStartChat(donor)}
                      className="text-[#FF5357] font-bold hover:underline cursor-pointer"
                    >
                      Chat Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <Activity className="w-10 h-10 text-[#FF5357] animate-spin" />
            <span className="text-[#6C757D] dark:text-[#919095] font-semibold">Tuning Blood Heroes...</span>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Create Request Form Overlay */}
            {showForm && (
              <div className="lg:col-span-12 glass-card p-6 rounded-3xl border border-[#FF5357]/40 shadow-sm flex flex-col gap-5">
                <div className="flex justify-between items-center border-b border-[#DEE2E6] dark:border-[#2A2A2B] pb-3">
                  <h3 className="font-bold text-[#1A1A1A] dark:text-[#E5E2E3] text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-[#FF5357] animate-pulse" /> Broadcast SOS Request
                  </h3>
                  <button onClick={() => setShowForm(false)} className="text-[#6C757D] dark:text-[#919095] hover:text-[#FF5357] text-xs cursor-pointer">
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095]">RECIPIENT FIRST NAME</label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095]">RECIPIENT LAST NAME</label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095]">REQUIRED BLOOD GROUP</label>
                    <select
                      name="blood_type"
                      value={formData.blood_type}
                      onChange={handleInputChange}
                      className="bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3]"
                    >
                      {bloodTypes.map(t => (
                        <option key={t} value={t} className="bg-[#FFFFFF] dark:bg-[#0E0E0F] text-[#1A1A1A] dark:text-[#E5E2E3]">{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095]">CONTACT PHONE NUMBER</label>
                    <input
                      type="text"
                      name="contact_number"
                      required
                      placeholder="+254 700 000 000"
                      value={formData.contact_number}
                      onChange={handleInputChange}
                      className="bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] placeholder-[#6C757D]/60 dark:placeholder-[#919095]/60"
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095]">HOSPITAL / CLINIC LOCATION</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="location"
                        required
                        placeholder="Kenyatta National Hospital, Nairobi"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="flex-1 bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] placeholder-[#6C757D]/60 dark:placeholder-[#919095]/60"
                      />
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={locating}
                        className="bg-[#DEE2E6] dark:bg-[#2A2A2B] hover:bg-[#FF5357] hover:text-white text-[#1A1A1A] dark:text-[#E5E2E3] px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <NavIcon className="w-3.5 h-3.5" />
                        {locating ? 'GPS...' : 'GPS'}
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-3 flex items-center justify-between pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_emergency"
                        checked={formData.is_emergency}
                        onChange={handleInputChange}
                        className="w-4 h-4 rounded text-[#FF5357] focus:ring-[#FF5357]"
                      />
                      <span className="text-xs font-bold text-[#FF5357]">Mark as High-Priority Critical Emergency SOS</span>
                    </label>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-gradient-to-r from-[#FF0033] to-[#FF5357] hover:from-[#FF5357] hover:to-[#FF0033] text-white font-bold text-xs uppercase px-8 py-3 rounded-xl transition shadow-[0_0_15px_rgba(255,0,51,0.4)] disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? 'BROADCASTING...' : 'TRANSMIT SOS ALERT'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List of Active Requests */}
            <div className="lg:col-span-12 flex flex-col gap-4">
              {requests.length === 0 ? (
                <div className="glass-card p-12 rounded-3xl border border-[#DEE2E6] dark:border-[#2A2A2B] text-center flex flex-col items-center justify-center gap-3">
                  <AlertCircle className="w-10 h-10 text-[#6C757D] dark:text-[#919095]/40" />
                  <p className="font-bold text-[#1A1A1A] dark:text-[#E5E2E3] text-sm">No Active Emergency SOS Broadcasts</p>
                  <p className="text-xs text-[#6C757D] dark:text-[#919095]">All blood requests in your region are currently fulfilled.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className={`glass-card p-6 rounded-3xl border transition flex flex-col justify-between gap-5 relative overflow-hidden ${
                        req.is_emergency 
                          ? 'border-[#FF0033]/40 shadow-[0_0_20px_rgba(255,0,51,0.15)]' 
                          : 'border-[#E9ECEF] dark:border-[#2A2A2B]'
                      }`}
                    >
                      {req.is_emergency && (
                        <div className="absolute top-0 right-0 bg-[#FF0033] text-white text-[9px] font-mono-hud font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider pulse-active">
                          CRITICAL SOS
                        </div>
                      )}

                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-headline font-bold text-[#1A1A1A] dark:text-[#E5E2E3] text-base">{req.first_name} {req.last_name}</h4>
                            <p className="text-xs text-[#0096C7] dark:text-[#00F1FE] font-mono-hud mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {req.location}
                            </p>
                          </div>
                          <span className="bg-[#FF0033]/15 border border-[#FF0033]/30 text-[#FF5357] font-mono-hud font-extrabold text-sm px-3 py-1 rounded-xl">
                            {req.blood_type}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono-hud text-[#6C757D] dark:text-[#919095]">
                          <Phone className="w-3.5 h-3.5 text-[#FF5357]" />
                          <span>{req.contact_number}</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#E9ECEF] dark:border-[#2A2A2B] flex items-center justify-between">
                        <span className="text-[10px] font-mono-hud text-[#6C757D] dark:text-[#919095]">
                          {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <a
                          href={`https://wa.me/${req.contact_number.replace(/[^\d]/g, '')}?text=Hello,%20I%20saw%20your%20BloodHero%20SOS%20request%20for%20${req.blood_type}%20blood`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#00A86B]/15 dark:bg-[#00FF94]/15 hover:bg-[#00A86B]/30 border border-[#00A86B]/30 text-[#00A86B] dark:text-[#00FF94] text-xs font-bold px-3.5 py-1.5 rounded-xl transition"
                        >
                          Respond
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
