<!-- src/views/GoalsView.vue - User goals list with form and progress bars -->
<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-4 text-gray-900">Goals</h1>
    <div v-if="loading" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-red-500 text-center mb-4">{{ error }}</div>
    <div v-else>
      <!-- Form to create goal -->
      <div class="bg-white p-4 rounded shadow-md mb-6">
        <h2 class="text-xl font-semibold mb-2">Create New Goal</h2>
        <form @submit.prevent="createGoal" class="space-y-4">
          <input
            v-model="newGoal.category"
            type="text"
            placeholder="Category (e.g., food)"
            class="border p-2 rounded w-full"
            required
          />
          <input
            v-model.number="newGoal.targetAmount"
            type="number"
            step="0.01"
            placeholder="Target Amount (€)"
            class="border p-2 rounded w-full"
            required
          />
          <button type="submit" :disabled="loading" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Create Goal
          </button>
        </form>
      </div>
      <!-- Goals list with progress bars -->
      <div v-if="goals.length" class="space-y-4">
        <div v-for="goal in goals" :key="goal.id" class="bg-white p-4 rounded shadow-md">
          <h3 class="font-semibold">{{ goal.category }} Goal: €{{ goal.target_amount }}</h3>
          <p class="text-sm text-gray-600">Current: €{{ goal.current_amount.toFixed(2) }}</p>
          <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: progressPercentage(goal) + '%' }"></div>
          </div>
          <p class="text-sm text-gray-500 mt-1">{{ progressPercentage(goal) }}% complete</p>
          <button @click="deleteGoal(goal.id)" class="mt-2 text-red-500 hover:underline">Delete</button>
        </div>
      </div>
      <p v-else class="text-gray-500">No goals yet. Create one above!</p>
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

const goals = ref([]);
const loading = ref(true);
const error = ref('');
const newGoal = ref({ category: '', targetAmount: '' });

// Fetch goals on mount
onMounted(async () => {
  if (!userStore.isAuthenticated()) {
    router.push('/login');
    return;
  }
  await fetchGoals();
});

// Fetch goals from API
const fetchGoals = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/goals', {
      headers: { Authorization: `Bearer ${token}` }
    });
    goals.value = res.data;
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to fetch goals';
    if (err.response?.status === 401) router.push('/login');
  } finally {
    loading.value = false;
  }
};

// Create goal
const createGoal = async () => {
  loading.value = true;
  error.value = '';
  try {
    const token = localStorage.getItem('token');
    await axios.post('http://localhost:5000/api/goals', newGoal.value, {
      headers: { Authorization: `Bearer ${token}` }
    });
    newGoal.value = { category: '', targetAmount: '' };
    await fetchGoals();
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to create goal';
  } finally {
    loading.value = false;
  }
};

// Delete goal
const deleteGoal = async (id) => {
  if (!confirm('Delete this goal?')) return;
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`http://localhost:5000/api/goals/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await fetchGoals();
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to delete goal';
  }
};

// Progress percentage for bar
const progressPercentage = (goal) => {
  return Math.min((goal.current_amount / goal.target_amount * 100), 100);
};
</script>