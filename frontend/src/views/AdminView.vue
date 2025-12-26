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
              <th class="px-4 py-2 text-left">Nickname</th>
              <th class="px-4 py-2 text-left">Role</th>
              <th class="px-4 py-2 text-left">Created</th>
              <th class="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="border-t">
              <td class="px-4 py-2">{{ user.id }}</td>
              <td class="px-4 py-2">{{ user.email }}</td>
              <td class="px-4 py-2">{{ user.nickname || '-' }}</td>
              <td class="px-4 py-2">
                <select v-model="user.role" @change="updateRole(user.id, user.role)" class="border p-1 rounded">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td class="px-4 py-2">{{ new Date(user.createdAt).toLocaleDateString() }}</td>
              <td class="px-4 py-2">
                <button @click="openEditModal(user)" class="text-blue-500 hover:underline mr-2">Edit</button>
                <button @click="openDeleteModal(user)" class="text-red-500 hover:underline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete User Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-2xl font-bold mb-4 text-red-600">Delete User</h2>
        <p class="mb-6 text-gray-700">
          Are you sure you want to delete user <strong>{{ userToDelete?.email }}</strong>?
          This action is <strong>permanent</strong> and cannot be undone.
        </p>
        <div class="flex gap-3">
          <button
            @click="closeDeleteModal"
            class="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            @click="confirmDeleteUser"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 class="text-2xl font-bold mb-4">Edit User</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Email</label>
            <input v-model="editForm.email" type="email" class="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Nickname</label>
            <input v-model="editForm.nickname" type="text" class="w-full border rounded px-3 py-2" />
          </div>

          <!-- Avatar Upload -->
          <div>
            <label class="block text-sm font-medium mb-1">Profile Photo</label>

            <!-- Current photo preview -->
            <div v-if="editForm.photo" class="mb-2">
              <img :src="`http://localhost:5000${editForm.photo}`" alt="Current avatar" class="w-24 h-24 rounded-full object-cover border" />
              <p class="text-xs text-gray-500 mt-1">Current photo</p>
            </div>

            <!-- File upload -->
            <input
              type="file"
              @change="handleFileChange"
              accept="image/*"
              class="w-full border rounded px-3 py-2 text-sm"
            />
            <p class="text-xs text-gray-500 mt-1">Upload a new photo (max 5MB)</p>

            <!-- Preview of new photo -->
            <div v-if="photoPreview" class="mt-2">
              <img :src="photoPreview" alt="New avatar preview" class="w-24 h-24 rounded-full object-cover border" />
              <p class="text-xs text-gray-500 mt-1">New photo preview</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">New Password (leave empty to keep current)</label>
            <input v-model="editForm.password" type="password" class="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-2">
          <button @click="closeEditModal" class="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
          <button @click="saveUser" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
        </div>
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
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const userToDelete = ref(null);
const editForm = ref({
  id: null,
  email: '',
  nickname: '',
  photo: '',
  password: ''
});
const selectedFile = ref(null);
const photoPreview = ref('');

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

// Open edit modal
const openEditModal = (user) => {
  editForm.value = {
    id: user.id,
    email: user.email,
    nickname: user.nickname || '',
    photo: user.photo || '',
    password: ''
  };
  showEditModal.value = true;
};

// Close edit modal
const closeEditModal = () => {
  showEditModal.value = false;
  editForm.value = { id: null, email: '', nickname: '', photo: '', password: '' };
  selectedFile.value = null;
  photoPreview.value = '';
};

// Handle file selection
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      photoPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Save user changes
const saveUser = async () => {
  try {
    const token = localStorage.getItem('token');

    // First, upload avatar if file is selected
    if (selectedFile.value) {
      const formData = new FormData();
      formData.append('avatar', selectedFile.value);

      const uploadRes = await axios.post(
        `http://localhost:5000/api/admin/users/${editForm.value.id}/avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update editForm with new photo path
      editForm.value.photo = uploadRes.data.photo;
    }

    // Then update other user data
    const updateData = {
      email: editForm.value.email,
      nickname: editForm.value.nickname,
      photo: editForm.value.photo
    };

    // Only include password if it's not empty
    if (editForm.value.password) {
      updateData.password = editForm.value.password;
    }

    await axios.put(`http://localhost:5000/api/admin/users/${editForm.value.id}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    closeEditModal();
    await fetchUsers();
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to update user';
  }
};

// Open delete modal
const openDeleteModal = (user) => {
  userToDelete.value = user;
  showDeleteModal.value = true;
};

// Close delete modal
const closeDeleteModal = () => {
  userToDelete.value = null;
  showDeleteModal.value = false;
};

// Confirm delete user
const confirmDeleteUser = async () => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`http://localhost:5000/api/admin/users/${userToDelete.value.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    closeDeleteModal();
    await fetchUsers();
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to delete user';
  }
};
</script>