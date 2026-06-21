'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { donationApi, DonationMade, RewardStatus, User } from '@/lib/api';
import { Activity, Award, Calendar, CheckCircle2, Heart, PlusCircle, Clock, MapPin, Droplet } from 'lucide-react';

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
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <Navigation />

      {/* Main Panel */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Donor Console</h1>
            <p className="text-sm text-slate-400 mt-1">Monitor metrics, schedule bookings, and claim rewards</p>
          </div>

          <button
            onClick={() => setShowLogForm(!showLogForm)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-red-950/20 transition hover:scale-[1.03] active:scale-[0.98] transform duration-150"
          >
            <PlusCircle className="w-5 h-5" />
            Log New Donation
          </button>
        </div>

        {/* Dashboard grid */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <Activity className="w-10 h-10 text-red-500 animate-spin" />
            <span className="text-slate-500 font-semibold">Assembling your console...</span>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Columns - Stats & Log form */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Form Overlay Modal-like Panel */}
              {showLogForm && (
                <div className="glass p-6 rounded-3xl border border-red-500/20 shadow-2xl flex flex-col gap-5">
                  <div className="flex justify-between items-center border-b border-slate-900/60 pb-3">
                    <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                      <Droplet className="w-5 h-5 text-red-500 fill-red-500/20" /> Log Completed Donation
                    </h3>
                    <button onClick={() => setShowLogForm(false)} className="text-slate-400 hover:text-white text-xs">
                      Cancel
                    </button>
                  </div>

                  {logError && (
                    <div className="bg-red-950/40 border border-red-900/30 p-3.5 rounded-xl text-red-400 text-xs flex items-center gap-2">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{logError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogSubmit} className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-400">Date of Donation</label>
                      <input
                        type="date"
                        name="date"
                        required
                        value={formData.date}
                        onChange={handleInputChange}
                        className="bg-slate-950 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-2.5 px-4 text-sm font-semibold transition"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-400">Location (Clinic/Hospital)</label>
                      <input
                        type="text"
                        name="location"
                        required
                        placeholder="Nairobi General Hospital"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="bg-slate-950 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-2.5 px-4 text-sm font-semibold transition"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-400">Blood Group</label>
                      <select
                        name="blood_type"
                        value={formData.blood_type}
                        onChange={handleInputChange}
                        className="bg-slate-950 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-2.5 px-4 text-sm font-semibold transition"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                          <option key={type} value={type} className="bg-slate-950">
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-400">Quantity (ml)</label>
                      <input
                        type="number"
                        name="quantity_ml"
                        required
                        min="100"
                        max="1000"
                        value={formData.quantity_ml}
                        onChange={handleInputChange}
                        className="bg-slate-950 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-2.5 px-4 text-sm font-semibold transition"
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-400">Notes (Optional)</label>
                      <textarea
                        name="notes"
                        rows={2}
                        placeholder="First time donor experience, stable recovery..."
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="bg-slate-950 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-2.5 px-4 text-sm font-semibold transition resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="sm:col-span-2 mt-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-3.5 rounded-xl transition duration-150 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Log Record'}
                    </button>
                  </form>
                </div>
              )}

              {/* Status Alert Notification Success banner */}
              {logSuccess && (
                <div className="bg-emerald-950/30 border border-emerald-900/30 p-4.5 rounded-3xl text-emerald-400 text-sm flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{logSuccess}</span>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid sm:grid-cols-3 gap-6">
                {/* Total Points */}
                <div className="glass p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-red-600/5 blur-[25px] rounded-full pointer-events-none" />
                  <div className="flex flex-col gap-2">
                    <span className="text-slate-400 text-xs font-semibold">Total Points</span>
                    <span className="text-3xl font-black text-slate-100">{rewards?.total_points || 0}</span>
                  </div>
                  <div className="bg-red-950/40 border border-red-900/20 p-3 rounded-2xl text-red-500">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                {/* Badge Achievement */}
                <div className="glass p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-red-600/5 blur-[25px] rounded-full pointer-events-none" />
                  <div className="flex flex-col gap-2">
                    <span className="text-slate-400 text-xs font-semibold">Reward Tier</span>
                    <span className="text-xl font-bold text-red-500">{rewards?.current_badge || 'None'}</span>
                  </div>
                  <div className="bg-red-950/40 border border-red-900/20 p-3 rounded-2xl text-red-500">
                    <Heart className="w-6 h-6" />
                  </div>
                </div>

                {/* Total Donations */}
                <div className="glass p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-red-600/5 blur-[25px] rounded-full pointer-events-none" />
                  <div className="flex flex-col gap-2">
                    <span className="text-slate-400 text-xs font-semibold">Total Donations</span>
                    <span className="text-3xl font-black text-slate-100">{donations.length}</span>
                  </div>
                  <div className="bg-red-950/40 border border-red-900/20 p-3 rounded-2xl text-red-500">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Donation History List */}
              <div className="glass p-6.5 rounded-3xl flex flex-col gap-5">
                <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-500" /> Donation Logs
                </h3>

                {donations.length === 0 ? (
                  <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                    <Droplet className="w-12 h-12 text-slate-800 fill-slate-900/20" />
                    <span className="font-bold text-sm text-slate-400">No Donations Logged Yet</span>
                    <span className="text-xs text-slate-500 max-w-xs leading-normal">
                      Click the "Log New Donation" button in the upper right to record your first blood donation.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {donations.map((d) => (
                      <div key={d.id} className="bg-slate-950/40 border border-slate-900 p-4.5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-800 transition">
                        <div className="flex gap-4.5 items-start">
                          <div className="bg-red-950/30 border border-red-900/25 p-3 rounded-2xl text-red-500 font-extrabold text-xs text-center min-w-[56px]">
                            {d.blood_type}
                          </div>
                          <div>
                            <p className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" /> {d.location}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" /> {new Date(d.date).toLocaleDateString()}
                            </p>
                            {d.notes && <p className="text-xs italic text-slate-500 mt-2">"{d.notes}"</p>}
                          </div>
                        </div>

                        <div className="flex flex-col text-right sm:items-end justify-between self-end sm:self-center gap-1">
                          <span className="text-xs font-semibold text-slate-400">{d.quantity_ml} ml</span>
                          <span className="text-sm font-black text-emerald-400">+{d.points_earned} XP</span>
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
                  ? 'bg-emerald-950/10 border-emerald-900/35 text-emerald-400' 
                  : 'bg-red-950/10 border-red-900/35 text-red-400'
              }`}>
                <div className="absolute right-0 bottom-0 w-24 h-24 opacity-5 pointer-events-none" />
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="font-bold text-sm">Donation Status</span>
                  {cooling.eligible ? (
                    <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md">Eligible</span>
                  ) : (
                    <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">Cooling</span>
                  )}
                </div>
                <div className="flex items-start gap-4">
                  <div className={`p-3.5 rounded-2xl ${cooling.eligible ? 'bg-emerald-900/20 text-emerald-500' : 'bg-red-900/20 text-red-500'}`}>
                    {cooling.eligible ? <CheckCircle2 className="w-7 h-7" /> : <Clock className="w-7 h-7 animate-pulse" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-base leading-tight">
                      {cooling.eligible ? 'Ready to Donate' : 'Waiting Period'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{cooling.message}</p>
                  </div>
                </div>
                {!cooling.eligible && (
                  <div className="text-xs text-slate-500 leading-normal border-t border-white/5 pt-3">
                    A minimum of 56 days is required between whole blood donations to ensure proper red blood cell recovery.
                  </div>
                )}
              </div>

              {/* Pre-donation test card */}
              <div className="glass p-6 rounded-3xl border border-slate-900 flex flex-col gap-4">
                <h4 className="font-bold text-slate-100 text-sm">Eligibility Checklist</h4>
                <p className="text-xs text-slate-400 leading-normal">
                  Before booking an appointment, please review the requirements below:
                </p>
                <div className="flex flex-col gap-2.5">
                  {[
                    'Age: You must be 16 years or older.',
                    'Weight: Minimum weight of 50 kg (110 lbs).',
                    'Health: Feel well and healthy on donation day.',
                    'Interim: Wait at least 56 days since last donation.',
                  ].map((rule, idx) => (
                    <div key={idx} className="flex gap-3 text-xs text-slate-300">
                      <span className="text-red-500 font-extrabold">•</span>
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
