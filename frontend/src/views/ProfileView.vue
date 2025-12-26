<template>
  <div class="p-6 max-w-2xl mx-auto">
    <Toaster position="top-right" :richColors="true" />

    <h1 class="text-3xl font-bold mb-6 text-gray-900">Profile</h1>

    <div v-if="loading" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-red-500 text-center mb-4">
      {{ error }}
    </div>

    <div v-else class="bg-white p-6 rounded shadow space-y-8">

      <!-- ACCOUNT INFO -->
      <section>
        <h2 class="text-xl font-semibold mb-2">Account Info</h2>
        <p>Email: {{ profile.email }}</p>
        <p>Role: {{ profile.role }}</p>
        <p class="text-sm text-gray-500">
          Created: {{ new Date(profile.createdAt).toLocaleDateString() }}
        </p>
      </section>

      <!-- AVATAR -->
      <section>
        <h2 class="text-lg font-semibold mb-2">Avatar</h2>

        <div class="flex items-center gap-6">
          <img
            v-if="avatarPreview || profile.avatar || profile.photo"
            :src="avatarPreview || backendUrl + (profile.avatar || profile.photo)"
            class="w-28 h-28 rounded-full object-cover border"
          />
          <div v-else class="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center border">
            <span class="text-gray-400 text-sm">No photo</span>
          </div>

          <div class="space-y-2">
            <input type="file" accept="image/*" @change="onAvatarSelect" class="text-sm" />

            <div class="flex gap-2">
              <button
                @click="uploadAvatar"
                :disabled="!avatarFile"
                class="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
              >
                Upload
              </button>

              <button
                v-if="profile.avatar || profile.photo"
                @click="deleteAvatar"
                class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- UPDATE PROFILE -->
      <section>
        <h2 class="text-lg font-semibold mb-2">Profile Details</h2>

        <form @submit.prevent="updateProfile" class="space-y-3">
          <div>
            <label class="block text-sm font-medium">Email</label>
            <input v-model="editForm.email" type="email" class="w-full border p-2 rounded" />
          </div>

          <!-- <div>
            <label class="block text-sm font-medium">Birthdate</label>
            <input v-model="editForm.birthdate" type="date" class="w-full border p-2 rounded" />
          </div>-->

          <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Save Changes
          </button>
        </form>
      </section>

      <!-- PASSWORD -->
      <section>
        <h2 class="text-lg font-semibold mb-2">Change Password</h2>

        <form @submit.prevent="changePassword" class="space-y-2">
          <input
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="Current password"
            class="w-full border p-2 rounded"
          />
          <input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="New password"
            class="w-full border p-2 rounded"
          />
          <button class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
            Change Password
          </button>
        </form>
      </section>

      <!-- NICKNAME -->
      <section>
        <h2 class="text-lg font-semibold mb-2">Nickname</h2>

        <p class="mb-2">Current: {{ profile.nickname || '—' }}</p>

        <div class="flex gap-2">
          <input
            v-model="editForm.nickname"
            type="text"
            class="flex-1 border p-2 rounded"
          />

          <button
            @click="updateNickname"
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Save
          </button>

          <button
            v-if="profile.nickname"
            @click="deleteNickname"
            class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Remove
          </button>
        </div>
      </section>

      <!-- DANGER ZONE -->
      <section class="border-t pt-6 space-y-3">
        <h2 class="text-lg font-semibold text-red-600">Danger Zone</h2>

        <button
          @click="logout"
          class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full"
        >
          Logout
        </button>

        <button
          @click="showDeleteModal = true"
          class="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 w-full"
        >
          Delete Account
        </button>
      </section>

    </div>

    <!-- Delete Account Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-2xl font-bold mb-4 text-red-600">Delete Account</h2>
        <p class="mb-6 text-gray-700">
          Are you sure you want to delete your account? This action is <strong>permanent</strong> and cannot be undone. All your data will be lost.
        </p>
        <div class="flex gap-3">
          <button
            @click="showDeleteModal = false"
            class="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            @click="confirmDeleteAccount"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Yes, Delete
          </button>
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
import { toast, Toaster } from 'vue-sonner';

const router = useRouter();
const userStore = useUserStore();
const backendUrl = 'http://localhost:5000';

const profile = ref({});
const loading = ref(true);
const error = ref('');

const editForm = ref({ email: '', nickname: '', birthdate: null });
const passwordForm = ref({ currentPassword: '', newPassword: '' });

const avatarFile = ref(null);
const avatarPreview = ref(null);
const showDeleteModal = ref(false);

onMounted(async () => {
  if (!userStore.isAuthenticated()) {
    router.push('/login');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${backendUrl}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    profile.value = res.data;
    editForm.value = {
      email: res.data.email,
      nickname: res.data.nickname || '',
      birthdate: res.data.birthdate
    };
  } catch {
    error.value = 'Failed to fetch profile';
  } finally {
    loading.value = false;
  }
});

const onAvatarSelect = (e) => {
  avatarFile.value = e.target.files[0];
  avatarPreview.value = URL.createObjectURL(avatarFile.value);
};

const uploadAvatar = async () => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('avatar', avatarFile.value);

  const res = await axios.post(
    `${backendUrl}/api/profile/avatar`,
    formData,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  profile.value.avatar = res.data.avatar;
  avatarFile.value = null;
  avatarPreview.value = null;
  toast.success('Avatar updated');
};

const deleteAvatar = async () => {
  const token = localStorage.getItem('token');
  await axios.delete(`${backendUrl}/api/profile/avatar`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  profile.value.avatar = null;
  toast.success('Avatar removed');
};

const updateProfile = async () => {
  try {
    const token = localStorage.getItem('token');

    await axios.put(
      `${backendUrl}/api/profile`,
      { email: editForm.value.email },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.success('Email updated successfully');
  } catch (err) {
    toast.error(err.response?.data?.error || 'Failed to update email');
  }
};


const changePassword = async () => {
  try {
    if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword) {
      toast.error('Fill in both password fields');
      return;
    }

    const token = localStorage.getItem('token');

    await axios.put(
      `${backendUrl}/api/profile/password`,
      {
        currentPassword: passwordForm.value.currentPassword.trim(),
        newPassword: passwordForm.value.newPassword.trim()
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    toast.success('Password updated');
    passwordForm.value.currentPassword = '';
    passwordForm.value.newPassword = '';
  } catch (err) {
    toast.error(err.response?.data?.error || 'Failed to update password');
  }
};



const updateNickname = async () => {
  const token = localStorage.getItem('token');
  await axios.put(`${backendUrl}/api/profile/nickname`,
    { nickname: editForm.value.nickname },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  profile.value.nickname = editForm.value.nickname;
  toast.success('Nickname updated');
};

const deleteNickname = async () => {
  const token = localStorage.getItem('token');
  await axios.delete(`${backendUrl}/api/profile/nickname`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  profile.value.nickname = null;
  editForm.value.nickname = '';
  toast.success('Nickname removed');
};

const confirmDeleteAccount = async () => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`${backendUrl}/api/profile/account`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    showDeleteModal.value = false;
    toast.success('Account deleted successfully');

    setTimeout(() => {
      userStore.logout();
      router.push('/login');
    }, 1500);
  } catch (err) {
    toast.error(err.response?.data?.error || 'Failed to delete account');
  }
};

const logout = () => {
  userStore.logout();
  router.push('/login');
};

</script>