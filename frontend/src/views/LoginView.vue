<!-- src/views/LoginView.vue - Login/Register form with API integration -->
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
        <div>
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
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserStore } from '../stores/user';  // Pinia store (создадим позже)

const router = useRouter();
const userStore = useUserStore();

// Reactive form data
const form = reactive({ email: '', password: '' });
const errors = ref({});
const loading = ref(false);
const isRegister = ref(false);  // Toggle between login/register

// Toggle mode
const toggleMode = () => {
  isRegister.value = !isRegister.value;
  errors.value = {};  // Clear errors
};

// Handle submit (login or register)
const handleSubmit = async () => {
  errors.value = {};
  loading.value = true;

  try {
    const endpoint = isRegister.value ? '/register' : '/login';
    const res = await axios.post(`http://localhost:3001/api/auth${endpoint}`, form);
    localStorage.setItem('token', res.data.token);  // Save token
    userStore.setUser(res.data.userId);  // Update store
    router.push('/dashboard');  // Redirect to dashboard
  } catch (err) {
    if (err.response?.status === 400 || err.response?.status === 401) {
      errors.value = { general: err.response.data.error || 'Invalid email or password' };
    } else {
      errors.value = { general: 'Something went wrong. Try again.' };
    }
  } finally {
    loading.value = false;
  }
};
</script>