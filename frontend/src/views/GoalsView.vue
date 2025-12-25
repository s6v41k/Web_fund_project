<!-- src/views/GoalsView.vue - CRUD for goals with historical chart and suggestions -->
<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-4 text-gray-900">Goals</h1>
    <div v-if="loading" class="text-center text-blue-500">Loading...</div>
    <div v-else-if="error" class="text-red-500 text-center mb-4">{{ error }}</div>
    <div v-else>
      <!-- Form for add/update goal (with smart suggestions) -->
      <div class="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-200">
        <h2 class="text-xl font-semibold mb-2 text-gray-900">Add/Update Goal</h2>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2 text-gray-700">Category (suggested from transactions)</label>
            <select v-model="form.category" class="border border-gray-300 p-2 rounded-md w-full focus:ring-2 focus:ring-blue-500" required>
              <option value="">Select or type category</option>
              <option v-for="suggestion in topCategories" :key="suggestion" :value="suggestion">{{ suggestion }}</option>
              <option value="custom">Custom (type below)</option>
            </select>
            <input v-if="form.category === 'custom'" v-model="form.customCategory" type="text" placeholder="Enter custom category" class="border border-gray-300 p-2 rounded-md w-full mt-1 focus:ring-2 focus:ring-blue-500" required />
          </div>
          <input
            v-model="form.target_amount"
            type="number"
            step="0.01"
            placeholder="Target Amount (€)"
            class="border border-gray-300 p-2 rounded-md w-full focus:ring-2 focus:ring-blue-500"
            required
          />
          <div class="space-x-2">
            <button
              type="submit"
              :disabled="loading"
              class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {{ editingId ? 'Update' : 'Add' }} Goal
            </button>
            <button
              v-if="editingId"
              type="button"
              @click="cancelEdit"
              class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- List of goals with edit/delete -->
      <div class="bg-white rounded-lg shadow-md mb-6 border border-gray-200 overflow-hidden">
        <h2 class="text-xl font-semibold p-4 border-b bg-gray-50 text-gray-900">Your Goals</h2>
        <div v-if="goals.length" class="divide-y divide-gray-200">
          <div v-for="goal in goals" :key="goal.id" class="p-4 hover:bg-gray-50">
            <div class="flex justify-between items-center">
              <div>
                <p class="font-semibold text-gray-900">{{ goal.category }}: €{{ goal.current_amount.toFixed(2) }} / €{{ goal.target_amount }}</p>
                <p class="text-sm text-gray-600">
                  Progress:
                  {{
                    goal.target_amount > 0
                      ? Math.min((goal.current_amount / goal.target_amount) * 100, 100).toFixed(1) + '%'
                      : 'Not started'
                  }}

                </p>
              </div>
              <div class="space-x-2">
                <button @click="editGoal(goal)" class="text-blue-500 hover:underline text-sm">Edit</button>
                <button @click="deleteGoal(goal.id)" class="text-red-500 hover:underline text-sm">Delete</button>
                <button @click="viewHistorical(goal.category)" class="text-green-500 hover:underline text-sm">History</button>
              </div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                class="bg-green-600 h-2 rounded-full"
                :style="{
                  width:
                    goal.target_amount > 0
                      ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) + '%'
                      : '0%'
                }"

              ></div>
            </div>
          </div>
        </div>

        <p v-if="!goals.length" class="p-4 text-gray-500 text-center">
        No goals yet. Add one above!
        </p>

      </div>

      <!-- Historical Chart (line for progress over months, shown on click) -->
      <div v-if="showHistorical" class="bg-white rounded-lg shadow-md mb-6 border border-gray-200">
        <h2 class="text-xl font-semibold p-4 border-b bg-gray-50 text-gray-900">Historical Progress for {{ historicalCategory }}</h2>
        <div class="chart-container p-4">
          <Line v-if="historicalData.labels.length" :data="historicalData" :options="historicalOptions" />
          <p v-else class="text-gray-500 text-center py-8">No historical data</p>
        </div>
        <button @click="closeHistorical" class="m-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { toast } from 'vue-sonner';
import { useUserStore } from '../stores/user';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
} from 'chart.js';

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const router = useRouter();
const userStore = useUserStore();

const goals = ref([]);
const loading = ref(true);
const error = ref('');
const editingId = ref(null);
const form = ref({ category: '', target_amount: '', customCategory: '' });
const topCategories = ref([]);  // Smart suggestions
const showHistorical = ref(false);
const historicalCategory = ref('');
const historicalData = ref({ labels: [], datasets: [] });
const historicalOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' }
  },
  scales: {
    y: { beginAtZero: true }
  }
};

// Fetch goals and top categories on mount
onMounted(async () => {
  if (!userStore.isAuthenticated()) {
    router.push('/login');
    return;
  }
  await fetchGoals();
  await fetchTopCategories();
});

// Fetch goals
const fetchGoals = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/goals', {
      headers: { Authorization: `Bearer ${token}` }
    });
    goals.value = res.data.map(g => ({
  ...g,
  current_amount: Number(g.current_amount) || 0,
  target_amount: Number(g.target_amount) || 0
}));

  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to fetch goals';
    if (err.response?.status === 401) router.push('/login');
  } finally {
    loading.value = false;
  }
};

// Fetch top categories from transactions (smart suggestions)
const fetchTopCategories = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/transactions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const catCounts = {};
    res.data.forEach(t => {
      catCounts[t.category] = (catCounts[t.category] || 0) + 1;
    });
    topCategories.value = Object.keys(catCounts)
      .sort((a, b) => catCounts[b] - catCounts[a])
      .slice(0, 5);  // Top 5
  } catch (err) {
    console.error('Failed to fetch top categories');
    topCategories.value = ['food', 'transport', 'entertainment', 'rent', 'utilities'];  // Fallback
  }
};

// Submit form
const handleSubmit = async () => {
  if (loading.value) return;
  loading.value = true;
  error.value = '';
  try {
    const token = localStorage.getItem('token');
    const data = {
      category:
        form.value.category === 'custom'
          ? form.value.customCategory.trim()
          : form.value.category,
      target_amount: Number(form.value.target_amount)
    };

    if (editingId.value) {
      await axios.put(`http://localhost:5000/api/goals/${editingId.value}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } else {
      await axios.post('http://localhost:5000/api/goals', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    form.value = { category: '', target_amount: '', customCategory: '' };
    editingId.value = null;
    await fetchGoals();
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to save goal';
  } finally {
    loading.value = false;
  }
};

// Edit goal
const editGoal = (goal) => {
  editingId.value = goal.id;
  form.value = { category: goal.category, target_amount: goal.target_amount, customCategory: '' };
};

// Cancel edit
const cancelEdit = () => {
  editingId.value = null;
  form.value = { category: '', target_amount: '', customCategory: '' };
};

// Delete goal
const deleteGoal = async (id) => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`http://localhost:5000/api/goals/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success('Goal deleted');
    await fetchGoals();
  } catch (err) {
    toast.error('Failed to delete goal');
  }
};


// View historical chart
const viewHistorical = async (category) => {
  historicalCategory.value = category;
  showHistorical.value = true;
  historicalData.value = { labels: [], datasets: [] };

  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(
      `http://localhost:5000/api/goals/historical/${encodeURIComponent(category)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.data.length) {
      toast.info('No historical data yet');
      return;
    }

    historicalData.value = {
      labels: res.data.map(d => d.month),
      datasets: [{
        label: 'Actual Spend (€)',
        data: res.data.map(d => d.actual),
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1
      }]
    };
  } catch {
    toast.error('Failed to load history');
  }
};


// Close historical
const closeHistorical = () => {
  showHistorical.value = false;
  historicalData.value = { labels: [], datasets: [] };
};
</script>