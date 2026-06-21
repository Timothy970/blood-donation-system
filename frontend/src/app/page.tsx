'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Activity, Shield, Users, MessageSquare, AlertCircle, Phone, MapPin } from 'lucide-react';
import { requestApi, getToken, BloodRequest } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function LandingPage() {
  const router = useRouter();
  const [sosRequests, setSosRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (getToken()) {
      router.push('/dashboard');
      return;
    }

    // Fetch public requests for SOS ticker
    requestApi.list()
      .then(data => {
        setSosRequests(data.filter(r => r.is_emergency).slice(0, 3));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load requests:', err);
        setLoading(false);
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2.5 rounded-xl shadow-lg shadow-red-900/30">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-red-500 to-rose-400 bg-clip-text text-transparent">
              BloodHero
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-slate-100 transition">
              Sign In
            </Link>
            <Link href="/register" className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4.5 py-2 rounded-xl transition shadow-md shadow-red-900/20 hover:scale-105 active:scale-95 transform">
              Register Now
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center">
        <section className="relative w-full max-w-7xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-12 gap-12 items-center">
          {/* Background Glows */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-red-600/8 blur-[150px] rounded-full pointer-events-none" />

          {/* Hero Left */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-red-950/40 border border-red-800/30 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-full w-fit mx-auto lg:mx-0">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Connecting Donors & Recipients in Real-Time
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-slate-100">
              Be a Life Saver.<br />
              <span className="bg-gradient-to-r from-red-500 via-rose-500 to-orange-400 bg-clip-text text-transparent">
                Donate Blood Today.
              </span>
            </h1>
            <p className="text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              A state-of-the-art platform bridging potential donors and recipients. Log donations, track rewards, message clinics, and broadcast emergency SOS alerts.
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-2">
              <Link href="/register" className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-red-950/40 transition hover:scale-105 hover:shadow-red-900/30 transform duration-200">
                Become a Donor
              </Link>
              <Link href="/requests" className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-semibold px-8 py-4 rounded-2xl shadow-sm transition hover:scale-105 transform duration-200">
                Request Blood
              </Link>
            </div>
          </div>

          {/* Hero Right - SOS Feed */}
          <div className="lg:col-span-5 w-full flex flex-col gap-5 glass p-6.5 rounded-3xl animate-float">
            <div className="flex justify-between items-center border-b border-slate-800/50 pb-4">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-slate-100 text-lg">Urgent SOS Broadcasts</h3>
              </div>
              <span className="bg-red-900/30 text-red-400 text-xs px-2.5 py-1 rounded-lg border border-red-800/20 font-semibold animate-pulse">
                Live
              </span>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Activity className="w-7 h-7 text-slate-600 animate-spin" />
                <span className="text-slate-500 text-sm">Searching for active alerts...</span>
              </div>
            ) : sosRequests.length === 0 ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2.5">
                <Shield className="w-10 h-10 text-slate-800" />
                <span className="font-semibold text-sm">No Active Emergency Requests</span>
                <span className="text-xs text-slate-500">All inventories are currently stable.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {sosRequests.map((req) => (
                  <div key={req.id} className="bg-red-950/15 hover:bg-red-950/25 border border-red-900/20 hover:border-red-900/40 p-4 rounded-2xl transition duration-200 flex flex-col gap-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-red-600/5 blur-[25px] rounded-full" />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-100 text-sm">
                          {req.first_name} {req.last_name}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" /> {req.location}
                        </p>
                      </div>
                      <span className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-md shadow-red-900/30">
                        {req.blood_type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-900/60 pt-2.5">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> {req.contact_number}
                      </span>
                      <Link href="/login" className="text-red-400 font-bold hover:text-red-300 transition">
                        Respond Now →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="text-center pt-2">
              <Link href="/login" className="text-xs text-slate-400 hover:text-slate-100 transition underline underline-offset-4">
                View all active blood requests
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="w-full bg-slate-900/40 border-y border-slate-900 py-20">
          <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold text-slate-100 sm:text-4xl">
                Advanced Features Built to Save Lives
              </h2>
              <p className="mt-4 text-slate-400">
                A premium platform designed to make donor matching fast, secure, and rewarding.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-slate-950/50 border border-slate-900 p-8 rounded-3xl hover:border-slate-800 transition duration-300">
                <div className="bg-red-950/30 p-4.5 rounded-2xl w-fit border border-red-900/20 mb-6">
                  <Activity className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">Smart Compatibility Match</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Matches blood group requests to compatible donors using location metrics and biological compatibility charts automatically.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-950/50 border border-slate-900 p-8 rounded-3xl hover:border-slate-800 transition duration-300">
                <div className="bg-red-950/30 p-4.5 rounded-2xl w-fit border border-red-900/20 mb-6">
                  <MessageSquare className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">Real-Time WebSocket Chat</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Chat instantly with recipients or donation drives. Coordinate logistics, arrange visits, and stay updated through persistent sockets.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-950/50 border border-slate-900 p-8 rounded-3xl hover:border-slate-800 transition duration-300">
                <div className="bg-red-950/30 p-4.5 rounded-2xl w-fit border border-red-900/20 mb-6">
                  <Users className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">Gamification & Rewards</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Earn points for every donation logged. Unlock badges from Bronze to Platinum, and download certified reward certificates.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-10 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-xs flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 BloodHero Donation Network. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-slate-300 transition">Terms & Privacy</Link>
            <span className="text-slate-800">|</span>
            <span className="text-slate-400">WSL & Go Backend Enabled</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
