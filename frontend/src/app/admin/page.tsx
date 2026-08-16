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
      setSuccess('User account successfully purged.');
      loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user.');
    } finally {
      setSubmittingId(null);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA] dark:bg-[#131314] text-[#1A1A1A] dark:text-[#E5E2E3] selection:bg-[#FF0033] selection:text-white">
      <Navigation />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#00FF94] pulse-active shadow-[0_0_12px_rgba(0,255,148,0.8)]" />
              <h1 className="font-headline text-3xl font-extrabold text-[#E5E2E3] tracking-tight flex items-center gap-3">
                <Shield className="w-8 h-8 text-[#FF5357]" />
                <span>Admin Console</span>
              </h1>
            </div>
            <p className="text-xs font-mono-hud text-[#00F1FE] mt-1 tracking-wider uppercase">GLOBAL OVERSIGHT OF MATCHES, SCHEDULED SLOTS & USER REGISTRIES</p>
          </div>
        </div>

        {/* Alerts Banner */}
        {success && (
          <div className="bg-[#00FF94]/15 border border-[#00FF94]/30 p-4.5 rounded-3xl text-[#00FF94] text-xs font-mono-hud flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="bg-[#FF0033]/15 border border-[#FF0033]/30 p-4.5 rounded-3xl text-[#FF5357] text-xs font-mono-hud flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#FF0033]" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-[#2A2A2B] flex gap-2 overflow-x-auto pb-px">
          {(['overview', 'bookings', 'alerts', 'users'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setError('');
                setSuccess('');
              }}
              className={`px-6 py-3 border-b-2 font-headline font-bold text-xs uppercase tracking-wider transition whitespace-nowrap ${
                activeTab === tab
                  ? 'border-[#FF0033] text-[#FF5357] bg-[#FF0033]/10'
                  : 'border-transparent text-[#919095] hover:text-[#E5E2E3]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
            <Activity className="w-10 h-10 text-[#FF5357] animate-spin" />
            <span className="text-[#919095] font-mono-hud text-xs">TUNING ADMIN CHANNELS...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-8">
                {/* Stats Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Donors */}
                  <div className="glass-card p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden border border-[#2A2A2B]">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#919095] text-[10px] font-mono-hud uppercase tracking-wider">TOTAL MEMBERS</span>
                      <span className="text-3xl font-headline font-black text-[#E5E2E3]">{stats?.total_users || 0}</span>
                    </div>
                    <div className="bg-[#FF0033]/15 border border-[#FF0033]/30 p-3 rounded-2xl text-[#FF5357]">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Total Logged Donations */}
                  <div className="glass-card p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden border border-[#2A2A2B]">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#919095] text-[10px] font-mono-hud uppercase tracking-wider">LOGGED DONATIONS</span>
                      <span className="text-3xl font-headline font-black text-[#E5E2E3]">{stats?.total_donations || 0}</span>
                    </div>
                    <div className="bg-[#FF0033]/15 border border-[#FF0033]/30 p-3 rounded-2xl text-[#FF5357]">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Total Volume Collected */}
                  <div className="glass-card p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden border border-[#2A2A2B]">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#919095] text-[10px] font-mono-hud uppercase tracking-wider">VOLUME (ML)</span>
                      <span className="text-3xl font-headline font-black text-[#00FF94]">
                        {stats?.total_donation_volume_ml ? `${stats.total_donation_volume_ml} ml` : '0 ml'}
                      </span>
                    </div>
                    <div className="bg-[#00FF94]/15 border border-[#00FF94]/30 p-3 rounded-2xl text-[#00FF94]">
                      <Droplet className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Active SOS requests */}
                  <div className="glass-card p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden border border-[#2A2A2B]">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#919095] text-[10px] font-mono-hud uppercase tracking-wider">ACTIVE SOS</span>
                      <span className="text-3xl font-headline font-black text-[#00F1FE]">{stats?.total_active_requests || 0}</span>
                    </div>
                    <div className="bg-[#00F1FE]/15 border border-[#00F1FE]/30 p-3 rounded-2xl text-[#00F1FE]">
                      <AlertCircle className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Status Guide */}
                <div className="glass-card p-6 rounded-3xl border border-[#2A2A2B] flex flex-col gap-4">
                  <h3 className="font-headline font-bold text-[#E5E2E3] text-base uppercase tracking-wider">ADMINISTRATIVE OPERATIONS CHECKLIST</h3>
                  <div className="grid md:grid-cols-3 gap-6 text-xs leading-relaxed text-[#919095]">
                    <div className="flex flex-col gap-1 bg-[#0E0E0F] p-4 rounded-xl border border-[#2A2A2B]">
                      <span className="font-headline font-bold text-[#E5E2E3] text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#FFAB00]" /> Donation Verification
                      </span>
                      Verify that booked donors completed their intake, check blood types, and mark schedules as completed to award matching XP badges.
                    </div>
                    <div className="flex flex-col gap-1 bg-[#0E0E0F] p-4 rounded-xl border border-[#2A2A2B]">
                      <span className="font-headline font-bold text-[#E5E2E3] text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[#FF5357] animate-pulse" /> SOS Resolution
                      </span>
                      Review the active SOS table. Clean up alerts that have been successfully resolved by clinics or match completions.
                    </div>
                    <div className="flex flex-col gap-1 bg-[#0E0E0F] p-4 rounded-xl border border-[#2A2A2B]">
                      <span className="font-headline font-bold text-[#E5E2E3] text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#00F1FE]" /> Account Moderation
                      </span>
                      Monitor profiles for spam, ensure correct blood group entries, and perform profile audits to protect clinical intake integrity.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === 'bookings' && (
              <div className="glass-card p-6.5 rounded-3xl border border-[#2A2A2B] flex flex-col gap-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <h3 className="font-headline font-bold text-[#E5E2E3] text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#FF5357]" />
                  <span>USER SCHEDULED BOOKINGS</span>
                </h3>

                {bookings.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                    <Calendar className="w-12 h-12 text-[#2A2A2B]" />
                    <span className="font-headline font-bold text-sm text-[#E5E2E3]">No Bookings Recorded</span>
                    <span className="text-xs font-mono-hud text-[#919095]">Scheduled appointments will appear here.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-sm border-collapse font-sans">
                      <thead>
                        <tr className="border-b border-[#2A2A2B] text-[#919095] font-mono-hud font-semibold text-xs uppercase">
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
                          <tr key={booking.id} className="border-b border-[#2A2A2B]/60 hover:bg-[#1C1B1C]/50 transition">
                            <td className="py-3.5 px-4 font-headline font-bold text-[#E5E2E3]">
                              {booking.first_name} {booking.last_name}
                            </td>
                            <td className="py-3.5 px-4 font-mono-hud text-xs text-[#919095]">
                              {new Date(booking.date).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 font-mono-hud text-xs text-[#919095]">{booking.time_slot}</td>
                            <td className="py-3.5 px-4 font-mono-hud text-xs text-[#00F1FE]">{booking.location}</td>
                            <td className="py-3.5 px-4">
                              <span className={`text-[10px] font-mono-hud font-extrabold uppercase px-2.5 py-1 rounded-lg border ${
                                booking.status === 'Pending'
                                  ? 'bg-[#FFAB00]/15 border-[#FFAB00]/40 text-[#FFAB00]'
                                  : booking.status === 'Completed'
                                    ? 'bg-[#00FF94]/15 border-[#00FF94]/40 text-[#00FF94]'
                                    : 'bg-[#0E0E0F] border-[#2A2A2B] text-[#919095]'
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
                                    className="bg-[#00FF94]/20 hover:bg-[#00FF94]/30 text-[#00FF94] font-headline font-bold px-3 py-1.5 rounded-xl text-xs border border-[#00FF94]/40 transition disabled:opacity-50"
                                  >
                                    Verify Complete
                                  </button>
                                  <button
                                    onClick={() => handleUpdateBooking(booking.id, 'Cancelled')}
                                    disabled={submittingId === booking.id}
                                    className="bg-[#1C1B1C] hover:bg-[#2A2A2B] text-[#919095] font-headline font-semibold px-3 py-1.5 rounded-xl text-xs border border-[#2A2A2B] transition disabled:opacity-50"
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
              <div className="glass-card p-6.5 rounded-3xl border border-[#2A2A2B] flex flex-col gap-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <h3 className="font-headline font-bold text-[#E5E2E3] text-base flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#FF5357] animate-pulse" />
                  <span>ACTIVE EMERGENCY SOS BROADCASTS</span>
                </h3>

                {requests.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                    <Heart className="w-12 h-12 text-[#2A2A2B]" />
                    <span className="font-headline font-bold text-sm text-[#E5E2E3]">No Emergency Alerts Active</span>
                    <span className="text-xs font-mono-hud text-[#919095]">Critical blood stock requirements are stable.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-[#2A2A2B] text-[#919095] font-mono-hud font-semibold text-xs uppercase">
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
                          <tr key={req.id} className="border-b border-[#2A2A2B]/60 hover:bg-[#1C1B1C]/50 transition">
                            <td className="py-3.5 px-4 font-headline font-bold text-[#E5E2E3]">
                              {req.first_name} {req.last_name}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="bg-[#FF0033]/20 border border-[#FF0033]/40 text-[#FF5357] font-mono-hud font-black text-xs px-2.5 py-1 rounded-lg">
                                {req.blood_type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono-hud text-xs text-[#919095]">{req.contact_number}</td>
                            <td className="py-3.5 px-4 font-mono-hud text-xs text-[#00F1FE]">{req.location}</td>
                            <td className="py-3.5 px-4">
                              {req.is_emergency ? (
                                <span className="bg-[#FF0033] text-white font-mono-hud font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase pulse-active shadow-[0_0_10px_rgba(255,0,51,0.6)]">SOS Emergency</span>
                              ) : (
                                <span className="bg-[#0E0E0F] border border-[#2A2A2B] text-[#919095] text-[10px] font-mono-hud font-bold uppercase px-2.5 py-1 rounded-lg">Standard</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteRequest(req.id)}
                                disabled={submittingId === req.id}
                                className="text-[#919095] hover:text-[#FF5357] p-2 rounded-xl transition hover:bg-[#1C1B1C] disabled:opacity-50"
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
              <div className="glass-card p-6.5 rounded-3xl border border-[#2A2A2B] flex flex-col gap-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <h3 className="font-headline font-bold text-[#E5E2E3] text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#FF5357]" />
                  <span>REGISTERED MEMBER DIRECTORY</span>
                </h3>

                {users.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                    <Users className="w-12 h-12 text-[#2A2A2B]" />
                    <span className="font-headline font-bold text-sm text-[#E5E2E3]">No Members Found</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-[#2A2A2B] text-[#919095] font-mono-hud font-semibold text-xs uppercase">
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
                          <tr key={u.id} className="border-b border-[#2A2A2B]/60 hover:bg-[#1C1B1C]/50 transition">
                            <td className="py-3.5 px-4 font-headline font-bold text-[#E5E2E3]">
                              {u.username}
                            </td>
                            <td className="py-3.5 px-4 font-mono-hud text-xs text-[#919095]">{u.email}</td>
                            <td className="py-3.5 px-4">
                              <span className="bg-[#FF0033]/20 border border-[#FF0033]/40 text-[#FF5357] font-mono-hud font-bold text-xs px-2.5 py-1 rounded-lg">
                                {u.profile?.blood_type || 'A+'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono-hud text-xs text-[#919095]">{u.profile?.availability || 'Anyday'}</td>
                            <td className="py-3.5 px-4">
                              <span className={`text-[10px] font-mono-hud font-extrabold uppercase px-2 py-0.5 rounded ${
                                u.role === 'admin' 
                                  ? 'bg-[#FF0033] text-white shadow-[0_0_10px_rgba(255,0,51,0.4)]' 
                                  : 'bg-[#0E0E0F] border border-[#2A2A2B] text-[#919095]'
                              }`}>
                                {u.role || 'user'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {u.role !== 'admin' && (
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  disabled={submittingId === u.id}
                                  className="text-[#919095] hover:text-[#FF5357] p-2 rounded-xl transition hover:bg-[#1C1B1C] disabled:opacity-50"
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
