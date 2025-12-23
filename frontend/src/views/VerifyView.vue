<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <h2 class="text-3xl font-bold text-center text-gray-900">Email Verification</h2>
      <div v-if="loading" class="text-center">Verifying...</div>
      <div v-else-if="error" class="text-red-500 text-center">{{ error }}</div>
      <div v-else class="text-green-500 text-center">
        <p>{{ message }}</p>
        <button @click="login" class="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
          Go to Login
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const route = useRoute();

const loading = ref(true);
const error = ref('');
const message = ref('');

onMounted(async () => {
  try {
    const { token, email } = route.query;
    const res = await axios.get(`http://localhost:5000/api/auth/verify?token=${token}&email=${email}`);
    message.value = res.data.message;
  } catch (err) {
    error.value = err.response?.data?.error || 'Verification failed';
  } finally {
    loading.value = false;
  }
});

const login = () => router.push('/login');
</script>