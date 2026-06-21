'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { bookingApi, Booking, User, getCurrentUser } from '@/lib/api';
import { Calendar, Clock, MapPin, CheckCircle, Trash2, HelpCircle, Activity, Heart } from 'lucide-react';

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
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Navigation />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Donation Booking</h1>
          <p className="text-sm text-slate-400 mt-1">Schedule appointment times and check active bookings</p>
        </div>

        {success && (
          <div className="bg-emerald-950/30 border border-emerald-900/30 p-4 rounded-2xl text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-950/30 border border-red-900/30 p-4 rounded-2xl text-red-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <Activity className="w-10 h-10 text-red-500 animate-spin" />
            <span className="text-slate-500 font-semibold">Retrieving schedules...</span>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Form */}
            <div className="lg:col-span-5 glass p-6.5 rounded-3xl border border-slate-900 flex flex-col gap-5 shadow-lg">
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500/20" /> Book Slot
              </h3>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="bg-slate-950 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-2.5 px-4 text-sm font-semibold transition"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      placeholder="Doe"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="bg-slate-950 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-2.5 px-4 text-sm font-semibold transition"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-400">Preferred Date</label>
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
                  <label className="text-xs font-semibold text-slate-400">Time Slot</label>
                  <select
                    name="time_slot"
                    value={formData.time_slot}
                    onChange={handleInputChange}
                    className="bg-slate-950 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-2.5 px-4 text-sm font-semibold transition"
                  >
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot} className="bg-slate-950">{slot}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-400">Location (Center)</label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="bg-slate-950 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-2.5 px-4 text-sm font-semibold transition"
                  >
                    {donationCenters.map(center => (
                      <option key={center} value={center} className="bg-slate-950">{center}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-3.5 rounded-xl transition duration-150 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
                >
                  {submitting ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-7 glass p-6.5 rounded-3xl border border-slate-900 flex flex-col gap-5 shadow-lg">
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-500" /> Scheduled Bookings
              </h3>

              {bookings.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <Calendar className="w-12 h-12 text-slate-800" />
                  <span className="font-bold text-sm text-slate-400">No Scheduled Bookings</span>
                  <span className="text-xs text-slate-500 max-w-xs leading-normal">
                    You have no upcoming blood donation appointments scheduled. Use the form on the left to schedule a time.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-slate-950/40 border border-slate-900 p-4.5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-800 transition"
                    >
                      <div className="flex items-start gap-4">
                        <div className="bg-red-950/30 border border-red-900/25 p-3.5 rounded-2xl text-red-500">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">
                            {booking.first_name} {booking.last_name}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" /> {booking.location}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2.5">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {booking.time_slot}</span>
                            <span>•</span>
                            <span>{new Date(booking.date).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col justify-between items-center sm:items-end gap-3 self-end sm:self-center">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                          booking.status === 'Pending' 
                            ? 'bg-amber-950/30 border-amber-900/30 text-amber-500' 
                            : booking.status === 'Completed'
                            ? 'bg-emerald-950/30 border-emerald-900/30 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                          {booking.status}
                        </span>
                        
                        {booking.status === 'Pending' && (
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="text-slate-500 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-slate-900/50"
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
