// src/stores/user.js - Pinia store for user state (token, userId)
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: null,
    token: localStorage.getItem('token') || null  // Load from localStorage on init
  }),
  actions: {
    setUser(userId, token = null) {
      this.userId = userId;
      if (token) {
        this.token = token;
        localStorage.setItem('token', token);  // Save to localStorage
      }
    },
    logout() {
      this.userId = null;
      this.token = null;
      localStorage.removeItem('token');
    },
    isAuthenticated() {
      return !!this.token;  // True if token exists
    }
  }
});