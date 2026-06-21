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
            colors: ['#dc2626', '#f43f5e', '#fb923c', '#ffffff']
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
        <rect width="800" height="560" fill="#020617"/>
        <rect x="20" y="20" width="760" height="520" fill="none" stroke="#dc2626" stroke-width="4" rx="16"/>
        <rect x="28" y="28" width="744" height="504" fill="none" stroke="#1e293b" stroke-width="1" rx="12"/>
        
        <!-- Decorative Glow -->
        <circle cx="400" cy="180" r="100" fill="#dc2626" opacity="0.05" filter="blur(40px)"/>
        
        <!-- Header -->
        <text x="400" y="90" fill="#dc2626" font-family="'Inter', sans-serif" font-weight="900" font-size="28" text-anchor="middle" letter-spacing="4">BLOODHERO NETWORK</text>
        <text x="400" y="120" fill="#64748b" font-family="'Inter', sans-serif" font-weight="600" font-size="12" text-anchor="middle" letter-spacing="2">CERTIFICATE OF COMMENDATION</text>
        
        <!-- Main Body -->
        <text x="400" y="200" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="16" text-anchor="middle">This is proudly awarded to</text>
        <text x="400" y="250" fill="#ffffff" font-family="'Inter', sans-serif" font-weight="800" font-size="36" text-anchor="middle" letter-spacing="1">${userName.toUpperCase()}</text>
        <text x="400" y="290" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="14" text-anchor="middle" max-width="500">
          in grateful recognition of selfless service as a registered blood donor.
        </text>
        <text x="400" y="315" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="14" text-anchor="middle">
          Your contributions help secure critical supply chains and save countless lives.
        </text>
        
        <!-- Badge Type -->
        <rect x="300" y="360" width="200" height="50" fill="#1e293b" stroke="#334155" stroke-width="1.5" rx="25"/>
        <text x="400" y="392" fill="#ef4444" font-family="'Inter', sans-serif" font-weight="950" font-size="18" text-anchor="middle" letter-spacing="2">${rewards.current_badge.toUpperCase()} TIER</text>
        
        <!-- Footer Signatures -->
        <line x1="150" y1="470" x2="310" y2="470" stroke="#334155" stroke-width="1.5"/>
        <text x="230" y="490" fill="#64748b" font-family="'Inter', sans-serif" font-size="11" text-anchor="middle">Blood Bank Director</text>
        
        <line x1="490" y1="470" x2="650" y2="470" stroke="#334155" stroke-width="1.5"/>
        <text x="570" y="490" fill="#64748b" font-family="'Inter', sans-serif" font-size="11" text-anchor="middle">Date issued: ${dateStr}</text>
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
    { name: 'Bronze', points: 50, color: 'text-amber-600', bg: 'bg-amber-950/20 border-amber-900/30' },
    { name: 'Silver', points: 100, color: 'text-slate-400', bg: 'bg-slate-900/40 border-slate-800/40' },
    { name: 'Gold', points: 200, color: 'text-yellow-500', bg: 'bg-yellow-950/20 border-yellow-900/30' },
    { name: 'Platinum', points: 400, color: 'text-rose-400', bg: 'bg-rose-950/20 border-rose-900/30' },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Navigation />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Gamified Rewards</h1>
          <p className="text-sm text-slate-400 mt-1">Acquire XP points for donations and download certified badges</p>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <Activity className="w-10 h-10 text-red-500 animate-spin" />
            <span className="text-slate-500 font-semibold">Loading certificates...</span>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left - Certificate Display Card */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {rewards?.current_badge === 'None' ? (
                <div className="glass p-8 rounded-3xl border border-slate-900 text-center flex flex-col items-center justify-center gap-5 py-24">
                  <div className="bg-red-950/30 border border-red-900/20 p-5.5 rounded-full text-red-500">
                    <Trophy className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-100 text-lg">No Badge Earned Yet</h3>
                    <p className="text-xs text-slate-400 max-w-xs mt-1.5 mx-auto leading-normal">
                      You need at least 50 points to unlock the Bronze Certificate. Current progress: {rewards?.total_points || 0} / 50 XP.
                    </p>
                  </div>
                  <div className="w-full max-w-xs bg-slate-950 border border-slate-900 p-1 rounded-full overflow-hidden h-4">
                    <div 
                      className="bg-red-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, ((rewards?.total_points || 0) / 50) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="glass p-8 rounded-3xl border border-red-500/25 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 w-48 h-48 bg-red-600/5 blur-[55px] rounded-full pointer-events-none" />
                  
                  {/* Certificate Frame Preview */}
                  <div className="border border-slate-800 p-6 rounded-2xl bg-slate-950 flex flex-col items-center text-center gap-6 relative">
                    <div className="absolute inset-4 border border-slate-900/50 rounded-xl pointer-events-none" />
                    
                    <span className="text-red-500 font-extrabold text-xs tracking-widest mt-4">BLOODHERO NETWORK</span>
                    <div>
                      <h4 className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Certificate of Commendation</h4>
                      <p className="text-2xl font-black text-slate-100 tracking-tight mt-6 uppercase">
                        {typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').username : 'Blood Hero'}
                      </p>
                      <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-normal">
                        For outstanding public service as a registered donor. Your actions help stabilize inventories and protect local hospital networks.
                      </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800/80 px-6 py-2.5 rounded-full text-red-500 font-black text-sm tracking-widest uppercase">
                      {rewards?.current_badge} TIER
                    </div>

                    <div className="w-full border-t border-slate-900 mt-6 pt-4 text-[10px] text-slate-500 flex justify-between px-4 mb-2">
                      <span>Blood Bank Director</span>
                      <span>Verified Digital Record</span>
                    </div>
                  </div>

                  <button
                    onClick={downloadCertificate}
                    disabled={downloading}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-red-950/30 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" />
                    {downloading ? 'Exporting SVG...' : 'Download Certified Badge (SVG)'}
                  </button>
                </div>
              )}
            </div>

            {/* Right - Tiers breakdown */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="glass p-6 rounded-3xl border border-slate-900 flex flex-col gap-4 shadow-md">
                <h3 className="font-extrabold text-slate-100 text-base">Badge Levels</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Log donations to earn points (approx. 10 points per 100ml donated). Accumulate points to climb badge levels:
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
                            : 'bg-slate-950/20 border-slate-900/50 opacity-40'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <Award className={`w-5 h-5 ${tier.color}`} />
                          <div>
                            <p className="font-bold text-slate-100 text-sm">{tier.name} Tier</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Required: {tier.points} XP</p>
                          </div>
                        </div>

                        {isUnlocked ? (
                          <span className="bg-emerald-950 border border-emerald-900 text-emerald-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">
                            Unlocked
                          </span>
                        ) : (
                          <span className="bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">
                            Locked
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
