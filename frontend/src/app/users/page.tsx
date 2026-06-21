'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { chatApi, User } from '@/lib/api';
import { Search, MapPin, Calendar, MessageSquare, Phone, Activity, Heart, Users } from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodFilter, setBloodFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chatApi.users()
      .then(res => {
        setUsers(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to retrieve users:', err);
        setLoading(false);
      });
  }, []);

  const handleStartChat = (otherId: number) => {
    router.push(`/chat?other_id=${otherId}`);
  };

  // Filter users based on query and blood group
  const filteredUsers = users.filter(user => {
    const nameMatch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      (user.profile?.city || '').toLowerCase().includes(searchQuery.toLowerCase());
    const bloodMatch = bloodFilter ? user.profile?.blood_type === bloodFilter : true;
    return nameMatch && bloodMatch;
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Navigation />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Registered Donors</h1>
          <p className="text-sm text-slate-400 mt-1">Search donor profiles, filter by blood type, and coordinate via WhatsApp or Chat</p>
        </div>

        {/* Filters bar */}
        <div className="grid sm:grid-cols-12 gap-4">
          <div className="sm:col-span-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by username or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800/80 focus:border-red-600 focus:outline-none rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold transition"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={bloodFilter}
              onChange={(e) => setBloodFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800/80 focus:border-red-600 focus:outline-none rounded-2xl py-3 px-4 text-sm font-semibold transition"
            >
              <option value="">All Blood Types</option>
              {bloodTypes.map(type => (
                <option key={type} value={type} className="bg-slate-950">{type}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <Activity className="w-10 h-10 text-red-500 animate-spin" />
            <span className="text-slate-500 font-semibold">Listing heroes...</span>
          </div>
        ) : (
          <div className="glass p-6.5 rounded-3xl border border-slate-900 flex flex-col gap-5 shadow-lg">
            <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-red-500" /> Donor Directory
            </h3>

            {filteredUsers.length === 0 ? (
              <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
                <Users className="w-12 h-12 text-slate-800" />
                <span className="font-bold text-sm text-slate-400">No Donors Found</span>
                <span className="text-xs text-slate-500 max-w-xs leading-normal">
                  Try refining your search terms or selecting a different blood type filter.
                </span>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredUsers.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950 border border-slate-900 p-5 rounded-3xl hover:border-slate-800 transition flex flex-col justify-between min-h-[190px]"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-bold text-white text-base truncate">{item.username}</p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" /> {item.profile?.city || 'Nairobi'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Availability: {item.profile?.availability || 'Anyday'}
                        </p>
                      </div>
                      <div className="bg-red-950/40 border border-red-900/25 text-red-500 font-black text-sm px-3.5 py-2 rounded-2xl shadow-sm">
                        {item.profile?.blood_type || 'A+'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-900/60">
                      <button
                        onClick={() => handleStartChat(item.id)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-3 rounded-xl text-xs border border-slate-800/80 transition flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4 text-red-500" />
                        Chat
                      </button>

                      {item.profile?.phone_number && (
                        <a
                          href={`https://wa.me/${item.profile.phone_number.replace(/[^\d]/g, '')}?text=Hello%20${item.username},%20we%20found%20your%20profile%20on%20BloodHero.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold py-2 px-3 rounded-xl text-xs border border-red-900/20 hover:border-red-900/40 transition flex items-center justify-center gap-2"
                        >
                          <Phone className="w-4 h-4" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
