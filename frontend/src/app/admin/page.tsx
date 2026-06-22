'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { adminApi, AdminStats, User, Booking, BloodRequest, getCurrentUser } from '@/lib/api';
import { Shield, Users, Calendar, AlertCircle, Droplet, Clock, CheckCircle2, Trash2, Activity, UserMinus, ToggleLeft, Heart } from 'lucide-react';

type TabType = 'overview' | 'bookings' | 'alerts' | 'users';

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Data State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  
  // Status State
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadAdminData = async () => {
    try {
      const [statsData, usersData, bookingsData, requestsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.listUsers(),
        adminApi.listBookings(),
        adminApi.listRequests()
      ]);
      setStats(statsData);
      setUsers(usersData);
      setBookings(bookingsData);
      setRequests(requestsData);
    } catch (err: any) {
      console.error('Failed to load admin console data:', err);
      setError(err.message || 'Access denied or failed to load statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setCurrentUser(user);
    loadAdminData();
  }, []);

  const handleUpdateBooking = async (id: number, status: 'Completed' | 'Cancelled') => {
    setSubmittingId(id);
    setError('');
    setSuccess('');
    try {
      await adminApi.updateBooking(id, status);
      setSuccess(`Booking slot successfully marked as ${status}.`);
      loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Failed to update scheduled slot.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteRequest = async (id: number) => {
    if (!confirm('Are you sure you want to resolve and delete this SOS request?')) return;
    setSubmittingId(id);
    setError('');
    setSuccess('');
    try {
      await adminApi.deleteRequest(id);
      setSuccess('SOS emergency request successfully closed.');
      loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve emergency request.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('CAUTION: Are you sure you want to permanently delete this user account? This deletes all profiles, logs, and booking contexts.')) return;
    if (currentUser && currentUser.id === id) {
      setError("You cannot delete your own admin account.");
      return;
    }
    setSubmittingId(id);
    setError('');
    setSuccess('');
    try {
      await adminApi.deleteUser(id);
      setSuccess('User account successfully removed.');
      loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user.');
    } finally {
      setSubmittingId(null);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Navigation />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-500 fill-red-500/10" /> Admin Console
            </h1>
            <p className="text-sm text-slate-400 mt-1">Global oversight of matches, scheduled slots, and active users</p>
          </div>
        </div>

        {/* Alerts Banner */}
        {success && (
          <div className="bg-emerald-950/30 border border-emerald-900/30 p-4.5 rounded-3xl text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-950/30 border border-red-900/30 p-4.5 rounded-3xl text-red-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-slate-900 flex gap-1 overflow-x-auto pb-px">
          {(['overview', 'bookings', 'alerts', 'users'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setError('');
                setSuccess('');
              }}
              className={`px-6 py-3 border-b-2 font-bold text-sm uppercase transition whitespace-nowrap ${
                activeTab === tab
                  ? 'border-red-600 text-red-500 bg-red-950/5'
                  : 'border-transparent text-slate-400 hover:text-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
            <Activity className="w-10 h-10 text-red-500 animate-spin" />
            <span className="text-slate-500 font-semibold">Tuning Blood Heroes...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-8">
                {/* Stats Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Donors */}
                  <div className="glass p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 w-20 h-20 bg-red-600/5 blur-[20px] rounded-full pointer-events-none" />
                    <div className="flex flex-col gap-2">
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Members</span>
                      <span className="text-3xl font-black text-slate-100">{stats?.total_users || 0}</span>
                    </div>
                    <div className="bg-red-950/40 border border-red-900/20 p-3 rounded-2xl text-red-500">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Total Logged Donations */}
                  <div className="glass p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 w-20 h-20 bg-red-600/5 blur-[20px] rounded-full pointer-events-none" />
                    <div className="flex flex-col gap-2">
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Logged Donations</span>
                      <span className="text-3xl font-black text-slate-100">{stats?.total_donations || 0}</span>
                    </div>
                    <div className="bg-red-950/40 border border-red-900/20 p-3 rounded-2xl text-red-500">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Total Volume Collected */}
                  <div className="glass p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 w-20 h-20 bg-red-600/5 blur-[20px] rounded-full pointer-events-none" />
                    <div className="flex flex-col gap-2">
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Volume (ml)</span>
                      <span className="text-3xl font-black text-slate-100">
                        {stats?.total_donation_volume_ml ? `${stats.total_donation_volume_ml} ml` : '0 ml'}
                      </span>
                    </div>
                    <div className="bg-red-950/40 border border-red-900/20 p-3 rounded-2xl text-red-500">
                      <Droplet className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Active SOS requests */}
                  <div className="glass p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 w-20 h-20 bg-red-600/5 blur-[20px] rounded-full pointer-events-none" />
                    <div className="flex flex-col gap-2">
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active SOS</span>
                      <span className="text-3xl font-black text-slate-100">{stats?.total_active_requests || 0}</span>
                    </div>
                    <div className="bg-red-950/40 border border-red-900/20 p-3 rounded-2xl text-red-500">
                      <AlertCircle className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Status Guide */}
                <div className="glass p-6 rounded-3xl border border-slate-900 flex flex-col gap-4">
                  <h3 className="font-extrabold text-slate-100 text-base">Administrative Operations Checklist</h3>
                  <div className="grid md:grid-cols-3 gap-6 text-xs leading-relaxed text-slate-400">
                    <div className="flex flex-col gap-1 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                      <span className="font-bold text-slate-100 text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" /> Donation Verification
                      </span>
                      Verify that booked donors completed their intake, check blood types, and mark schedules as completed to award matching XP badges.
                    </div>
                    <div className="flex flex-col gap-1 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                      <span className="font-bold text-slate-100 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" /> SOS Resolution
                      </span>
                      Review the active SOS table. Clean up alerts that have been successfully resolved by clinics or match completions.
                    </div>
                    <div className="flex flex-col gap-1 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                      <span className="font-bold text-slate-100 text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" /> Account Moderation
                      </span>
                      Monitor profiles for spam, ensure correct blood group entries, and perform profile audits to protect clinical intake integrity.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === 'bookings' && (
              <div className="glass p-6.5 rounded-3xl border border-slate-900 flex flex-col gap-5 shadow-lg">
                <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-500" /> User Scheduled Bookings
                </h3>

                {bookings.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                    <Calendar className="w-12 h-12 text-slate-800" />
                    <span className="font-bold text-sm text-slate-400">No Bookings Recorded</span>
                    <span className="text-xs text-slate-500">Scheduled appointments will appear here.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-400 font-semibold text-xs uppercase">
                          <th className="py-3 px-4">Donor Name</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Time Slot</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="border-b border-slate-900/60 hover:bg-slate-900/10 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-100">
                              {booking.first_name} {booking.last_name}
                            </td>
                            <td className="py-3.5 px-4 text-slate-300">
                              {new Date(booking.date).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">{booking.time_slot}</td>
                            <td className="py-3.5 px-4 text-slate-400">{booking.location}</td>
                            <td className="py-3.5 px-4">
                              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                                booking.status === 'Pending'
                                  ? 'bg-amber-950/30 border-amber-900/30 text-amber-500'
                                  : booking.status === 'Completed'
                                    ? 'bg-emerald-950/30 border-emerald-900/30 text-emerald-400'
                                    : 'bg-slate-900 border-slate-800 text-slate-500'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {booking.status === 'Pending' && (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleUpdateBooking(booking.id, 'Completed')}
                                    disabled={submittingId === booking.id}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition disabled:opacity-50"
                                  >
                                    Verify Complete
                                  </button>
                                  <button
                                    onClick={() => handleUpdateBooking(booking.id, 'Cancelled')}
                                    disabled={submittingId === booking.id}
                                    className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold px-3 py-1.5 rounded-xl text-xs border border-slate-800 transition disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SOS ALERTS TAB */}
            {activeTab === 'alerts' && (
              <div className="glass p-6.5 rounded-3xl border border-slate-900 flex flex-col gap-5 shadow-lg">
                <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" /> Active Emergency SOS Broadcasts
                </h3>

                {requests.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                    <Heart className="w-12 h-12 text-slate-800" />
                    <span className="font-bold text-sm text-slate-400">No Emergency Alerts Active</span>
                    <span className="text-xs text-slate-500">Critical blood stock requirements are stable.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-400 font-semibold text-xs uppercase">
                          <th className="py-3 px-4">Recipient Name</th>
                          <th className="py-3 px-4">Blood Group</th>
                          <th className="py-3 px-4">Contact Number</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Flag</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map((req) => (
                          <tr key={req.id} className="border-b border-slate-900/60 hover:bg-slate-900/10 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-100">
                              {req.first_name} {req.last_name}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="bg-red-600/10 border border-red-900/30 text-red-500 font-black text-xs px-2.5 py-1 rounded-lg">
                                {req.blood_type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">{req.contact_number}</td>
                            <td className="py-3.5 px-4 text-slate-400">{req.location}</td>
                            <td className="py-3.5 px-4">
                              {req.is_emergency ? (
                                <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase pulse-sos">SOS Emergency</span>
                              ) : (
                                <span className="bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">Standard</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteRequest(req.id)}
                                disabled={submittingId === req.id}
                                className="text-slate-500 hover:text-red-400 p-2 rounded-xl transition hover:bg-slate-900/50 disabled:opacity-50"
                                title="Resolve Request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* USERS DIRECTORY TAB */}
            {activeTab === 'users' && (
              <div className="glass p-6.5 rounded-3xl border border-slate-900 flex flex-col gap-5 shadow-lg">
                <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-500" /> Registered Member Directory
                </h3>

                {users.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                    <Users className="w-12 h-12 text-slate-800" />
                    <span className="font-bold text-sm text-slate-400">No Members Found</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-400 font-semibold text-xs uppercase">
                          <th className="py-3 px-4">Username</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Blood Group</th>
                          <th className="py-3 px-4">Availability</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b border-slate-900/60 hover:bg-slate-900/10 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-100">
                              {u.username}
                            </td>
                            <td className="py-3.5 px-4 text-slate-300">{u.email}</td>
                            <td className="py-3.5 px-4">
                              <span className="bg-red-950/40 border border-red-900/25 text-red-500 font-black text-xs px-2.5 py-1 rounded-lg">
                                {u.profile?.blood_type || 'A+'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">{u.profile?.availability || 'Anyday'}</td>
                            <td className="py-3.5 px-4">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                u.role === 'admin' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-slate-900 border border-slate-800 text-slate-400'
                              }`}>
                                {u.role || 'user'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {u.role !== 'admin' && (
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  disabled={submittingId === u.id}
                                  className="text-slate-500 hover:text-red-400 p-2 rounded-xl transition hover:bg-slate-900/50 disabled:opacity-50"
                                  title="Delete User Account"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
