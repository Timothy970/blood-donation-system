'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, Heart, Trash2, Activity } from 'lucide-react';
import { bookingApi, getCurrentUser, Booking } from '@/lib/api';

export default function BookPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date: '',
    time_slot: '09:00',
    location: 'Nairobi Blood Center (HQ)',
  });

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const timeSlots = [
    '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'
  ];

  const locations = [
    'Nairobi Blood Center (HQ)',
    'Eldoret Regional Blood Bank',
    'Mombasa General Hospital',
    'Kisumu Blood Transfusion Unit',
    'Nakuru Level 5 Clinic',
  ];

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setFormData(prev => ({
        ...prev,
        first_name: user.username,
      }));
    }

    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await bookingApi.list();
      setBookings(data || []);
    } catch (err: any) {
      setError('Failed to fetch bookings. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setSubmitting(true);

    try {
      await bookingApi.create({
        first_name: formData.first_name,
        last_name: formData.last_name,
        date: new Date(formData.date).toISOString(),
        time_slot: formData.time_slot,
        location: formData.location,
      });

      setSuccess('Appointment successfully scheduled!');
      setFormData(prev => ({
        ...prev,
        date: '',
      }));
      fetchBookings();
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this scheduled appointment?')) return;
    try {
      await bookingApi.delete(id);
      setSuccess('Appointment cancelled successfully.');
      fetchBookings();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel appointment.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA] dark:bg-[#131314] text-[#1A1A1A] dark:text-[#E5E2E3] selection:bg-[#FF0033] selection:text-white">
      <Navigation />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#00FF94] pulse-active shadow-[0_0_12px_rgba(0,255,148,0.8)]" />
            <h1 className="font-headline text-3xl font-extrabold text-[#1A1A1A] dark:text-[#E5E2E3] tracking-tight">Donation Booking</h1>
          </div>
          <p className="text-xs font-mono-hud text-[#0096C7] dark:text-[#00F1FE] mt-1 tracking-wider uppercase">SCHEDULE APPOINTMENT SLOTS & CHECK RESERVATION STATUS</p>
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

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <Activity className="w-10 h-10 text-[#FF5357] animate-spin" />
            <span className="text-[#6C757D] dark:text-[#919095] font-mono-hud text-xs">RETRIEVING SCHEDULES...</span>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Form Card */}
            <div className="lg:col-span-5 glass-card p-6.5 rounded-3xl border border-[#E9ECEF] dark:border-[#2A2A2B] flex flex-col gap-5 shadow-sm">
              <h3 className="font-headline font-bold text-[#1A1A1A] dark:text-[#E5E2E3] text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#FF0033] fill-[#FF0033]/20" />
                <span>BOOK APPOINTMENT SLOT</span>
              </h3>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">FIRST NAME</label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] transition"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">LAST NAME</label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      placeholder="Doe"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] placeholder-[#6C757D]/60 dark:placeholder-[#919095]/60 transition"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">PREFERRED DATE</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] transition"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">TIME SLOT</label>
                  <select
                    name="time_slot"
                    value={formData.time_slot}
                    onChange={handleInputChange}
                    className="bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] transition"
                  >
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot} className="bg-[#FFFFFF] dark:bg-[#0E0E0F] text-[#1A1A1A] dark:text-[#E5E2E3]">{slot}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] uppercase">LOCATION (CENTER)</label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] transition"
                  >
                    {locations.map(loc => (
                      <option key={loc} value={loc} className="bg-[#FFFFFF] dark:bg-[#0E0E0F] text-[#1A1A1A] dark:text-[#E5E2E3]">{loc}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-3 bg-gradient-to-r from-[#FF0033] to-[#FF5357] hover:from-[#FF5357] hover:to-[#FF0033] text-white font-headline font-bold text-xs uppercase py-3.5 rounded-xl transition duration-150 shadow-[0_0_20px_rgba(255,0,51,0.35)] transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {submitting ? 'CONFIRMING...' : 'CONFIRM APPOINTMENT'}
                </button>
              </form>
            </div>

            {/* Existing Bookings List */}
            <div className="lg:col-span-7 glass-card p-6.5 rounded-3xl border border-[#E9ECEF] dark:border-[#2A2A2B] flex flex-col gap-5 shadow-sm">
              <h3 className="font-headline font-bold text-[#1A1A1A] dark:text-[#E5E2E3] text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FF5357]" />
                <span>SCHEDULED APPOINTMENTS</span>
              </h3>

              {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-[#DEE2E6] dark:border-[#2A2A2B] rounded-2xl bg-[#F1F3F5]/50 dark:bg-[#0E0E0F]/50">
                  <Calendar className="w-10 h-10 text-[#6C757D] dark:text-[#919095]/40" />
                  <p className="font-headline font-bold text-sm text-[#1A1A1A] dark:text-[#E5E2E3]">No Scheduled Bookings</p>
                  <p className="text-xs font-mono-hud text-[#6C757D] dark:text-[#919095] max-w-xs">
                    You have no upcoming blood donation appointments scheduled. Use the form on the left to schedule a time.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="p-4 rounded-2xl bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] flex items-center justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#FF5357]" />
                          <span className="font-headline font-bold text-sm text-[#1A1A1A] dark:text-[#E5E2E3]">{booking.location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono-hud text-[#6C757D] dark:text-[#919095]">
                          <span>📅 {new Date(booking.date).toLocaleDateString()}</span>
                          <span>⏰ {booking.time_slot}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-xs font-mono-hud font-bold ${
                          booking.status === 'Completed'
                            ? 'bg-[#00FF94]/20 text-[#00A86B] dark:text-[#00FF94] border border-[#00FF94]/40'
                            : booking.status === 'Cancelled'
                            ? 'bg-[#6C757D]/20 text-[#6C757D] dark:text-[#919095] border border-[#6C757D]/40'
                            : 'bg-[#FFAB00]/20 text-[#D97706] dark:text-[#FFAB00] border border-[#FFAB00]/40'
                        }`}>
                          {booking.status}
                        </span>

                        {booking.status === 'Pending' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="p-2 rounded-xl text-[#6C757D] dark:text-[#919095] hover:text-[#FF5357] hover:bg-[#DEE2E6] dark:hover:bg-[#2A2A2B] transition"
                            title="Cancel appointment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
