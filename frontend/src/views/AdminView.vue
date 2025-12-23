<!-- src/views/AdminView.vue - Admin panel for user management and stats -->
<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-4 text-gray-900">Admin Panel</h1>
    <div v-if="loading" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-red-500 text-center mb-4">{{ error }}</div>
    <div v-else>
      <!-- User list -->
      <div class="bg-white p-4 rounded shadow-md mb-6">
        <h2 class="text-xl font-semibold mb-2">Users</h2>
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left">ID</th>
              <th class="px-4 py-2 text-left">Email</th>
              <th class="px-4 py-2 text-left">Role</th>
              <th class="px-4 py-2 text-left">Created</th>
              <th class="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="border-t">
              <td class="px-4 py-2">{{ user.id }}</td>
              <td class="px-4 py-2">{{ user.email }}</td>
              <td class="px-4 py-2">
                <select v-model="user.role" @change="updateRole(user.id, user.role)" class="border p-1 rounded">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td class="px-4 py-2">{{ new Date(user.created_at).toLocaleDateString() }}</td>
              <td class="px-4 py-2">
                <button @click="deleteUser(user.id)" class="text-red-500 hover:underline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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

const users = ref([]);
const loading = ref(true);
const error = ref('');

// Fetch users on mount (admin only)
onMounted(async () => {
  if (!userStore.isAuthenticated()) {
    router.push('/login');
    return;
  }
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    users.value = res.data;
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to fetch users';
    if (err.response?.status === 401 || err.response?.status === 403) router.push('/login');
  } finally {
    loading.value = false;
  }
});

// Update role
const updateRole = async (id, role) => {
  try {
    const token = localStorage.getItem('token');
    await axios.put(`http://localhost:5000/api/admin/users/${id}/role`, { role }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // Refresh list
    await fetchUsers();
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to update role';
  }
};

// Fetch users (helper)
const fetchUsers = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    users.value = res.data;
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to fetch users';
  }
};

// Delete user (add in backend later)
const deleteUser = async (id) => {
  if (!confirm('Delete this user?')) return;
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await fetchUsers();
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to delete user';
  }
};
</script>