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
    }
  ]
});

// Global guard: Redirect to login if no token on protected routes
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else {
    next();
  }
});

export default router;