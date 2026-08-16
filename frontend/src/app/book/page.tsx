'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { bookingApi, Booking, User, getCurrentUser } from '@/lib/api';
import { Calendar, Clock, MapPin, CheckCircle, Trash2, HelpCircle, Activity, Heart, AlertCircle } from 'lucide-react';

export default function BookPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date: '',
    time_slot: '09:00',
    location: 'Nairobi Blood Center',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBookings = async () => {
    try {
      const data = await bookingApi.list();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Pre-fill names
      setFormData(prev => ({
        ...prev,
        first_name: currentUser.username,
      }));
    }
    fetchBookings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        date: new Date(formData.date).toISOString(),
      };
      await bookingApi.create(payload);
      setSuccess('Appointment booked successfully!');
      fetchBookings();
      // Reset date
      setFormData((prev) => ({ ...prev, date: '' }));
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await bookingApi.delete(id);
      setSuccess('Appointment cancelled successfully.');
      fetchBookings();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel appointment.');
    }
  };

  const donationCenters = [
    'Nairobi Blood Center (HQ)',
    'Eldoret Regional Blood Bank',
    'Mombasa General Hospital',
    'Kisumu Blood Transfusion Unit',
    'Nakuru Level 5 Clinic',
  ];

  const timeSlots = [
    '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:30', '14:00', '14:35', '15:00', '15:30', '16:00'
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA] dark:bg-[#131314] text-[#1A1A1A] dark:text-[#E5E2E3] selection:bg-[#FF0033] selection:text-white">
      <Navigation />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#00FF94] pulse-active shadow-[0_0_12px_rgba(0,255,148,0.8)]" />
            <h1 className="font-headline text-3xl font-extrabold text-[#E5E2E3] tracking-tight">Donation Booking</h1>
          </div>
          <p className="text-xs font-mono-hud text-[#00F1FE] mt-1 tracking-wider uppercase">SCHEDULE APPOINTMENT SLOTS & CHECK RESERVATION STATUS</p>
        </div>

        {success && (
          <div className="bg-[#00FF94]/15 border border-[#00FF94]/30 p-4 rounded-2xl text-[#00FF94] text-xs font-mono-hud flex items-center gap-3">
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
            <span className="text-[#919095] font-mono-hud text-xs">RETRIEVING SCHEDULES...</span>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Form Card */}
            <div className="lg:col-span-5 glass-card p-6.5 rounded-3xl border border-[#2A2A2B] flex flex-col gap-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <h3 className="font-headline font-bold text-[#E5E2E3] text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#FF0033] fill-[#FF0033]/20" />
                <span>BOOK APPOINTMENT SLOT</span>
              </h3>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">FIRST NAME</label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#E5E2E3] transition"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">LAST NAME</label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      placeholder="Doe"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#E5E2E3] placeholder-[#919095]/60 transition"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">PREFERRED DATE</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#E5E2E3] transition"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">TIME SLOT</label>
                  <select
                    name="time_slot"
                    value={formData.time_slot}
                    onChange={handleInputChange}
                    className="bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#E5E2E3] transition"
                  >
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot} className="bg-[#0E0E0F] text-[#E5E2E3]">{slot}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono-hud font-semibold text-[#919095] uppercase">LOCATION (CENTER)</label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-2.5 px-4 text-sm font-semibold text-[#E5E2E3] transition"
                  >
                    {donationCenters.map(center => (
                      <option key={center} value={center} className="bg-[#0E0E0F] text-[#E5E2E3]">{center}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-[#FF0033] to-[#FF5357] hover:from-[#FF5357] hover:to-[#FF0033] text-white font-headline font-bold text-xs uppercase py-3.5 rounded-xl transition duration-150 shadow-[0_0_20px_rgba(255,0,51,0.35)] transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
                >
                  {submitting ? 'BOOKING APPOINTMENT...' : 'CONFIRM APPOINTMENT'}
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-7 glass-card p-6.5 rounded-3xl border border-[#2A2A2B] flex flex-col gap-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <h3 className="font-headline font-bold text-[#E5E2E3] text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FF5357]" />
                <span>SCHEDULED APPOINTMENTS</span>
              </h3>

              {bookings.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <Calendar className="w-12 h-12 text-[#2A2A2B]" />
                  <span className="font-headline font-bold text-sm text-[#E5E2E3]">No Scheduled Bookings</span>
                  <span className="text-xs font-mono-hud text-[#919095] max-w-xs leading-normal">
                    You have no upcoming blood donation appointments scheduled. Use the form on the left to schedule a time.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-[#0E0E0F]/80 border border-[#2A2A2B] p-4.5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-[#FF5357]/40 transition"
                    >
                      <div className="flex items-start gap-4">
                        <div className="bg-[#FF0033]/15 border border-[#FF0033]/30 p-3.5 rounded-2xl text-[#FF5357]">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-headline font-bold text-[#E5E2E3] text-sm">
                            {booking.first_name} {booking.last_name}
                          </p>
                          <p className="text-xs font-mono-hud text-[#00F1FE] mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#00F1FE]" /> {booking.location}
                          </p>
                          <p className="text-xs font-mono-hud text-[#919095] mt-1 flex items-center gap-2.5">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#919095]" /> {booking.time_slot}</span>
                            <span>•</span>
                            <span>{new Date(booking.date).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col justify-between items-center sm:items-end gap-3 self-end sm:self-center">
                        <span className={`text-[10px] font-mono-hud font-extrabold uppercase px-2.5 py-1 rounded-lg border ${booking.status === 'Pending'
                            ? 'bg-[#FFAB00]/15 border-[#FFAB00]/40 text-[#FFAB00]'
                            : booking.status === 'Completed'
                              ? 'bg-[#00FF94]/15 border-[#00FF94]/40 text-[#00FF94]'
                              : 'bg-[#0E0E0F] border-[#2A2A2B] text-[#919095]'
                          }`}>
                          {booking.status}
                        </span>

                        {booking.status === 'Pending' && (
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="text-[#919095] hover:text-[#FF5357] transition p-1.5 rounded-lg hover:bg-[#1C1B1C]"
                            title="Cancel Booking"
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
