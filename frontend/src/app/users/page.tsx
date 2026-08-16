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
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA] dark:bg-[#131314] text-[#1A1A1A] dark:text-[#E5E2E3] selection:bg-[#FF0033] selection:text-white">
      <Navigation />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#00FF94] pulse-active shadow-[0_0_12px_rgba(0,255,148,0.8)]" />
            <h1 className="font-headline text-3xl font-extrabold text-[#E5E2E3] tracking-tight">Registered Donors Directory</h1>
          </div>
          <p className="text-xs font-mono-hud text-[#00F1FE] mt-1 tracking-wider uppercase">SEARCH DONOR PROFILES, FILTER BY BLOOD GROUP & INITIATE SECURE CHAT</p>
        </div>

        {/* Filters bar */}
        <div className="grid sm:grid-cols-12 gap-4">
          <div className="sm:col-span-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#919095]" />
            <input
              type="text"
              placeholder="Search by username or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-2xl py-3 pl-11 pr-4 text-sm font-semibold text-[#E5E2E3] placeholder-[#919095]/60 transition"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={bloodFilter}
              onChange={(e) => setBloodFilter(e.target.value)}
              className="w-full bg-[#0E0E0F] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-2xl py-3 px-4 text-sm font-semibold text-[#E5E2E3] transition"
            >
              <option value="">All Blood Types</option>
              {bloodTypes.map(type => (
                <option key={type} value={type} className="bg-[#0E0E0F] text-[#E5E2E3]">{type}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <Activity className="w-10 h-10 text-[#FF5357] animate-spin" />
            <span className="text-[#919095] font-mono-hud text-xs">LISTING DONOR HEROES...</span>
          </div>
        ) : (
          <div className="glass-card p-6.5 rounded-3xl border border-[#2A2A2B] flex flex-col gap-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <h3 className="font-headline font-bold text-[#E5E2E3] text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FF5357]" />
              <span>DONOR DIRECTORY MATRIX</span>
            </h3>

            {filteredUsers.length === 0 ? (
              <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
                <Users className="w-12 h-12 text-[#2A2A2B]" />
                <span className="font-headline font-bold text-sm text-[#E5E2E3]">No Donors Found</span>
                <span className="text-xs font-mono-hud text-[#919095] max-w-xs leading-normal">
                  Try refining your search terms or selecting a different blood type filter.
                </span>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredUsers.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#0E0E0F]/80 border border-[#2A2A2B] p-5 rounded-3xl hover:border-[#FF5357]/40 transition flex flex-col justify-between min-h-[190px] shadow-md"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-headline font-bold text-[#E5E2E3] text-base truncate">{item.username}</p>
                        <p className="text-xs font-mono-hud text-[#00F1FE] mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#00F1FE]" /> {item.profile?.city || 'Nairobi'}
                        </p>
                        <p className="text-xs font-mono-hud text-[#919095] mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#919095]" /> Availability: {item.profile?.availability || 'Anyday'}
                        </p>
                      </div>
                      <div className="bg-[#FF0033]/20 border border-[#FF0033]/40 text-[#FF5357] font-mono-hud font-extrabold text-xs px-3.5 py-2 rounded-2xl shadow-sm">
                        {item.profile?.blood_type || 'A+'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-[#2A2A2B]">
                      <button
                        onClick={() => handleStartChat(item.id)}
                        className="bg-[#1C1B1C] hover:bg-[#2A2A2B] text-[#E5E2E3] font-headline font-bold py-2 px-3 rounded-xl text-xs border border-white/10 transition flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4 text-[#FF5357]" />
                        <span>Chat</span>
                      </button>

                      {item.profile?.phone_number && (
                        <a
                          href={`https://wa.me/${item.profile.phone_number.replace(/[^\d]/g, '')}?text=Hello%20${item.username},%20we%20found%20your%20profile%20on%20BloodHero.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#00FF94]/15 hover:bg-[#00FF94]/25 text-[#00FF94] font-headline font-bold py-2 px-3 rounded-xl text-xs border border-[#00FF94]/30 transition flex items-center justify-center gap-2"
                        >
                          <Phone className="w-4 h-4 text-[#00FF94]" />
                          <span>WhatsApp</span>
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
