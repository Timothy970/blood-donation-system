'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, Home, Calendar, AlertCircle, Award, MessageSquare, Users, User, LogOut, Shield } from 'lucide-react';
import { authApi, getCurrentUser, requestApi, chatApi, User as UserType } from '@/lib/api';
import ThemeToggle from './ThemeToggle';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [sosCount, setSosCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    if (pathname === '/requests') {
      localStorage.setItem('sos_last_viewed', new Date().toISOString());
      setSosCount(0);
    }
  }, [pathname]);

  useEffect(() => {
    const handleChatUpdate = () => {
      const currentUser = getCurrentUser();
      if (!currentUser) return;
      chatApi.list()
        .then(chats => {
          const totalUnread = chats.reduce((acc, row) => acc + row.unread_count, 0);
          setUnreadMessageCount(totalUnread);
        })
        .catch(err => console.error(err));
    };

    const handleProfileUpdate = () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    };

    window.addEventListener('chatUpdate', handleChatUpdate);
    window.addEventListener('profileUpdate', handleProfileUpdate);
    return () => {
      window.removeEventListener('chatUpdate', handleChatUpdate);
      window.removeEventListener('profileUpdate', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);

    const fetchData = () => {
      // Fetch SOS count
      if (pathname === '/requests') {
        setSosCount(0);
      } else {
        const lastViewed = localStorage.getItem('sos_last_viewed');
        requestApi.count(lastViewed || undefined)
          .then(res => setSosCount(pathname === '/requests' ? 0 : res.count))
          .catch(err => console.error(err));
      }

      // Fetch Chat unread count
      chatApi.list()
        .then(chats => {
          const totalUnread = chats.reduce((acc, row) => acc + row.unread_count, 0);
          setUnreadMessageCount(totalUnread);
        })
        .catch(err => console.error(err));
    };

    fetchData();

    // Poll every 15s to be more responsive to new messages
    const interval = setInterval(fetchData, 15000);

    return () => clearInterval(interval);
  }, [router, pathname]);

  const handleLogout = () => {
    authApi.logout();
    router.push('/');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Book Donation', href: '/book', icon: Calendar },
    { name: 'SOS Alerts', href: '/requests', icon: AlertCircle, badge: sosCount > 0 ? sosCount : undefined },
    { name: 'Rewards', href: '/rewards', icon: Award },
    { name: 'Live Chat', href: '/chat', icon: MessageSquare, badge: unreadMessageCount > 0 ? unreadMessageCount : undefined },
    { name: 'Find Donors', href: '/users', icon: Users },
    { name: 'Profile Settings', href: '/profile', icon: User },
  ];

  if (user && user.role === 'admin') {
    navItems.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
  }

  if (!user) return null;

  return (
    <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-[#E9ECEF] dark:border-[#2A2A2B] bg-white/90 dark:bg-[#0E0E0F]/90 backdrop-blur-xl flex flex-col lg:h-screen lg:sticky lg:top-0 justify-between">
      <div className="flex flex-col">
        {/* Brand */}
        <div className="p-6 border-b border-[#E9ECEF] dark:border-[#2A2A2B] flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF0033] to-[#FF5357] shadow-[0_0_15px_rgba(255,0,51,0.4)]">
              <Heart className="w-5 h-5 text-white fill-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00FF94] pulse-active" />
            </div>
            <div>
              <span className="font-headline font-extrabold text-lg tracking-tight text-[#1A1A1A] dark:text-[#E5E2E3]">BloodHero</span>
              <span className="block text-[10px] font-mono-hud text-[#0096C7] dark:text-[#00F1FE] tracking-widest uppercase">v2.4</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle className="lg:hidden" />
          </div>
        </div>

        {/* User Card */}
        <div className="m-4 p-3.5 rounded-2xl bg-[#F1F3F5] dark:bg-[#1C1B1C]/80 border border-[#E9ECEF] dark:border-white/10 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#E9ECEF] dark:bg-[#2A2A2B] border border-[#FF5357]/40 flex items-center justify-center text-[#FF5357] font-headline font-bold text-sm uppercase shadow-[0_0_10px_rgba(255,83,87,0.2)]">
            {user.username.substring(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-headline font-semibold text-sm text-[#1A1A1A] dark:text-[#E5E2E3] truncate">{user.username}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-mono-hud text-[#6C757D] dark:text-[#919095]">TYPE:</span>
              <span className="px-2 py-0.5 rounded-md bg-[#FF5357]/20 border border-[#FF5357]/40 text-[#FF5357] font-mono-hud font-bold text-xs">
                {user.profile?.blood_type || 'O-'}
              </span>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="px-4 py-2 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#FF0033]/10 dark:bg-[#2A2A2B]/80 text-[#FF5357] border border-[#FF5357]/40 shadow-[0_0_15px_rgba(255,83,87,0.15)]'
                    : 'text-[#6C757D] dark:text-[#919095] hover:bg-[#E9ECEF] dark:hover:bg-[#1C1B1C] hover:text-[#1A1A1A] dark:hover:text-[#E5E2E3] border border-transparent'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#FF5357]' : 'text-[#6C757D] dark:text-[#919095]'}`} />
                  {item.badge !== undefined && (
                    <span className={`lg:hidden absolute -top-1.5 -right-1.5 text-white text-[9px] font-mono-hud font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 ${
                      item.name === 'SOS Alerts' ? 'bg-[#FF0033] shadow-[0_0_10px_rgba(255,0,51,0.6)] pulse-active' : 'bg-[#0096C7] dark:bg-[#00F1FE] text-white dark:text-black'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="hidden lg:inline font-headline text-sm">{item.name}</span>
                {item.badge !== undefined && (
                  <span className={`hidden lg:flex ml-auto text-xs font-mono-hud font-bold px-2 py-0.5 rounded-full ${
                    item.name === 'SOS Alerts' ? 'bg-[#FF0033] text-white shadow-[0_0_10px_rgba(255,0,51,0.6)] pulse-active' : 'bg-[#0096C7] dark:bg-[#00F1FE] text-white dark:text-black'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout & Theme Toggle */}
      <div className="p-4 border-t border-[#E9ECEF] dark:border-[#2A2A2B] hidden lg:flex items-center justify-between gap-3">
        <button
          onClick={handleLogout}
          className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-mono-hud font-semibold text-[#6C757D] dark:text-[#919095] hover:bg-[#E9ECEF] dark:hover:bg-[#2A2A2B] hover:text-[#FF5357] border border-transparent transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>TERMINATE SESSION</span>
        </button>
        <ThemeToggle />
      </div>
    </aside>
  );
}
