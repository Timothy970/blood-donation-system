import { Platform } from 'react-native';

// Dynamically resolve backend host depending on environment variables or execution platform (Android uses loopback 10.0.2.2)
export const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/api';
  }
  return 'http://localhost:8080/api';
};

export const getWebSocketUrl = (): string => {
  const token = getToken();
  const baseWsUrl = process.env.EXPO_PUBLIC_WS_URL || 
    (Platform.OS === 'android' ? 'ws://10.0.2.2:8080/ws/chat' : 'ws://localhost:8080/ws/chat');
  return `${baseWsUrl}?token=${encodeURIComponent(token || '')}`;
};

// In-memory Auth session state
let activeToken: string | null = null;
let activeUser: any | null = null;

export const getToken = () => activeToken;
export const getCurrentUser = () => activeUser;

// Auth state change listeners
type AuthListener = (token: string | null, user: any | null) => void;
const listeners = new Set<AuthListener>();

export const addAuthListener = (l: AuthListener) => {
  listeners.add(l);
  // Send current state immediately
  l(activeToken, activeUser);
  return () => {
    listeners.delete(l);
  };
};

const notifyAuthChange = () => {
  listeners.forEach(l => l(activeToken, activeUser));
};

// Base request helper
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (activeToken) {
    headers.set('Authorization', `Bearer ${activeToken}`);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    let errMsg = `HTTP error! status: ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) {
        errMsg = errJson.error;
      }
    } catch (_) {}
    throw new Error(errMsg);
  }
  
  return response.json() as Promise<T>;
}

// Interfaces
export interface BloodRequest {
  id: number;
  requester_id?: number;
  first_name: string;
  last_name: string;
  blood_type: string;
  contact_number: string;
  location: string;
  latitude?: number;
  longitude?: number;
  is_emergency: boolean;
  created_at: string;
  expires_at: string;
}

export interface Booking {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  date: string;
  time_slot: string;
  location: string;
  status: string;
}

export interface RewardStatus {
  total_points: number;
  current_badge: 'None' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  next_badge: string;
  points_needed: number;
}

export interface ChatRow {
  chat_id: number;
  other_user: {
    id: number;
    username: string;
    email: string;
    profile?: {
      blood_type: string;
    };
  };
  latest_message: string;
  unread_count: number;
  timestamp: string;
}

export interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

// API methods
export const mobileApi = {
  auth: {
    login: async (payload: any) => {
      const res = await fetch(`${getBaseUrl()}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let errMsg = 'Failed to login';
        try {
          const errData = await res.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      activeToken = data.token;
      activeUser = data.user;
      notifyAuthChange();
      return data;
    },
    
    register: async (payload: any) => {
      const res = await fetch(`${getBaseUrl()}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let errMsg = 'Failed to register';
        try {
          const errData = await res.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      activeToken = data.token;
      activeUser = data.user;
      notifyAuthChange();
      return data;
    },
    
    updateProfile: async (payload: any) => {
      const data = await request<{ message: string; user: any }>('/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      activeUser = data.user;
      notifyAuthChange();
      return data;
    },

    logout: () => {
      activeToken = null;
      activeUser = null;
      notifyAuthChange();
    }
  },
  requests: {
    list: () => request<BloodRequest[]>('/requests'),
  },
  bookings: {
    list: () => request<Booking[]>('/bookings'),
    create: (payload: any) => request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  },
  rewards: {
    get: () => request<RewardStatus>('/rewards'),
  },
  chats: {
    list: () => request<ChatRow[]>('/chats'),
    messages: (otherId: number) => request<Message[]>(`/chats/${otherId}/messages`),
    markRead: (otherId: number) => request<{ marked_read: number }>(`/chats/${otherId}/read`, { method: 'POST' }),
    users: () => request<any[]>('/users'),
  },
  admin: {
    getStats: () => request<AdminStats>('/admin/stats'),
    listBookings: () => request<Booking[]>('/admin/bookings'),
    updateBooking: (id: number, status: string) => request<Booking>(`/admin/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
    listRequests: () => request<BloodRequest[]>('/admin/requests'),
    deleteRequest: (id: number) => request<{ message: string }>(`/admin/requests/${id}`, { method: 'DELETE' }),
  }
};

export interface AdminStats {
  total_users: number;
  total_donations: number;
  total_donation_volume_ml: number;
  total_active_bookings: number;
  total_active_requests: number;
}
