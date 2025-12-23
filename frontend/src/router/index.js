// src/router/index.js - Vue Router configuration
import { createRouter, createWebHistory } from 'vue-router';

// Import views (LoginView создадим ниже, Dashboard/Transactions — позже)
import LoginView from '../views/LoginView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },  // Default to login
    { path: '/login', component: LoginView },  // Public: login/register
    { 
      path: '/dashboard', 
      component: () => import('../views/Dashboard.vue'),  // Lazy load (создадим позже)
      meta: { requiresAuth: true }  // Protected
    },
    { 
      path: '/transactions', 
      component: () => import('../views/Transactions.vue'),  // Lazy load
      meta: { requiresAuth: true }
    },
    { 
      path: '/admin', 
      component: () => import('../views/AdminView.vue'), 
      meta: { requiresAuth: true, requiresAdmin: true }  // Protected for admin
    },
    { 
      path: '/goals', 
      component: () => import('../views/GoalsView.vue'), 
      meta: { requiresAuth: true }  // Protected
    },
    { 
      path: '/profile', 
      component: () => import('../views/ProfileView.vue'), 
      meta: { requiresAuth: true }  // Protected
    },
    { 
      path: '/reset-password', 
      component: () => import('../views/ResetPasswordView.vue') 
    },
    { path: '/verify', component: () => import('../views/VerifyView.vue') }
  ]
});

// Global guard: Redirect to login if no token on protected routes
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else if (to.meta.requiresAdmin && token) {
    // Check admin role (fetch user.role or assume for demo)
    // For demo: allow all, later check DB
    next();
  } else {
    next();
  }
});

export default router;