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
    <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-900 bg-slate-950 flex flex-col lg:h-screen lg:sticky lg:top-0 justify-between">
      <div className="flex flex-col">
        {/* Brand */}
        <div className="p-6 border-b border-slate-900 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="bg-red-600 p-2 rounded-lg">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-extrabold text-lg text-slate-100">BloodHero</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle className="lg:hidden" />
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-900 bg-slate-900/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-950/40 border border-red-800/30 flex items-center justify-center text-red-500 font-extrabold text-sm uppercase">
            {user.username.substring(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-100 truncate">{user.username}</p>
            <p className="text-xs text-red-400 font-bold truncate">Blood Type: {user.profile?.blood_type || 'A+'}</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold transition shrink-0 ${
                  isActive
                    ? 'bg-red-950/30 border border-red-950 text-red-500'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 border border-transparent'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge !== undefined && (
                    <span className={`lg:hidden absolute -top-1.5 -right-1.5 text-white text-[8px] font-black min-w-[15px] h-3.5 rounded-full flex items-center justify-center px-0.5 ${
                      item.name === 'SOS Alerts' ? 'bg-red-600 animate-pulse' : 'bg-blue-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="hidden lg:inline">{item.name}</span>
                {item.badge !== undefined && (
                  <span className={`hidden lg:flex ml-auto text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                    item.name === 'SOS Alerts' ? 'bg-red-600 animate-pulse' : 'bg-blue-600'
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
      <div className="p-4 border-t border-slate-900 hidden lg:flex items-center justify-between gap-3">
        <button
          onClick={handleLogout}
          className="flex-1 flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-900/60 hover:text-red-400 border border-transparent transition"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
        <ThemeToggle />
      </div>
    </aside>
  );
}
