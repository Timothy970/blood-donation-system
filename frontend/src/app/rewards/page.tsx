'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Award, Shield, CheckCircle, Activity } from 'lucide-react';
import { rewardApi, getCurrentUser, Reward } from '@/lib/api';

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    rewardApi.get()
      .then(res => setRewards(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalPoints = rewards?.total_points ?? 45;
  const currentBadge = rewards?.current_badge || 'Bronze';
  const pointsNeeded = rewards?.points_needed ?? 155;
  const nextBadge = rewards?.next_badge || 'Silver';

  const badges = [
    { title: 'Bronze Hero', points: 50, icon: '🥉', desc: 'Log your 1st blood donation' },
    { title: 'Silver Hero', points: 100, icon: '🥈', desc: 'Reach 100 total donation XP' },
    { title: 'Gold Hero', points: 200, icon: '🥇', desc: 'Reach 200 total donation XP' },
    { title: 'Platinum Lifesaver', points: 400, icon: '🏆', desc: 'Reach 400 total donation XP' },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA] dark:bg-[#131314] text-[#1A1A1A] dark:text-[#E5E2E3] selection:bg-[#FF0033] selection:text-white">
      <Navigation />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#00FF94] pulse-active shadow-[0_0_12px_rgba(0,255,148,0.8)]" />
            <h1 className="font-headline text-3xl font-extrabold text-[#1A1A1A] dark:text-[#E5E2E3] tracking-tight">Gamified Rewards</h1>
          </div>
          <p className="text-xs font-mono-hud text-[#0096C7] dark:text-[#00F1FE] mt-1 tracking-wider uppercase">ACQUIRE XP POINTS FOR DONATIONS & DOWNLOAD CERTIFIED BADGES</p>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <Activity className="w-10 h-10 text-[#FF5357] animate-spin" />
            <span className="text-[#6C757D] dark:text-[#919095] font-mono-hud text-xs">CALCULATING REWARDS XP...</span>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* XP Overview Hero Banner */}
            <div className="lg:col-span-12 glass-card p-8 rounded-3xl border border-[#E9ECEF] dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF0033] to-[#FF5357] border border-white/20 flex items-center justify-center text-white shadow-[0_0_25px_rgba(255,0,51,0.4)]">
                  <Award className="w-10 h-10" />
                </div>
                <div>
                  <span className="text-xs font-mono-hud text-[#6C757D] dark:text-[#919095] uppercase tracking-widest">TOTAL ACCUMULATED XP</span>
                  <h2 className="font-headline font-black text-4xl text-[#1A1A1A] dark:text-[#E5E2E3] mt-1">{totalPoints} <span className="text-sm font-mono-hud font-normal text-[#FF5357]">POINTS</span></h2>
                  <p className="text-xs text-[#0096C7] dark:text-[#00F1FE] font-mono-hud mt-1">CURRENT REWARD TIER: <strong className="text-[#FF5357]">{currentBadge}</strong></p>
                </div>
              </div>

              {pointsNeeded > 0 && (
                <div className="w-full md:w-80 bg-[#F1F3F5] dark:bg-[#0E0E0F] p-4 rounded-2xl border border-[#DEE2E6] dark:border-[#2A2A2B] flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-mono-hud">
                    <span className="text-[#6C757D] dark:text-[#919095]">NEXT MILESTONE: {nextBadge}</span>
                    <span className="text-[#FF5357] font-bold">+{pointsNeeded} XP NEEDED</span>
                  </div>
                  <div className="w-full bg-[#DEE2E6] dark:bg-[#2A2A2B] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#FF0033] to-[#FF5357] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (totalPoints / (totalPoints + pointsNeeded)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Badges Matrix */}
            <div className="lg:col-span-7 glass-card p-6.5 rounded-3xl border border-[#E9ECEF] dark:border-[#2A2A2B] flex flex-col gap-5 shadow-sm">
              <h3 className="font-headline font-bold text-[#1A1A1A] dark:text-[#E5E2E3] text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0096C7] dark:text-[#00F1FE]" />
                <span>BADGE MILESTONE MATRIX</span>
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                {badges.map((b, idx) => {
                  const isUnlocked = totalPoints >= b.points;
                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                        isUnlocked
                          ? 'bg-[#F1F3F5] dark:bg-[#0E0E0F] border-[#00A86B]/40 dark:border-[#00FF94]/40 shadow-sm'
                          : 'bg-[#F1F3F5]/50 dark:bg-[#0E0E0F]/40 border-[#DEE2E6] dark:border-[#2A2A2B] opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-3xl">{b.icon}</span>
                        <span className={`text-[10px] font-mono-hud font-bold px-2.5 py-1 rounded-lg ${
                          isUnlocked ? 'bg-[#00FF94]/20 text-[#00A86B] dark:text-[#00FF94] border border-[#00FF94]/30' : 'bg-[#6C757D]/20 text-[#6C757D] dark:text-[#919095]'
                        }`}>
                          {isUnlocked ? 'UNLOCKED' : `${b.points} XP REQUIRED`}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-headline font-bold text-sm text-[#1A1A1A] dark:text-[#E5E2E3]">{b.title}</h4>
                        <p className="text-xs text-[#6C757D] dark:text-[#919095] mt-1">{b.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Digital Commendation Certificate */}
            <div className="lg:col-span-5 glass-card p-6.5 rounded-3xl border border-[#0096C7]/30 dark:border-[#00F1FE]/30 flex flex-col gap-5 shadow-sm">
              <h3 className="font-headline font-bold text-[#1A1A1A] dark:text-[#E5E2E3] text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-[#FF5357]" />
                <span>DIGITAL COMMENDATION CERTIFICATE</span>
              </h3>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#F1F3F5] via-white to-[#F1F3F5] dark:from-[#1C1B1C] dark:via-[#2A2A2B] dark:to-[#0E0E0F] border border-[#DEE2E6] dark:border-white/10 flex flex-col gap-4">
                <div className="text-center border-b border-[#DEE2E6] dark:border-white/10 pb-4">
                  <span className="text-[10px] font-mono-hud text-[#0096C7] dark:text-[#00F1FE] uppercase tracking-widest">OFFICIAL CITATION</span>
                  <h4 className="font-headline font-extrabold text-lg text-[#1A1A1A] dark:text-[#E5E2E3] mt-1">Certificate of Biological Impact</h4>
                </div>

                <p className="text-xs font-serif italic text-[#6C757D] dark:text-[#919095] text-center leading-relaxed">
                  "This digital commendation certifies that <strong className="text-[#1A1A1A] dark:text-[#E5E2E3] not-italic">{user?.username || 'Valued Donor'}</strong> has actively logged verified blood donations, preserving critical emergency healthcare supply lines."
                </p>

                <div className="pt-3 border-t border-[#DEE2E6] dark:border-white/10 flex items-center justify-between text-[10px] font-mono-hud text-[#6C757D] dark:text-[#919095]">
                  <span className="text-[#00A86B] dark:text-[#00FF94] font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> VERIFIED REGISTER
                  </span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
