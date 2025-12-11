import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set, get) => ({
  user: null,
  loading: false,
  pendingRequestsCount: 0,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      set({ user: data.user, loading: false });
      // Fetch pending requests count after login
      get().fetchPendingRequestsCount();
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (userData) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/register', userData);
      set({ user: data.user, loading: false });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
      set({ user: null, pendingRequestsCount: 0 });
    } catch (error) {
      set({ user: null, pendingRequestsCount: 0 });
    }
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user });
      // Fetch pending requests count after getting user
      get().fetchPendingRequestsCount();
    } catch (error) {
      set({ user: null, pendingRequestsCount: 0 });
    }
  },

  fetchPendingRequestsCount: async () => {
    try {
      const { data } = await api.get('/requests/received');
      const pendingCount = data.data?.filter(req => req.status === 'pending').length || 0;
      set({ pendingRequestsCount: pendingCount });
    } catch (error) {
      set({ pendingRequestsCount: 0 });
    }
  },

  decrementPendingCount: () => {
    const currentCount = get().pendingRequestsCount;
    if (currentCount > 0) {
      set({ pendingRequestsCount: currentCount - 1 });
    }
  }
}));

export default useAuthStore;
