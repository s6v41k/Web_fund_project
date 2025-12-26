<!-- src/views/LoginView.vue - Login/Register form with API integration and specific errors -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">FinTracker</h2>
        <p class="mt-2 text-center text-sm text-gray-600">Sign in or register</p>
      </div>
      <form @submit.prevent="handleSubmit" class="mt-8 space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <input
            v-model="form.email"
            type="email"
            required
            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter your email"
          />
          <span v-if="errors.email" class="text-red-500 text-xs mt-1">{{ errors.email }}</span>
        </div>
        <div v-if="!isForgot">
          <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
          <input
            v-model="form.password"
            type="password"
            required
            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter your password"
          />
          <span v-if="errors.password" class="text-red-500 text-xs mt-1">{{ errors.password }}</span>
        </div>
        <div v-if="errors.general" class="text-red-500 text-sm text-center">{{ errors.general }}</div>
        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {{ isRegister ? 'Register' : 'Login' }}
          </button>
        </div>
        <button type="button" @click="toggleMode" class="w-full text-sm text-indigo-600 hover:text-indigo-500">
          {{ isRegister ? 'Already have account? Login' : 'New user? Register' }}
        </button>
        <button type="button" @click="toggleForgot" class="w-full text-sm text-indigo-600 hover:text-indigo-500">
          {{ isForgot ? 'Back to Login' : 'Forgot Password?' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/axios';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

// Reactive form data
const form = reactive({ email: '', password: '' });
const errors = ref({ email: '', password: '', general: '' });
const loading = ref(false);
const isRegister = ref(false);  // Toggle between login/register
const isForgot = ref(false);  // Toggle for forgot password

// Toggle mode
const toggleMode = () => {
  isRegister.value = !isRegister.value;
  isForgot.value = false;  // Reset forgot mode
  errors.value = { email: '', password: '', general: '' };  // Clear errors
};

// Toggle forgot password mode
const toggleForgot = () => {
  isForgot.value = !isForgot.value;
  isRegister.value = false;  // Reset register mode
  errors.value = { email: '', password: '', general: '' };  // Clear errors
};

// Client-side validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format (must be a valid email like user@gmail.com)';
  }
  return '';
};

const validatePassword = (password) => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter (a-z)';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter (A-Z)';
  }
  if (!/[!@#$%^&*()_+]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&*()_+)';
  }
  return '';
};

// Handle submit (login or register)
const handleSubmit = async () => {
  if (isForgot.value) {
    handleForgot();
    return;
  }

  // Client-side validation
  errors.value = { email: '', password: '', general: '' };

  const emailError = validateEmail(form.email);
  if (emailError) {
    errors.value.email = emailError;
    return;
  }

  const passwordError = validatePassword(form.password);
  if (passwordError) {
    errors.value.password = passwordError;
    return;
  }

  loading.value = true;

  try {
    const endpoint = isRegister.value ? '/register' : '/login';
    const res = await api.post(`/auth${endpoint}`, form);
    localStorage.setItem('token', res.data.token);  // Save token
    userStore.setUser(res.data.userId, res.data.token);  // Update store

    // Redirect based on role
    if (res.data.role === 'admin') {
      router.push('/admin');  // Admin goes to admin panel
    } else {
      router.push('/dashboard');  // Regular user goes to dashboard
    }
  } catch (err) {
    const status = err.response?.status;
    const backendError = err.response?.data?.error;

    if (status === 400) {
      // Parse Joi errors for specific fields
      if (backendError.includes('email')) {
        errors.value.email = backendError;
      } else if (backendError.includes('password')) {
        errors.value.password = backendError;
      } else {
        errors.value.general = backendError;
      }
    } else if (status === 401) {
      errors.value.general = 'Invalid email or password';
    } else {
      errors.value.general = 'Server error. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};

// Handle forgot password (send reset email)
const handleForgot = async () => {
  // Client-side validation
  errors.value = { email: '', general: '' };

  const emailError = validateEmail(form.email);
  if (emailError) {
    errors.value.email = emailError;
    return;
  }

  loading.value = true;

  try {
    await api.post('/auth/forgot-password', { email: form.email });
    errors.value.general = 'Reset email sent. Check your inbox.';
  } catch (err) {
    errors.value.general = err.response?.data?.error || 'Failed to send reset email';
  } finally {
    loading.value = false;
  }
};
</script>