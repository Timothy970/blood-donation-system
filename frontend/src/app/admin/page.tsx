'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Shield, Users, Calendar, AlertCircle, Trash2, CheckCircle2, Activity, MapPin } from 'lucide-react';
import { adminApi, getCurrentUser, AdminStats, Booking, BloodRequest, User } from '@/lib/api';

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'alerts' | 'users'>('overview');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setErrorMsg('');
    try {
      const [statsData, bookingsData, requestsData, usersData] = await Promise.all([
        adminApi.getStats(),
        adminApi.listBookings(),
        adminApi.listRequests(),
        adminApi.listUsers(),
      ]);

      setStats(statsData);
      setBookings(bookingsData || []);
      setRequests(requestsData || []);
      setUsers(usersData || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to query administration services.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (id: number, status: string) => {
    try {
      await adminApi.updateBooking(id, status);
      loadAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update booking status.');
    }
  };

  const handleDeleteRequest = async (id: number) => {
    if (!confirm('Are you sure you want to resolve and delete this SOS request?')) return;
    try {
      await adminApi.deleteRequest(id);
      loadAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete SOS alert.');
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${username}"?`)) return;
    try {
      await adminApi.deleteUser(id);
      loadAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete user.');
    }
  };

  const currentUser = getCurrentUser();
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
              <h1 className="font-headline text-3xl font-extrabold text-[#1A1A1A] dark:text-[#E5E2E3] tracking-tight flex items-center gap-3">
                <Shield className="w-8 h-8 text-[#FF5357]" />
                <span>Admin Console</span>
              </h1>
            </div>
            <p className="text-xs font-mono-hud text-[#0096C7] dark:text-[#00F1FE] mt-1 tracking-wider uppercase">GLOBAL OVERSIGHT OF MATCHES, SCHEDULED SLOTS & USER REGISTRIES</p>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-[#F1F3F5] dark:bg-[#0E0E0F] p-1.5 rounded-2xl border border-[#DEE2E6] dark:border-[#2A2A2B]">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'bookings', label: 'Bookings' },
              { key: 'alerts', label: 'SOS Alerts' },
              { key: 'users', label: 'Users' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-xl text-xs font-headline font-bold transition cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-[#FF0033] text-white shadow-[0_0_15px_rgba(255,0,51,0.4)]'
                    : 'text-[#6C757D] dark:text-[#919095] hover:text-[#1A1A1A] dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="bg-[#FF0033]/15 border border-[#FF0033]/30 p-4 rounded-2xl text-[#FF5357] text-xs font-mono-hud flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
            <Activity className="w-10 h-10 text-[#FF5357] animate-spin" />
            <span className="text-[#6C757D] dark:text-[#919095] font-mono-hud text-xs">TUNING ADMIN CHANNELS...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-8">
                {/* Metrics Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="glass-card p-6 rounded-3xl border border-[#E9ECEF] dark:border-[#2A2A2B] flex flex-col gap-2 shadow-sm">
                    <span className="text-xs font-mono-hud text-[#6C757D] dark:text-[#919095] uppercase">TOTAL MEMBERS</span>
                    <span className="font-headline font-black text-3xl text-[#1A1A1A] dark:text-[#E5E2E3]">{stats?.total_users || 0}</span>
                  </div>

                  <div className="glass-card p-6 rounded-3xl border border-[#E9ECEF] dark:border-[#2A2A2B] flex flex-col gap-2 shadow-sm">
                    <span className="text-xs font-mono-hud text-[#6C757D] dark:text-[#919095] uppercase">COMPLETED DONATIONS</span>
                    <span className="font-headline font-black text-3xl text-[#FF5357]">{stats?.total_donations || 0}</span>
                  </div>

                  <div className="glass-card p-6 rounded-3xl border border-[#E9ECEF] dark:border-[#2A2A2B] flex flex-col gap-2 shadow-sm">
                    <span className="text-xs font-mono-hud text-[#6C757D] dark:text-[#919095] uppercase">TOTAL VOLUME (ML)</span>
                    <span className="font-headline font-black text-3xl text-[#00A86B] dark:text-[#00FF94]">{stats?.total_donation_volume_ml || 0} ml</span>
                  </div>

                  <div className="glass-card p-6 rounded-3xl border border-[#E9ECEF] dark:border-[#2A2A2B] flex flex-col gap-2 shadow-sm">
                    <span className="text-xs font-mono-hud text-[#6C757D] dark:text-[#919095] uppercase">ACTIVE SOS ALERTS</span>
                    <span className="font-headline font-black text-3xl text-[#0096C7] dark:text-[#00F1FE]">{stats?.total_active_requests || 0}</span>
                  </div>
                </div>

                {/* Operations Checklist */}
                <div className="glass-card p-6.5 rounded-3xl border border-[#E9ECEF] dark:border-[#2A2A2B] flex flex-col gap-4 shadow-sm">
                  <h3 className="font-headline font-bold text-base text-[#1A1A1A] dark:text-[#E5E2E3]">Administrative Operations Checklist</h3>
                  <div className="flex flex-col gap-3 text-xs font-sans text-[#6C757D] dark:text-[#919095] leading-relaxed">
                    <p>• <strong className="text-[#1A1A1A] dark:text-[#E5E2E3]">Bookings:</strong> Review pending clinic appointments and update status upon intake verification.</p>
                    <p>• <strong className="text-[#1A1A1A] dark:text-[#E5E2E3]">SOS Emergency Broadcasts:</strong> Clear fulfilled emergency alerts from the regional broadcast network.</p>
                    <p>• <strong className="text-[#1A1A1A] dark:text-[#E5E2E3]">User Directory:</strong> Audit member registrations and purge inactive or invalid accounts.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="glass-card p-6.5 rounded-3xl border border-[#E9ECEF] dark:border-[#2A2A2B] flex flex-col gap-5 shadow-sm">
                <h3 className="font-headline font-bold text-base text-[#1A1A1A] dark:text-[#E5E2E3]">Appointment Bookings Directory</h3>
                {bookings.length === 0 ? (
                  <p className="text-xs font-mono-hud text-[#6C757D] dark:text-[#919095] py-8 text-center">No bookings logged in database.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono-hud">
                      <thead>
                        <tr className="border-b border-[#DEE2E6] dark:border-[#2A2A2B] text-[#6C757D] dark:text-[#919095]">
                          <th className="py-3 px-4">PATIENT NAME</th>
                          <th className="py-3 px-4">LOCATION</th>
                          <th className="py-3 px-4">DATE & TIME</th>
                          <th className="py-3 px-4">STATUS</th>
                          <th className="py-3 px-4 text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map(b => (
                          <tr key={b.id} className="border-b border-[#DEE2E6]/60 dark:border-[#2A2A2B]/60 hover:bg-[#F1F3F5] dark:hover:bg-[#1C1B1C]">
                            <td className="py-3.5 px-4 font-bold text-[#1A1A1A] dark:text-[#E5E2E3]">{b.first_name} {b.last_name}</td>
                            <td className="py-3.5 px-4 text-[#0096C7] dark:text-[#00F1FE]">📍 {b.location}</td>
                            <td className="py-3.5 px-4 text-[#6C757D] dark:text-[#919095]">{new Date(b.date).toLocaleDateString()} at {b.time_slot}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] ${
                                b.status === 'Completed' ? 'bg-[#00FF94]/20 text-[#00A86B] dark:text-[#00FF94]' : 'bg-[#FFAB00]/20 text-[#D97706] dark:text-[#FFAB00]'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {b.status === 'Pending' && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, 'Completed')}
                                  className="bg-[#00A86B]/15 dark:bg-[#00FF94]/15 hover:bg-[#00A86B]/30 border border-[#00A86B]/30 text-[#00A86B] dark:text-[#00FF94] px-3 py-1 rounded-xl font-bold transition cursor-pointer"
                                >
                                  Verify Complete
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

            {/* SOS Alerts Tab */}
            {activeTab === 'alerts' && (
              <div className="glass-card p-6.5 rounded-3xl border border-[#E9ECEF] dark:border-[#2A2A2B] flex flex-col gap-5 shadow-sm">
                <h3 className="font-headline font-bold text-base text-[#1A1A1A] dark:text-[#E5E2E3]">Active Emergency SOS Broadcasts</h3>
                {requests.length === 0 ? (
                  <p className="text-xs font-mono-hud text-[#6C757D] dark:text-[#919095] py-8 text-center">No active emergency SOS alerts.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {requests.map(r => (
                      <div key={r.id} className="p-4 rounded-2xl bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-[#1A1A1A] dark:text-[#E5E2E3] text-sm">{r.first_name} {r.last_name}</h4>
                            <span className="bg-[#FF0033]/15 text-[#FF5357] border border-[#FF0033]/30 text-xs font-bold px-2 py-0.5 rounded-lg">{r.blood_type}</span>
                          </div>
                          <p className="text-xs text-[#0096C7] dark:text-[#00F1FE] mt-1">📍 {r.location}</p>
                          <p className="text-xs text-[#6C757D] dark:text-[#919095] mt-0.5">📞 {r.contact_number}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteRequest(r.id)}
                          className="bg-[#FF0033]/15 hover:bg-[#FF0033]/30 border border-[#FF0033]/30 text-[#FF5357] text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                        >
                          Resolve SOS Alert
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="glass-card p-6.5 rounded-3xl border border-[#E9ECEF] dark:border-[#2A2A2B] flex flex-col gap-5 shadow-sm">
                <h3 className="font-headline font-bold text-base text-[#1A1A1A] dark:text-[#E5E2E3]">Registered Member Registry</h3>
                {users.length === 0 ? (
                  <p className="text-xs font-mono-hud text-[#6C757D] dark:text-[#919095] py-8 text-center">No users found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono-hud">
                      <thead>
                        <tr className="border-b border-[#DEE2E6] dark:border-[#2A2A2B] text-[#6C757D] dark:text-[#919095]">
                          <th className="py-3 px-4">USERNAME</th>
                          <th className="py-3 px-4">EMAIL</th>
                          <th className="py-3 px-4">BLOOD TYPE</th>
                          <th className="py-3 px-4">ROLE</th>
                          <th className="py-3 px-4 text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.id} className="border-b border-[#DEE2E6]/60 dark:border-[#2A2A2B]/60 hover:bg-[#F1F3F5] dark:hover:bg-[#1C1B1C]">
                            <td className="py-3.5 px-4 font-bold text-[#1A1A1A] dark:text-[#E5E2E3]">{u.username}</td>
                            <td className="py-3.5 px-4 text-[#6C757D] dark:text-[#919095]">{u.email}</td>
                            <td className="py-3.5 px-4 text-[#FF5357] font-bold">{u.profile?.blood_type || 'A+'}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                u.role === 'admin' ? 'bg-[#FF0033]/20 text-[#FF5357]' : 'bg-[#0096C7]/20 dark:bg-[#00F1FE]/20 text-[#0096C7] dark:text-[#00F1FE]'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {u.role !== 'admin' && (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  className="text-[#FF5357] hover:bg-[#FF0033]/15 p-2 rounded-xl transition cursor-pointer"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-4 h-4" />
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
