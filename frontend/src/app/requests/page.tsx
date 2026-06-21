'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { requestApi, BloodRequest, User, getCurrentUser } from '@/lib/api';
import { AlertCircle, PlusCircle, Activity, Heart, Phone, MapPin, CheckCircle, Navigation as NavIcon, Users } from 'lucide-react';

export default function RequestsPage() {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
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
  
  // Results State
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [matchedDonors, setMatchedDonors] = useState<any[]>([]);
  const [locating, setLocating] = useState(false);

  const fetchRequests = async () => {
    try {
      const data = await requestApi.list();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData(prev => ({
        ...prev,
        first_name: currentUser.username,
        contact_number: currentUser.profile?.phone_number || '',
        location: currentUser.profile?.city || '',
      }));
    }
    fetchRequests();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser.');
      return;
    }
    setLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setLocating(false);
      },
      (err) => {
        console.error(err);
        setError('Could not detect GPS location. Type location manually.');
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
      const res = await requestApi.create({
        ...formData,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
      });
      setSuccess('Blood request broadcasted successfully!');
      setMatchedDonors(res.matching_donors || []);
      setShowForm(false);
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'Failed to submit blood request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Navigation />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">SOS & Emergency Alerts</h1>
            <p className="text-sm text-slate-400 mt-1">Broadcast urgent requests and view real-time blood needs</p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setMatchedDonors([]);
            }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-red-950/20 transition hover:scale-[1.03] active:scale-[0.98] transform duration-150"
          >
            <PlusCircle className="w-5 h-5" />
            Request Blood (SOS)
          </button>
        </div>

        {/* Messaging Results Banner */}
        {success && (
          <div className="bg-emerald-950/30 border border-emerald-900/30 p-4.5 rounded-3xl text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold">{success}</p>
              {matchedDonors.length > 0 && (
                <p className="text-xs mt-1 text-emerald-500">
                  Found {matchedDonors.length} matching compatible donors within distance! See match details below.
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950/30 border border-red-900/30 p-4 rounded-2xl text-red-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Matching Donors Result Grid */}
        {matchedDonors.length > 0 && (
          <div className="bg-slate-900/40 border border-slate-900 p-6.5 rounded-3xl flex flex-col gap-4 shadow-xl">
            <h3 className="font-extrabold text-slate-100 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-red-500" /> Compatible Matches Found Nearby
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {matchedDonors.map((donor, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-900 p-4.5 rounded-2xl hover:border-slate-800 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-100 text-sm">{donor.username}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" /> {donor.city}
                      </p>
                    </div>
                    <span className="bg-red-950/50 border border-red-900/30 text-red-500 text-xs font-black px-2.5 py-1 rounded-xl">
                      {donor.blood_type}
                    </span>
                  </div>
                  <div className="mt-4 pt-3.5 border-t border-slate-900 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Distance: {donor.distance_km || 'unknown'} km</span>
                    <a
                      href={`https://wa.me/${donor.phone_number.replace(/[^\d]/g, '')}?text=Hello%20${donor.username},%20we%20have%20an%20urgent%20blood%20request`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 font-bold hover:underline"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <Activity className="w-10 h-10 text-red-500 animate-spin" />
            <span className="text-slate-500 font-semibold">Tuning to SOS frequencies...</span>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Create Request Form Overlay */}
            {showForm && (
              <div className="lg:col-span-12 glass p-6 rounded-3xl border border-red-500/20 shadow-2xl flex flex-col gap-5">
                <div className="flex justify-between items-center border-b border-slate-900/60 pb-3">
                  <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" /> Broadcast SOS Request
                  </h3>
                  <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-100 text-xs">
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400">Recipient First Name</label>
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
                    <label className="text-xs font-semibold text-slate-400">Recipient Last Name</label>
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

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400">Blood Group Needed</label>
                    <select
                      name="blood_type"
                      value={formData.blood_type}
                      onChange={handleInputChange}
                      className="bg-slate-950 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-2.5 px-4 text-sm font-semibold transition"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                        <option key={type} value={type} className="bg-slate-950">{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400">Contact Number</label>
                    <input
                      type="tel"
                      name="contact_number"
                      required
                      value={formData.contact_number}
                      onChange={handleInputChange}
                      className="bg-slate-950 border border-slate-800 focus:border-red-600 focus:outline-none rounded-xl py-2.5 px-4 text-sm font-semibold transition"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400">Hospital / Location</label>
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
                    <label className="text-xs font-semibold text-slate-400">GPS Tracker (For Proximity Matches)</label>
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={locating}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2"
                    >
                      <NavIcon className={`w-4 h-4 text-red-500 ${locating ? 'animate-spin' : ''}`} />
                      {formData.latitude !== 0 ? 'GPS Coordinates Logged ✓' : locating ? 'Capturing...' : 'Use Current Coordinates'}
                    </button>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3 bg-red-950/20 border border-red-900/25 p-4 rounded-2xl">
                    <input
                      type="checkbox"
                      name="is_emergency"
                      id="is_emergency"
                      checked={formData.is_emergency}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded-md accent-red-600 border-slate-800"
                    />
                    <label htmlFor="is_emergency" className="text-xs font-semibold text-red-400 cursor-pointer">
                      Flag as Critical SOS Emergency (Trigger immediate notification dispatch to all matching compatible donors)
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="sm:col-span-2 lg:col-span-3 mt-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-3.5 rounded-xl transition duration-150 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {submitting ? 'Broadcasting SOS...' : 'Submit SOS Request'}
                  </button>
                </form>
              </div>
            )}

            {/* Requests List */}
            <div className="lg:col-span-12 glass p-6.5 rounded-3xl border border-slate-900 flex flex-col gap-5 shadow-lg">
              <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" /> Active Blood Requests
              </h3>

              {requests.length === 0 ? (
                <div className="py-24 text-center flex flex-col items-center justify-center gap-3.5">
                  <Heart className="w-14 h-14 text-slate-800 fill-slate-900/10" />
                  <span className="font-bold text-sm text-slate-400">All Inventories Active & Stable</span>
                  <span className="text-xs text-slate-500 max-w-sm leading-normal">
                    There are currently no active emergency or scheduling requests in the system. Click "Request Blood" to create one.
                  </span>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className={`border p-5 rounded-3xl transition relative overflow-hidden flex flex-col justify-between min-h-[190px] ${
                        req.is_emergency 
                          ? 'bg-red-950/15 border-red-900/30 hover:border-red-900/60' 
                          : 'bg-slate-950/40 border-slate-900 hover:border-slate-800'
                      }`}
                    >
                      {req.is_emergency && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-[25px] rounded-full pointer-events-none" />
                      )}
                      
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-black text-slate-100 text-base">
                              {req.first_name} {req.last_name}
                            </span>
                            {req.is_emergency && (
                              <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase pulse-sos">SOS</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" /> {req.location}
                          </p>
                        </div>
                        <div className={`font-black text-sm px-3.5 py-2 rounded-2xl shadow-sm ${
                          req.is_emergency
                            ? 'bg-red-600 text-white shadow-red-900/30'
                            : 'bg-red-950/40 border border-red-900/25 text-red-500'
                        }`}>
                          {req.blood_type}
                        </div>
                      </div>

                      <div className="mt-6 pt-4.5 border-t border-slate-900/60 flex justify-between items-center text-xs">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-500" /> {req.contact_number}
                        </span>
                        
                        <a
                          href={`https://wa.me/${req.contact_number.replace(/[^\d]/g, '')}?text=Hello%20${req.first_name},%20I%20am%2520responding%2520to%2520your%2520BloodHero%2520blood%2520request.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold px-3 py-1.5 rounded-xl border border-red-900/20 hover:border-red-900/40 transition"
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
