'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Activity, Shield, Users, MessageSquare, AlertCircle, Phone, MapPin, Award, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { requestApi, getToken, getCurrentUser, BloodRequest, User } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function LandingPage() {
  const router = useRouter();
  const [sosRequests, setSosRequests] = useState<BloodRequest[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    requestApi.list()
      .then(data => {
        setSosRequests(data.filter(r => r.is_emergency).slice(0, 3));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load requests:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#131314] text-[#E5E2E3] flex flex-col justify-between selection:bg-[#FF0033] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#2A2A2B] bg-[#0E0E0F]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF0033] to-[#FF5357] shadow-[0_0_20px_rgba(255,0,51,0.5)]">
              <Heart className="w-5.5 h-5.5 text-white fill-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00FF94] pulse-active" />
            </div>
            <div>
              <span className="font-headline font-black text-xl tracking-tight text-[#E5E2E3]">BloodHero</span>
              <span className="block text-[10px] font-mono-hud text-[#00F1FE] tracking-widest uppercase">v2.4</span>
            </div>
          </div>

          <nav className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard" className="bg-[#FF0033] hover:bg-[#FF5357] text-white font-headline font-bold text-xs uppercase px-5 py-2.5 rounded-xl transition shadow-[0_0_15px_rgba(255,0,51,0.4)] flex items-center gap-2">
                <span>DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-xs font-mono-hud font-semibold text-[#919095] hover:text-[#E5E2E3] px-3 py-2 transition">
                  SIGN IN
                </Link>
                <Link href="/register" className="bg-[#FF0033] hover:bg-[#FF5357] text-white font-headline font-bold text-xs uppercase px-5 py-2.5 rounded-xl transition shadow-[0_0_15px_rgba(255,0,51,0.4)] flex items-center gap-2">
                  <span>JOIN NETWORK</span>
                  <Zap className="w-4 h-4" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center">
        {/* User Logged In Alert Banner */}
        {user && (
          <div className="w-full bg-[#1C1B1C] border-b border-[#FF5357]/30 py-2.5 px-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#00FF94] font-mono-hud">
                <CheckCircle2 className="w-4 h-4" />
                <span>SESSION ACTIVE: Welcome back, <strong className="text-[#E5E2E3]">{user.username}</strong> ({user.profile?.blood_type || 'Donor'})</span>
              </div>
              <Link href="/dashboard" className="text-[#FF5357] hover:underline font-headline font-bold flex items-center gap-1">
                Go to Dashboard &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="relative w-full max-w-7xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-12 gap-12 items-center">
          {/* Background Glows */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF0033]/15 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[30rem] h-[30rem] bg-[#00F1FE]/10 blur-[160px] rounded-full pointer-events-none" />

          {/* Hero Left Content */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2.5 bg-[#1C1B1C] border border-[#FF0033]/40 text-[#FF5357] text-xs font-mono-hud font-semibold px-4 py-2 rounded-full w-fit mx-auto lg:mx-0 shadow-[0_0_15px_rgba(255,0,51,0.2)]">
              <span className="w-2 h-2 rounded-full bg-[#00FF94] pulse-active" />
              <span>REAL-TIME GEO MATCHING NETWORK</span>
            </div>

            <h1 className="font-headline font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-[#E5E2E3]">
              Be a Life Saver.<br />
              <span className="bg-gradient-to-r from-[#FF0033] via-[#FF5357] to-[#00F1FE] bg-clip-text text-transparent">
                Donate Blood Today.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#919095] max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">
              Next-generation blood donation system bridging donors and recipients instantly. Log verified donations, earn XP badges, coordinate with medical clinics, and respond to emergency SOS alerts.
            </p>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-3">
              <Link href="/register" className="bg-gradient-to-r from-[#FF0033] to-[#FF5357] hover:from-[#FF5357] hover:to-[#FF0033] text-white font-headline font-bold text-sm px-8 py-4 rounded-2xl shadow-[0_0_25px_rgba(255,0,51,0.4)] transition duration-200 hover:scale-105 transform flex items-center gap-3">
                <Heart className="w-5 h-5 fill-white" />
                <span>BECOME A DONOR</span>
              </Link>

              <Link href="/requests" className="bg-[#1C1B1C] hover:bg-[#2A2A2B] border border-[#00F1FE]/40 text-[#00F1FE] font-headline font-bold text-sm px-8 py-4 rounded-2xl shadow-[0_0_20px_rgba(0,241,254,0.15)] transition duration-200 hover:scale-105 transform flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#00F1FE]" />
                <span>VIEW SOS BROADCASTS</span>
              </Link>
            </div>

            {/* Metrics Ticker */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-[#2A2A2B] mt-4">
              <div className="p-3.5 rounded-xl bg-[#0E0E0F]/80 border border-[#2A2A2B]">
                <div className="text-2xl font-headline font-extrabold text-[#E5E2E3]">1.4K+</div>
                <div className="text-[10px] font-mono-hud text-[#919095] uppercase mt-0.5">Active Donors</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0E0E0F]/80 border border-[#2A2A2B]">
                <div className="text-2xl font-headline font-extrabold text-[#00FF94]">98.4%</div>
                <div className="text-[10px] font-mono-hud text-[#919095] uppercase mt-0.5">SOS Match Rate</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0E0E0F]/80 border border-[#2A2A2B]">
                <div className="text-2xl font-headline font-extrabold text-[#00F1FE]">&lt; 12m</div>
                <div className="text-[10px] font-mono-hud text-[#919095] uppercase mt-0.5">Avg Response Time</div>
              </div>
            </div>
          </div>

          {/* Hero Right - Emergency SOS Feed */}
          <div className="lg:col-span-5 w-full flex flex-col gap-4 glass-card p-6.5 rounded-3xl border border-[#FF5357]/30 shadow-[0_0_30px_rgba(255,0,51,0.15)] z-10">
            <div className="flex justify-between items-center border-b border-[#2A2A2B] pb-4">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-[#FF0033]" />
                <h3 className="font-headline font-bold text-[#E5E2E3] text-base">EMERGENCY SOS BROADCASTS</h3>
              </div>
              <span className="bg-[#FF0033]/20 text-[#FF0033] border border-[#FF0033]/40 text-[10px] font-mono-hud font-bold px-2.5 py-1 rounded-lg pulse-active">
                LIVE
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-[#919095] font-mono-hud text-xs animate-pulse">
                SCANNING LOCAL SATELLITE CHANNELS...
              </div>
            ) : sosRequests.length === 0 ? (
              <div className="py-8 text-center bg-[#0E0E0F]/60 rounded-2xl border border-[#2A2A2B] p-4">
                <Shield className="w-8 h-8 text-[#00FF94] mx-auto mb-2 opacity-80" />
                <p className="font-headline font-semibold text-sm text-[#E5E2E3]">No Active Emergencies</p>
                <p className="text-xs text-[#919095] mt-1 font-sans">All regional hospital blood reserves are currently optimal.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sosRequests.map((req) => (
                  <div key={req.id} className="p-4 rounded-2xl bg-[#0E0E0F]/90 border border-[#FF5357]/40 hover:border-[#FF5357] transition flex flex-col gap-2 shadow-md">
                    <div className="flex justify-between items-center">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#FF0033]/20 border border-[#FF0033]/40 text-[#FF5357] font-mono-hud font-extrabold text-xs">
                        GROUP {req.blood_type} NEEDED
                      </span>
                      <span className="text-[10px] font-mono-hud text-[#919095]">
                        {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="font-headline font-bold text-sm text-[#E5E2E3]">{req.location || 'Emergency Medical Center'}</h4>
                    <div className="flex items-center justify-between text-xs text-[#919095] border-t border-[#2A2A2B] pt-2 mt-1 font-mono-hud">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#00F1FE]" />
                        {req.first_name} {req.last_name}
                      </span>
                      <span className="text-[#FF5357] font-bold">URGENT SOS</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link href="/requests" className="w-full mt-2 text-center text-xs font-mono-hud font-bold text-[#00F1FE] hover:underline flex items-center justify-center gap-1.5 py-2">
              <span>EXPLORE ALL EMERGENCY REQUESTS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="w-full border-t border-[#2A2A2B] bg-[#0E0E0F]/50 py-20">
          <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
            <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
              <span className="text-[11px] font-mono-hud text-[#00F1FE] tracking-widest uppercase">ARCHITECTURE</span>
              <h2 className="font-headline font-black text-3xl sm:text-4xl text-[#E5E2E3]">
                Engineered For Critical Response Speed
              </h2>
              <p className="text-sm text-[#919095]">
                Built with precision features designed to eliminate delay between donor availability and recipient need.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="glass-card p-6 rounded-2xl border border-[#2A2A2B] hover:border-[#FF5357]/40 transition flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FF0033]/15 border border-[#FF0033]/30 flex items-center justify-center text-[#FF5357]">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-headline font-bold text-lg text-[#E5E2E3]">GPS Geo-Matching</h3>
                <p className="text-xs text-[#919095] leading-relaxed">
                  Real-time coordinate calculations automatically notify nearest eligible donors during local hospital blood shortages.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-card p-6 rounded-2xl border border-[#2A2A2B] hover:border-[#00F1FE]/40 transition flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#00F1FE]/15 border border-[#00F1FE]/30 flex items-center justify-center text-[#00F1FE]">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-headline font-bold text-lg text-[#E5E2E3]">Gamified Rewards & XP</h3>
                <p className="text-xs text-[#919095] leading-relaxed">
                  Earn points and unlock tier badges (Bronze, Silver, Gold, Platinum) with every validated donation logged.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-card p-6 rounded-2xl border border-[#2A2A2B] hover:border-[#00FF94]/40 transition flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#00FF94]/15 border border-[#00FF94]/30 flex items-center justify-center text-[#00FF94]">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-headline font-bold text-lg text-[#E5E2E3]">Instant Encrypted Chat</h3>
                <p className="text-xs text-[#919095] leading-relaxed">
                  Direct live messaging between blood seekers, donors, and clinic coordinators with real-time websocket updates.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="glass-card p-6 rounded-2xl border border-[#2A2A2B] hover:border-[#FFAB00]/40 transition flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFAB00]/15 border border-[#FFAB00]/30 flex items-center justify-center text-[#FFAB00]">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="font-headline font-bold text-lg text-[#E5E2E3]">Clinic Intake QR</h3>
                <p className="text-xs text-[#919095] leading-relaxed">
                  Instant QR code generation allows hospital nurses to scan member profiles and automatically confirm donation quantities.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2A2A2B] bg-[#0E0E0F] py-8 px-6 text-center text-xs font-mono-hud text-[#919095]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#FF0033] fill-[#FF0033]" />
            <span className="font-headline font-bold text-[#E5E2E3]">BloodHero System</span>
          </div>
          <span>&copy; {new Date().getFullYear()} BloodHero Network. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/requests" className="hover:text-[#E5E2E3]">SOS Alerts</Link>
            <Link href="/login" className="hover:text-[#E5E2E3]">Sign In</Link>
            <Link href="/register" className="hover:text-[#E5E2E3]">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
