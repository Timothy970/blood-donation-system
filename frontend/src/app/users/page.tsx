'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Search, MapPin, Phone, MessageSquare, Activity, User as UserIcon } from 'lucide-react';
import { userApi, User } from '@/lib/api';
import Link from 'next/link';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBloodType, setSelectedBloodType] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userApi.list();
      setUsers(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.profile?.city && user.profile.city.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBlood = selectedBloodType ? user.profile?.blood_type === selectedBloodType : true;

    return matchesSearch && matchesBlood;
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA] dark:bg-[#131314] text-[#1A1A1A] dark:text-[#E5E2E3] selection:bg-[#FF0033] selection:text-white">
      <Navigation />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#00FF94] pulse-active shadow-[0_0_12px_rgba(0,255,148,0.8)]" />
            <h1 className="font-headline text-3xl font-extrabold text-[#1A1A1A] dark:text-[#E5E2E3] tracking-tight">Registered Donors Directory</h1>
          </div>
          <p className="text-xs font-mono-hud text-[#0096C7] dark:text-[#00F1FE] mt-1 tracking-wider uppercase">SEARCH DONOR PROFILES, FILTER BY BLOOD GROUP & INITIATE SECURE CHAT</p>
        </div>

        {/* Filter Section */}
        <div className="glass-card p-4 rounded-3xl border border-[#E9ECEF] dark:border-[#2A2A2B] flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#6C757D] dark:text-[#919095] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by username or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F1F3F5] dark:bg-[#0E0E0F] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] focus:outline-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] placeholder-[#6C757D]/60 dark:placeholder-[#919095]/60 transition"
            />
          </div>

          {/* Blood Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedBloodType('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono-hud font-bold transition cursor-pointer ${
                selectedBloodType === ''
                  ? 'bg-[#FF0033] text-white shadow-[0_0_10px_rgba(255,0,51,0.4)]'
                  : 'bg-[#F1F3F5] dark:bg-[#0E0E0F] text-[#6C757D] dark:text-[#919095] hover:text-[#1A1A1A] dark:hover:text-white border border-[#DEE2E6] dark:border-[#2A2A2B]'
              }`}
            >
              ALL
            </button>
            {bloodTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedBloodType(selectedBloodType === type ? '' : type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono-hud font-bold transition cursor-pointer ${
                  selectedBloodType === type
                    ? 'bg-[#FF0033] text-white shadow-[0_0_10px_rgba(255,0,51,0.4)]'
                    : 'bg-[#F1F3F5] dark:bg-[#0E0E0F] text-[#6C757D] dark:text-[#919095] hover:text-[#1A1A1A] dark:hover:text-white border border-[#DEE2E6] dark:border-[#2A2A2B]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Grid */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <Activity className="w-10 h-10 text-[#FF5357] animate-spin" />
            <span className="text-[#6C757D] dark:text-[#919095] font-mono-hud text-xs">QUERYING REGISTERED DONORS...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border border-[#DEE2E6] dark:border-[#2A2A2B] text-center flex flex-col items-center justify-center gap-3">
            <UserIcon className="w-12 h-12 text-[#6C757D] dark:text-[#919095]/40" />
            <p className="font-headline font-bold text-sm text-[#1A1A1A] dark:text-[#E5E2E3]">No Donors Found</p>
            <p className="text-xs font-mono-hud text-[#6C757D] dark:text-[#919095]">Try refining your search terms or blood group filter.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredUsers.map((donor) => (
              <div
                key={donor.id}
                className="glass-card p-5 rounded-3xl border border-[#E9ECEF] dark:border-[#2A2A2B] hover:border-[#FF5357]/40 transition flex flex-col justify-between gap-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-[#DEE2E6] dark:bg-[#2A2A2B] border border-[#FF5357]/40 flex items-center justify-center font-headline font-bold text-base text-[#FF5357] uppercase shadow-[0_0_10px_rgba(255,83,87,0.2)]">
                    {donor.username.substring(0, 2)}
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-[#FF0033]/15 border border-[#FF0033]/30 text-[#FF5357] font-mono-hud font-extrabold text-xs">
                    {donor.profile?.blood_type || 'A+'}
                  </span>
                </div>

                <div>
                  <h3 className="font-headline font-bold text-base text-[#1A1A1A] dark:text-[#E5E2E3] truncate">{donor.username}</h3>
                  <p className="text-xs font-mono-hud text-[#0096C7] dark:text-[#00F1FE] mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {donor.profile?.city || 'Nairobi'}
                  </p>
                  <p className="text-[11px] text-[#6C757D] dark:text-[#919095] mt-1.5">
                    Availability: <strong className="text-[#1A1A1A] dark:text-[#E5E2E3]">{donor.profile?.availability || 'Anyday'}</strong>
                  </p>
                </div>

                <div className="pt-3 border-t border-[#DEE2E6] dark:border-[#2A2A2B] flex items-center gap-2">
                  <Link
                    href={`/chat?other_id=${donor.id}`}
                    className="flex-1 bg-[#F1F3F5] dark:bg-[#2A2A2B] hover:bg-[#FF0033] hover:text-white border border-[#DEE2E6] dark:border-white/10 text-[#1A1A1A] dark:text-[#E5E2E3] text-xs font-mono-hud font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>CHAT</span>
                  </Link>

                  {donor.profile?.phone_number && (
                    <a
                      href={`https://wa.me/${donor.profile.phone_number.replace(/[^\d]/g, '')}?text=Hello%20${donor.username},%20we%20found%20your%20profile%20on%20BloodHero.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-[#00A86B]/15 dark:bg-[#00FF94]/15 border border-[#00A86B]/30 text-[#00A86B] dark:text-[#00FF94] hover:bg-[#00A86B]/30 transition"
                      title="WhatsApp contact"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
