const BASE_URL = 'http://localhost:8080/api';
const WS_BASE_URL = 'ws://localhost:8080/ws/chat';

export interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  profile?: Profile;
}

export interface Profile {
  id: number;
  user_id: number;
  date_of_birth: string;
  photo_url?: string;
  availability: string;
  gender: string;
  blood_type: string;
  city: string;
  phone_number: string;
  latitude?: number;
  longitude?: number;
}

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

export interface DonationMade {
  id: number;
  donor_id: number;
  date: string;
  location: string;
  blood_type: string;
  quantity_ml: number;
  notes?: string;
  points_earned: number;
  created_at: string;
}

export interface RewardStatus {
  total_points: number;
  current_badge: 'None' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  next_badge: string;
  points_needed: number;
}

export interface ChatRow {
  chat_id: number;
  other_user: User;
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

// Token helper methods
export const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;
export const setToken = (token: string) => typeof window !== 'undefined' && localStorage.setItem('token', token);
export const removeToken = () => typeof window !== 'undefined' && localStorage.removeItem('token');

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user: User) => {
  if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(user));
};

export const removeCurrentUser = () => {
  if (typeof window !== 'undefined') localStorage.removeItem('user');
};

// Base Fetch request helper
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Authentication APIs
export const authApi = {
  login: async (payload: any) => {
    const data = await request<{ token: string; user: User }>('/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setToken(data.token);
    setCurrentUser(data.user);
    return data;
  },
  
  register: async (payload: any) => {
    const data = await request<{ token: string; user: User }>('/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setToken(data.token);
    setCurrentUser(data.user);
    return data;
  },

  updateProfile: async (payload: any) => {
    const data = await request<{ message: string; user: User }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    setCurrentUser(data.user);
    return data;
  },

  logout: () => {
    removeToken();
    removeCurrentUser();
  }
};

// Bookings APIs
export const bookingApi = {
  list: () => request<Booking[]>('/bookings'),
  create: (payload: any) => request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  delete: (id: number) => request<{ message: string }>(`/bookings/${id}`, { method: 'DELETE' }),
};

// Blood Requests APIs
export const requestApi = {
  list: () => request<BloodRequest[]>('/requests'),
  count: (since?: string) => request<{ count: number }>(`/requests/count${since ? `?since=${encodeURIComponent(since)}` : ''}`),
  create: (payload: any) => request<{ request: BloodRequest; matching_donors: any[]; message: string }>('/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

// Donations APIs
export const donationApi = {
  list: () => request<DonationMade[]>('/donations'),
  log: (payload: any) => request<{ message: string; donation: DonationMade }>('/donations', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  rewards: () => request<RewardStatus>('/rewards'),
};

// Chat APIs
export const chatApi = {
  list: () => request<ChatRow[]>('/chats'),
  messages: (otherId: number) => request<Message[]>(`/chats/${otherId}/messages`),
  markRead: (otherId: number) => request<{ marked_read: number }>(`/chats/${otherId}/read`, { method: 'POST' }),
  users: () => request<User[]>('/users'),
};

// Admin APIs
export interface AdminStats {
  total_users: number;
  total_donations: number;
  total_donation_volume_ml: number;
  total_active_bookings: number;
  total_active_requests: number;
}

export const adminApi = {
  getStats: () => request<AdminStats>('/admin/stats'),
  listUsers: () => request<User[]>('/admin/users'),
  deleteUser: (id: number) => request<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),
  listBookings: () => request<Booking[]>('/admin/bookings'),
  updateBooking: (id: number, status: string) => request<Booking>(`/admin/bookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  listRequests: () => request<BloodRequest[]>('/admin/requests'),
  deleteRequest: (id: number) => request<{ message: string }>(`/admin/requests/${id}`, { method: 'DELETE' }),
};

// WebSocket connection string generator
export const getWebSocketUrl = (): string => {
  const token = getToken();
  return `${WS_BASE_URL}?token=${encodeURIComponent(token || '')}`;
};
