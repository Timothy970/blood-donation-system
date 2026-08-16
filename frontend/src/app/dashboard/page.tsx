'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { donationApi, DonationMade, RewardStatus, User } from '@/lib/api';
import { Activity, Award, Calendar, CheckCircle2, Heart, PlusCircle, Clock, MapPin, Droplet, Shield, Zap } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [donations, setDonations] = useState<DonationMade[]>([]);
  const [rewards, setRewards] = useState<RewardStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showLogForm, setShowLogForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    location: '',
    blood_type: '',
    quantity_ml: 450,
    notes: '',
  });
  const [logError, setLogError] = useState('');
  const [logSuccess, setLogSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const donationList = await donationApi.list();
      setDonations(donationList);

      const rewardStats = await donationApi.rewards();
      setRewards(rewardStats);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      setFormData((prev) => ({ ...prev, blood_type: u.profile?.blood_type || 'A+' }));
    }

    fetchDashboardData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogError('');
    setLogSuccess('');
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        quantity_ml: Number(formData.quantity_ml),
      };
      const res = await donationApi.log(payload);
      setLogSuccess(res.message);
      setShowLogForm(false);
      // Reset form
      setFormData({
        date: '',
        location: '',
        blood_type: user?.profile?.blood_type || 'A+',
        quantity_ml: 450,
        notes: '',
      });
      fetchDashboardData();
    } catch (err: any) {
      setLogError(err.message || 'Failed to log donation. Check cooling down eligibility.');
    } finally {
      setSubmitting(false);
    }
  };

  // Determine cooling period eligibility
  const getLastDonationTime = () => {
    if (donations.length === 0) return null;
    const dates = donations.map((d) => new Date(d.date).getTime());
    return new Date(Math.max(...dates));
  };

  const getCoolingDownStatus = () => {
    const lastDate = getLastDonationTime();
    if (!lastDate) return { eligible: true, message: 'You are eligible to donate!' };

    const diffDays = Math.ceil((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 56) {
      return { eligible: false, daysLeft: 56 - diffDays, message: `Cooling Down: ${56 - diffDays} days remaining.` };
    }
    return { eligible: true, message: 'You are eligible to donate!' };
  };

  const cooling = getCoolingDownStatus();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA] dark:bg-[#131314] text-[#1A1A1A] dark:text-[#E5E2E3] selection:bg-[#FF0033] selection:text-white">
      {/* Navigation */}
      <Navigation />

      {/* Main Panel */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#00FF94] pulse-active shadow-[0_0_12px_rgba(0,255,148,0.8)]" />
              <h1 className="font-headline text-3xl font-extrabold text-[#E5E2E3] tracking-tight">Donor Console</h1>
            </div>
            <p className="text-xs font-mono-hud text-[#00F1FE] mt-1 tracking-wider uppercase">MONITOR BIOLOGICAL METRICS, LOG HISTORIES & CLAIM XP REWARDS</p>
          </div>

          <button
            onClick={() => setShowLogForm(!showLogForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#FF0033] to-[#FF5357] hover:from-[#FF5357] hover:to-[#FF0033] text-white font-headline font-bold text-xs uppercase px-5 py-3 rounded-2xl shadow-[0_0_20px_rgba(255,0,51,0.4)] transition hover:scale-[1.03] active:scale-[0.98] transform duration-150"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>LOG NEW DONATION</span>
          </button>
        </div>

        {/* Dashboard grid */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <Activity className="w-10 h-10 text-[#FF5357] animate-spin" />
            <span className="text-[#919095] font-mono-hud text-xs">ASSEMBLING YOUR DONOR CONSOLE...</span>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Columns - Stats & Log form */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Form Overlay Modal-like Panel */}
              {showLogForm && (
                <div className="glass-card p-6 rounded-3xl border border-[#FF5357]/40 shadow-[0_0_30px_rgba(255,0,51,0.2)] flex flex-col gap-5">
                  <div className="flex justify-between items-center border-b border-[#2A2A2B] pb-3">
                    <h3 className="font-headline font-bold text-[#E5E2E3] text-base flex items-center gap-2">
                      <Droplet className="w-5 h-5 text-[#FF0033] fill-[#FF0033]/20" />
                      <span>LOG COMPLETED DONATION</span>
                    </h3>
                    <button onClick={() => setShowLogForm(false)} className="text-[#919095] hover:text-white font-mono-hud text-xs uppercase">
                      CANCEL
                    </button>
                  </div>

                  {logError && (
                    <div className="bg-[#FF0033]/15 border border-[#FF0033]/40 p-3.5 rounded-xl text-[#FF5357] text-xs font-mono-hud flex items-center gap-2">
                      <Clock className="w-4 h-4 flex-shrink-0 text-[#FF0033]" />
                      <span>{logError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogSubmit} className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">DATE OF DONATION</label>
                      <input
                        type="date"
                        name="date"
                        required
                        value={formData.date}
                        onChange={handleInputChange}
                        className="bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-2.5 px-4 text-sm font-semibold text-[#E5E2E3] transition"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">LOCATION (CLINIC/HOSPITAL)</label>
                      <input
                        type="text"
                        name="location"
                        required
                        placeholder="Nairobi General Hospital"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-2.5 px-4 text-sm font-semibold text-[#E5E2E3] placeholder-[#919095]/60 transition"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">BLOOD GROUP</label>
                      <select
                        name="blood_type"
                        value={formData.blood_type}
                        onChange={handleInputChange}
                        className="bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-2.5 px-4 text-sm font-semibold text-[#E5E2E3] transition"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                          <option key={type} value={type} className="bg-[#0E0E0F] text-[#E5E2E3]">
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">QUANTITY (ML)</label>
                      <input
                        type="number"
                        name="quantity_ml"
                        required
                        min="100"
                        max="1000"
                        value={formData.quantity_ml}
                        onChange={handleInputChange}
                        className="bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-2.5 px-4 text-sm font-semibold text-[#E5E2E3] transition"
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-2">
                      <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">NOTES (OPTIONAL)</label>
                      <textarea
                        name="notes"
                        rows={2}
                        placeholder="First time donor experience, stable recovery..."
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-2.5 px-4 text-sm font-semibold text-[#E5E2E3] placeholder-[#919095]/60 transition resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="sm:col-span-2 mt-2 bg-gradient-to-r from-[#FF0033] to-[#FF5357] hover:from-[#FF5357] hover:to-[#FF0033] text-white font-headline font-bold text-xs uppercase py-3.5 rounded-xl transition duration-150 shadow-[0_0_20px_rgba(255,0,51,0.35)] transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                    >
                      {submitting ? 'RECORDING LOG...' : 'SUBMIT DONATION RECORD'}
                    </button>
                  </form>
                </div>
              )}

              {/* Status Alert Notification Success banner */}
              {logSuccess && (
                <div className="bg-[#00FF94]/10 border border-[#00FF94]/30 p-4.5 rounded-3xl text-[#00FF94] text-xs font-mono-hud flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{logSuccess}</span>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid sm:grid-cols-3 gap-6">
                {/* Total Points */}
                <div className="glass-card p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden border border-[#2A2A2B] hover:border-[#FF5357]/40 transition">
                  <div className="flex flex-col gap-1">
                    <span className="text-[#919095] text-[10px] font-mono-hud uppercase tracking-wider">TOTAL POINTS</span>
                    <span className="text-3xl font-headline font-black text-[#E5E2E3]">{rewards?.total_points || 0}</span>
                  </div>
                  <div className="bg-[#FF0033]/15 border border-[#FF0033]/30 p-3 rounded-2xl text-[#FF5357]">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                {/* Badge Achievement */}
                <div className="glass-card p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden border border-[#2A2A2B] hover:border-[#00F1FE]/40 transition">
                  <div className="flex flex-col gap-1">
                    <span className="text-[#919095] text-[10px] font-mono-hud uppercase tracking-wider">REWARD TIER</span>
                    <span className="text-xl font-headline font-bold text-[#00F1FE]">{rewards?.current_badge || 'None'}</span>
                  </div>
                  <div className="bg-[#00F1FE]/15 border border-[#00F1FE]/30 p-3 rounded-2xl text-[#00F1FE]">
                    <Heart className="w-6 h-6" />
                  </div>
                </div>

                {/* Total Donations */}
                <div className="glass-card p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden border border-[#2A2A2B] hover:border-[#00FF94]/40 transition">
                  <div className="flex flex-col gap-1">
                    <span className="text-[#919095] text-[10px] font-mono-hud uppercase tracking-wider">DONATIONS LOGGED</span>
                    <span className="text-3xl font-headline font-black text-[#00FF94]">{donations.length}</span>
                  </div>
                  <div className="bg-[#00FF94]/15 border border-[#00FF94]/30 p-3 rounded-2xl text-[#00FF94]">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Donation History List */}
              <div className="glass-card p-6.5 rounded-3xl border border-[#2A2A2B] flex flex-col gap-5">
                <h3 className="font-headline font-bold text-[#E5E2E3] text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#FF5357]" />
                  <span>DONATION HISTORY LOGS</span>
                </h3>

                {donations.length === 0 ? (
                  <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                    <Droplet className="w-12 h-12 text-[#2A2A2B]" />
                    <span className="font-headline font-bold text-sm text-[#E5E2E3]">No Donations Logged Yet</span>
                    <span className="text-xs font-mono-hud text-[#919095] max-w-xs leading-normal">
                      Click the "LOG NEW DONATION" button to record your first blood donation.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {donations.map((d) => (
                      <div key={d.id} className="bg-[#0E0E0F]/80 border border-[#2A2A2B] p-4.5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-[#FF5357]/40 transition">
                        <div className="flex gap-4.5 items-start">
                          <div className="bg-[#FF0033]/20 border border-[#FF0033]/40 p-3 rounded-2xl text-[#FF5357] font-mono-hud font-extrabold text-xs text-center min-w-[56px]">
                            {d.blood_type}
                          </div>
                          <div>
                            <p className="font-headline font-bold text-[#E5E2E3] text-sm flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#00F1FE]" /> {d.location}
                            </p>
                            <p className="text-xs font-mono-hud text-[#919095] mt-1 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#919095]" /> {new Date(d.date).toLocaleDateString()}
                            </p>
                            {d.notes && <p className="text-xs italic text-[#919095] mt-2">"{d.notes}"</p>}
                          </div>
                        </div>

                        <div className="flex flex-col text-right sm:items-end justify-between self-end sm:self-center gap-1">
                          <span className="text-xs font-mono-hud text-[#919095]">{d.quantity_ml} ml</span>
                          <span className="text-sm font-headline font-black text-[#00FF94]">+{d.points_earned} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Profile Summary / Eligibility */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Eligibility card */}
              <div className={`p-6 rounded-3xl border flex flex-col gap-4 shadow-sm relative overflow-hidden ${
                cooling.eligible 
                  ? 'bg-[#00FF94]/10 border-[#00FF94]/30 text-[#00FF94]' 
                  : 'bg-[#FF0033]/10 border-[#FF0033]/30 text-[#FF5357]'
              }`}>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="font-headline font-bold text-sm">DONATION ELIGIBILITY</span>
                  {cooling.eligible ? (
                    <span className="bg-[#00FF94] text-black text-[10px] font-mono-hud font-extrabold uppercase px-2 py-0.5 rounded-md">ELIGIBLE</span>
                  ) : (
                    <span className="bg-[#FF0033] text-white text-[10px] font-mono-hud font-extrabold uppercase px-2.5 py-0.5 rounded-md">COOLING</span>
                  )}
                </div>
                <div className="flex items-start gap-4">
                  <div className={`p-3.5 rounded-2xl ${cooling.eligible ? 'bg-[#00FF94]/20 text-[#00FF94]' : 'bg-[#FF0033]/20 text-[#FF5357]'}`}>
                    {cooling.eligible ? <CheckCircle2 className="w-7 h-7" /> : <Clock className="w-7 h-7 animate-pulse" />}
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-[#E5E2E3] text-base leading-tight">
                      {cooling.eligible ? 'Ready to Donate' : 'Waiting Period'}
                    </h4>
                    <p className="text-xs font-mono-hud text-[#919095] mt-1.5 leading-relaxed">{cooling.message}</p>
                  </div>
                </div>
                {!cooling.eligible && (
                  <div className="text-xs font-mono-hud text-[#919095] leading-normal border-t border-white/10 pt-3">
                    A minimum of 56 days is required between whole blood donations to ensure red blood cell recovery.
                  </div>
                )}
              </div>

              {/* Pre-donation test card */}
              <div className="glass-card p-6 rounded-3xl border border-[#2A2A2B] flex flex-col gap-4">
                <h4 className="font-headline font-bold text-[#E5E2E3] text-sm">ELIGIBILITY CHECKLIST</h4>
                <p className="text-xs font-mono-hud text-[#919095] leading-normal">
                  Before booking an appointment, please review the requirements below:
                </p>
                <div className="flex flex-col gap-2.5">
                  {[
                    'Age: You must be 16 years or older.',
                    'Weight: Minimum weight of 50 kg (110 lbs).',
                    'Health: Feel well and healthy on donation day.',
                    'Interim: Wait at least 56 days since last donation.',
                  ].map((rule, idx) => (
                    <div key={idx} className="flex gap-3 text-xs font-sans text-[#E5E2E3]">
                      <span className="text-[#FF5357] font-bold">•</span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
