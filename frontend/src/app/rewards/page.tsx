'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { donationApi, RewardStatus } from '@/lib/api';
import { Award, Shield, CheckCircle2, AlertCircle, Download, Activity, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RewardsPage() {
  const [rewards, setRewards] = useState<RewardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    donationApi.rewards()
      .then(res => {
        setRewards(res);
        setLoading(false);
        // Trigger confetti celebration if they have a badge!
        if (res.current_badge !== 'None') {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#FF0033', '#FF5357', '#00F1FE', '#ffffff']
          });
        }
      })
      .catch(err => {
        console.error('Failed to load rewards:', err);
        setLoading(false);
      });
  }, []);

  const downloadCertificate = () => {
    if (!rewards || rewards.current_badge === 'None') return;
    setDownloading(true);

    const userName = JSON.parse(localStorage.getItem('user') || '{}').username || 'Blood Hero';
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate certified SVG template and save
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">
        <rect width="800" height="560" fill="#0E0E0F"/>
        <rect x="20" y="20" width="760" height="520" fill="none" stroke="#FF0033" stroke-width="4" rx="16"/>
        <rect x="28" y="28" width="744" height="504" fill="none" stroke="#2A2A2B" stroke-width="1" rx="12"/>
        
        <!-- Decorative Glow -->
        <circle cx="400" cy="180" r="100" fill="#FF0033" opacity="0.1" filter="blur(40px)"/>
        
        <!-- Header -->
        <text x="400" y="90" fill="#FF0033" font-family="'Sora', sans-serif" font-weight="900" font-size="28" text-anchor="middle" letter-spacing="4">BLOODHERO NETWORK</text>
        <text x="400" y="120" fill="#00F1FE" font-family="'JetBrains Mono', monospace" font-weight="600" font-size="12" text-anchor="middle" letter-spacing="2">CERTIFICATE OF COMMENDATION</text>
        
        <!-- Main Body -->
        <text x="400" y="200" fill="#919095" font-family="'Sora', sans-serif" font-size="16" text-anchor="middle">This is proudly awarded to</text>
        <text x="400" y="250" fill="#E5E2E3" font-family="'Sora', sans-serif" font-weight="800" font-size="36" text-anchor="middle" letter-spacing="1">${userName.toUpperCase()}</text>
        <text x="400" y="290" fill="#919095" font-family="'Sora', sans-serif" font-size="14" text-anchor="middle" max-width="500">
          in grateful recognition of selfless service as a registered blood donor.
        </text>
        <text x="400" y="315" fill="#919095" font-family="'Sora', sans-serif" font-size="14" text-anchor="middle">
          Your contributions help secure critical supply chains and save countless lives.
        </text>
        
        <!-- Badge Type -->
        <rect x="300" y="360" width="200" height="50" fill="#1C1B1C" stroke="#FF5357" stroke-width="1.5" rx="25"/>
        <text x="400" y="392" fill="#FF5357" font-family="'JetBrains Mono', monospace" font-weight="950" font-size="18" text-anchor="middle" letter-spacing="2">${rewards.current_badge.toUpperCase()} TIER</text>
        
        <!-- Footer Signatures -->
        <line x1="150" y1="470" x2="310" y2="470" stroke="#2A2A2B" stroke-width="1.5"/>
        <text x="230" y="490" fill="#919095" font-family="'JetBrains Mono', monospace" font-size="11" text-anchor="middle">Blood Bank Director</text>
        
        <line x1="490" y1="470" x2="650" y2="470" stroke="#2A2A2B" stroke-width="1.5"/>
        <text x="570" y="490" fill="#919095" font-family="'JetBrains Mono', monospace" font-size="11" text-anchor="middle">Date issued: ${dateStr}</text>
      </svg>
    `;

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${userName}_bloodhero_certificate.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  const badgeTiers = [
    { name: 'Bronze', points: 50, color: 'text-amber-500', bg: 'bg-[#FFAB00]/15 border-[#FFAB00]/40' },
    { name: 'Silver', points: 100, color: 'text-slate-300', bg: 'bg-slate-800/40 border-slate-700/40' },
    { name: 'Gold', points: 200, color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/40' },
    { name: 'Platinum', points: 400, color: 'text-[#00F1FE]', bg: 'bg-[#00F1FE]/15 border-[#00F1FE]/40' },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA] dark:bg-[#131314] text-[#1A1A1A] dark:text-[#E5E2E3] selection:bg-[#FF0033] selection:text-white">
      <Navigation />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#00FF94] pulse-active shadow-[0_0_12px_rgba(0,255,148,0.8)]" />
            <h1 className="font-headline text-3xl font-extrabold text-[#E5E2E3] tracking-tight">Gamified Rewards</h1>
          </div>
          <p className="text-xs font-mono-hud text-[#00F1FE] mt-1 tracking-wider uppercase">ACQUIRE XP POINTS FOR DONATIONS & DOWNLOAD CERTIFIED BADGES</p>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <Activity className="w-10 h-10 text-[#FF5357] animate-spin" />
            <span className="text-[#919095] font-mono-hud text-xs">LOADING CERTIFICATES...</span>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left - Certificate Display Card */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {rewards?.current_badge === 'None' ? (
                <div className="glass-card p-8 rounded-3xl border border-[#2A2A2B] text-center flex flex-col items-center justify-center gap-5 py-24 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  <div className="bg-[#FF0033]/15 border border-[#FF0033]/30 p-5.5 rounded-full text-[#FF5357]">
                    <Trophy className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-[#E5E2E3] text-lg">No Badge Earned Yet</h3>
                    <p className="text-xs font-mono-hud text-[#919095] max-w-xs mt-1.5 mx-auto leading-normal">
                      You need at least 50 points to unlock the Bronze Certificate. Current progress: {rewards?.total_points || 0} / 50 XP.
                    </p>
                  </div>
                  <div className="w-full max-w-xs bg-[#0E0E0F] border border-[#2A2A2B] p-1 rounded-full overflow-hidden h-4">
                    <div 
                      className="bg-gradient-to-r from-[#FF0033] to-[#FF5357] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, ((rewards?.total_points || 0) / 50) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="glass-card p-8 rounded-3xl border border-[#FF5357]/40 flex flex-col gap-8 shadow-[0_0_35px_rgba(255,0,51,0.2)] relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 w-48 h-48 bg-[#FF0033]/10 blur-[60px] rounded-full pointer-events-none" />
                  
                  {/* Certificate Frame Preview */}
                  <div className="border border-[#2A2A2B] p-6 rounded-2xl bg-[#0E0E0F] flex flex-col items-center text-center gap-6 relative">
                    <div className="absolute inset-4 border border-[#2A2A2B]/60 rounded-xl pointer-events-none" />
                    
                    <span className="text-[#FF0033] font-headline font-extrabold text-xs tracking-widest mt-4">BLOODHERO NETWORK</span>
                    <div>
                      <h4 className="text-[#00F1FE] font-mono-hud text-xs uppercase tracking-wider">Certificate of Commendation</h4>
                      <p className="text-2xl font-headline font-black text-[#E5E2E3] tracking-tight mt-6 uppercase">
                        {typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').username : 'Blood Hero'}
                      </p>
                      <p className="text-xs font-sans text-[#919095] mt-2 max-w-md mx-auto leading-normal">
                        For outstanding public service as a registered donor. Your actions help stabilize inventories and protect local hospital networks.
                      </p>
                    </div>

                    <div className="bg-[#1C1B1C] border border-[#FF5357]/50 px-6 py-2.5 rounded-full text-[#FF5357] font-mono-hud font-extrabold text-sm tracking-widest uppercase shadow-[0_0_15px_rgba(255,83,87,0.3)]">
                      {rewards?.current_badge} TIER
                    </div>

                    <div className="w-full border-t border-[#2A2A2B] mt-6 pt-4 text-[10px] font-mono-hud text-[#919095] flex justify-between px-4 mb-2">
                      <span>Blood Bank Director</span>
                      <span>Verified Digital Record</span>
                    </div>
                  </div>

                  <button
                    onClick={downloadCertificate}
                    disabled={downloading}
                    className="w-full bg-gradient-to-r from-[#FF0033] to-[#FF5357] hover:from-[#FF5357] hover:to-[#FF0033] text-white font-headline font-bold text-xs uppercase py-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(255,0,51,0.4)] transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" />
                    <span>{downloading ? 'EXPORTING SVG...' : 'DOWNLOAD CERTIFIED BADGE (SVG)'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right - Tiers breakdown */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="glass-card p-6 rounded-3xl border border-[#2A2A2B] flex flex-col gap-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <h3 className="font-headline font-bold text-[#E5E2E3] text-base uppercase tracking-wider">BADGE TIER LEVELS</h3>
                <p className="text-xs font-mono-hud text-[#919095] leading-normal">
                  Log donations to earn XP points (10 XP per 100ml donated). Accumulate points to climb badge levels:
                </p>

                <div className="flex flex-col gap-3">
                  {badgeTiers.map((tier) => {
                    const isUnlocked = (rewards?.total_points || 0) >= tier.points;
                    return (
                      <div
                        key={tier.name}
                        className={`p-4.5 rounded-2xl border flex justify-between items-center transition ${
                          isUnlocked 
                            ? `${tier.bg}` 
                            : 'bg-[#0E0E0F]/40 border-[#2A2A2B] opacity-40'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <Award className={`w-5 h-5 ${tier.color}`} />
                          <div>
                            <p className="font-headline font-bold text-[#E5E2E3] text-sm">{tier.name} Tier</p>
                            <p className="text-[10px] font-mono-hud text-[#919095] mt-0.5">Required: {tier.points} XP</p>
                          </div>
                        </div>

                        {isUnlocked ? (
                          <span className="bg-[#00FF94]/20 border border-[#00FF94]/40 text-[#00FF94] text-[10px] font-mono-hud font-extrabold uppercase px-2.5 py-1 rounded-lg">
                            UNLOCKED
                          </span>
                        ) : (
                          <span className="bg-[#0E0E0F] border border-[#2A2A2B] text-[#919095] text-[10px] font-mono-hud font-extrabold uppercase px-2.5 py-1 rounded-lg">
                            LOCKED
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
