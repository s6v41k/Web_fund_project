<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Reset Password</h2>
      </div>
      <form @submit.prevent="handleReset" class="mt-8 space-y-6">
        <input type="hidden" v-model="email" />
        <input type="hidden" v-model="token" />
        <div>
          <label class="block text-sm font-medium text-gray-700">New Password</label>
          <input
            v-model="newPassword"
            type="password"
            required
            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter new password"
          />
          <span v-if="errors.password" class="text-red-500 text-xs mt-1">{{ errors.password }}</span>
        </div>
        <div v-if="errors.general" class="text-red-500 text-sm text-center">{{ errors.general }}</div>
        <button
          type="submit"
          :disabled="loading"
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Reset Password
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const route = useRoute();

const email = ref(route.query.email || '');
const token = ref(route.query.token || '');
const newPassword = ref('');
const errors = ref({ password: '', general: '' });
const loading = ref(false);

// Client-side validation for new password
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

// Handle reset
const handleReset = async () => {
  errors.value = { password: '', general: '' };

  const passwordError = validatePassword(newPassword.value);
  if (passwordError) {
    errors.value.password = passwordError;
    return;
  }

  loading.value = true;

  try {
    await axios.post('http://localhost:5000/api/auth/reset-password', { token: token.value, email: email.value, newPassword: newPassword.value });
    errors.value.general = 'Password reset successful. Redirecting to login...';
    setTimeout(() => router.push('/login'), 2000);
  } catch (err) {
    errors.value.general = err.response?.data?.error || 'Reset failed. Please try again.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (!token.value || !email.value) {
    errors.value.general = 'Invalid reset link. Please request a new one.';
  }
});
</script>