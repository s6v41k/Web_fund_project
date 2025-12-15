<!-- src/views/Dashboard.vue - Dashboard with charts (pie for categories, line for monthly totals) -->
<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-4 text-gray-900">Dashboard</h1>
    <div v-if="loading" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-red-500 text-center mb-4">{{ error }}</div>
    <div v-else>
      <!-- Summary cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-white p-4 rounded shadow-md">
          <h2 class="text-xl font-semibold mb-2">Total Expenses: €{{ totalAmount.toFixed(2) }}</h2>
          <p class="text-sm text-gray-500">Transactions: {{ transactions.length }}</p>
        </div>
        <div class="bg-white p-4 rounded shadow-md">
          <h2 class="text-xl font-semibold mb-2">Monthly Trend</h2>
          <p class="text-sm text-gray-500">See line chart below</p>
        </div>
      </div>
      <!-- Pie Chart: Expense categories -->
      <div class="bg-white p-4 rounded shadow-md mb-6">
        <h2 class="text-xl font-semibold mb-4">Expenses by Category</h2>
        <div class="chart-container">
          <Pie v-if="categories.length" :data="pieData" :options="chartOptions" />
          <p v-else class="text-gray-500">No data for chart</p>
        </div>
      </div>
      <!-- Line Chart: Monthly totals -->
      <div class="bg-white p-4 rounded shadow-md">
        <h2 class="text-xl font-semibold mb-4">Monthly Expenses Trend</h2>
        <div class="chart-container">
          <Line v-if="monthlyData.labels.length" :data="monthlyData" :options="chartOptions" />
          <p v-else class="text-gray-500">No data for chart</p>
        </div>
      </div>
      <router-link to="/transactions" class="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Manage Transactions
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserStore } from '../stores/user';
import { Pie, Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
} from 'chart.js';

// Register Chart.js components (English comments for clarity)
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, PointElement, LineElement);

const router = useRouter();
const userStore = useUserStore();

const transactions = ref([]);
const loading = ref(true);
const error = ref('');

// Chart options (shared for pie and line)
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' }
  }
};

// Fetch transactions on mount
onMounted(async () => {
  if (!userStore.isAuthenticated()) {
    router.push('/login');
    return;
  }
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:3000/api/transactions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    transactions.value = res.data;
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to fetch transactions';
    if (err.response?.status === 401) router.push('/login');
  } finally {
    loading.value = false;
  }
});

// Computed: Total amount
const totalAmount = computed(() => {
  return transactions.value.reduce((sum, t) => sum + parseFloat(t.amount), 0);
});

// Computed: Categories for pie chart
const categories = computed(() => {
  const catTotals = {};
  transactions.value.forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + parseFloat(t.amount);
  });
  return Object.entries(catTotals).map(([category, total]) => ({ category, total }));
});

// Pie chart data
const pieData = computed(() => ({
  labels: categories.value.map(cat => cat.category),
  datasets: [{
    label: 'Expenses',
    data: categories.value.map(cat => cat.total),
    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
    borderWidth: 1
  }]
}));

// Computed: Monthly data for line chart (group by month)
const monthlyData = computed(() => {
  const monthlyTotals = {};
  transactions.value.forEach(t => {
    const month = new Date(t.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    monthlyTotals[month] = (monthlyTotals[month] || 0) + parseFloat(t.amount);
  });
  return {
    labels: Object.keys(monthlyTotals).sort(),
    datasets: [{
      label: 'Monthly Expenses (€)',
      data: Object.values(monthlyTotals).sort((a, b) => a - b),  // Simple sort for demo
      borderColor: '#36A2EB',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      tension: 0.1
    }]
  };
});
</script>

<style scoped>
/* Scoped styles for chart containers */
.chart-container {
  height: 300px; /* Fixed height for responsive charts */
}
</style>