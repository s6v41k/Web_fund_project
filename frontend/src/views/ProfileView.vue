<!-- src/views/ProfileView.vue - User profile management (edit email, view role, logout) -->
<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-4 text-gray-900">Profile</h1>
    <div v-if="loading" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-red-500 text-center mb-4">{{ error }}</div>
    <div v-else class="bg-white p-4 rounded shadow-md">
      <h2 class="text-xl font-semibold mb-2">Account Info</h2>
      <p class="mb-2">Email: {{ profile.email }}</p>
      <p class="mb-4">Role: {{ profile.role }}</p>
      <p class="text-sm text-gray-500 mb-4">Created: {{ new Date(profile.createdAt).toLocaleDateString() }}</p>
      <!-- Edit form -->
      <form @submit.prevent="updateProfile" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Update Email</label>
          <input
            v-model="editForm.email"
            type="email"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="New email"
          />
        </div>
        <button type="submit" :disabled="loading" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Update Profile
        </button>
        <button type="button" @click="logout" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Logout
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

const profile = ref({});
const editForm = ref({ email: '' });
const loading = ref(true);
const error = ref('');

// Fetch profile on mount
onMounted(async () => {
  if (!userStore.isAuthenticated()) {
    router.push('/login');
    return;
  }
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:3000/api/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    profile.value = res.data;
    editForm.value.email = profile.value.email;
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to fetch profile';
    if (err.response?.status === 401) router.push('/login');
  } finally {
    loading.value = false;
  }
});

// Update profile
const updateProfile = async () => {
  loading.value = true;
  error.value = '';
  try {
    const token = localStorage.getItem('token');
    await axios.put('http://localhost:3000/api/profile', editForm.value, {
      headers: { Authorization: `Bearer ${token}` }
    });
    profile.value.email = editForm.value.email;
    error.value = 'Profile updated successfully';
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to update profile';
  } finally {
    loading.value = false;
  }
};

// Logout
const logout = () => {
  userStore.logout();
  localStorage.removeItem('token');
  router.push('/login');
};
</script>