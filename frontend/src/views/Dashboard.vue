<!-- src/views/Dashboard.vue - Dashboard with charts (pie for categories, line for monthly totals, bar for comparisons) and goals progress -->
<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-4 text-gray-900">Dashboard</h1>
    <div v-if="loading" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-red-500 text-center mb-4">{{ error }}</div>
    <div v-else>
      <!-- Slicer for charts (year/month filter) -->
      <div class="bg-white p-4 rounded shadow-md mb-6">
        <h3 class="text-lg font-semibold mb-2">Filter Data</h3>
        <div class="flex gap-4">
          <select v-model="selectedYear" class="border p-2 rounded">
            <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
          </select>
          <select v-model="selectedMonth" class="border p-2 rounded">
            <option value="">All Months</option>
            <option v-for="month in months" :key="month" :value="month">{{ month }}</option>
          </select>
          <button @click="filterData" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Apply Filter</button>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-white p-4 rounded shadow-md">
          <h2 class="text-xl font-semibold mb-2">Total Expenses: €{{ filteredTotalAmount.toFixed(2) }}</h2>
          <p class="text-sm text-gray-500">Transactions: {{ filteredTransactions.length }}</p>
        </div>
        <div class="bg-white p-4 rounded shadow-md">
          <h2 class="text-xl font-semibold mb-2">Monthly Trend</h2>
          <p class="text-sm text-gray-500">See bar chart below for comparisons</p>
        </div>
      </div>

      <!-- Pie Chart: Expense categories (filtered) -->
      <div class="bg-white p-4 rounded shadow-md mb-6">
        <h2 class="text-xl font-semibold mb-4">Expenses by Category</h2>
        <div class="chart-container">
          <Pie v-if="filteredCategories.length" :data="pieData" :options="chartOptions" />
          <p v-else class="text-gray-500">No data for chart</p>
        </div>
      </div>

      <!-- Bar Chart: Monthly totals by category (comparisons) -->
      <div class="bg-white p-4 rounded shadow-md mb-6">
        <h2 class="text-xl font-semibold mb-4">Monthly Expenses by Category (Bar Comparison)</h2>
        <div class="chart-container">
          <Bar v-if="monthlyBarData.labels.length" :data="monthlyBarData" :options="barChartOptions" />
          <p v-else class="text-gray-500">No data for chart</p>
        </div>
      </div>

      <!-- Line Chart: Overall monthly totals -->
      <div class="bg-white p-4 rounded shadow-md mb-6">
        <h2 class="text-xl font-semibold mb-4">Overall Monthly Expenses Trend</h2>
        <div class="chart-container">
          <Line v-if="monthlyData.labels.length" :data="monthlyData" :options="chartOptions" />
          <p v-else class="text-gray-500">No data for chart</p>
        </div>
      </div>

      <!-- Goals Progress -->
      <div class="bg-white p-4 rounded shadow-md mb-6">
        <h2 class="text-xl font-semibold mb-4">Goals Progress</h2>
        <div v-if="goalProgress.length" class="space-y-4">
          <div v-for="goal in goalProgress" :key="goal.id" class="mb-4">
            <p class="font-semibold">{{ goal.category }}: €{{ goal.current_amount.toFixed(2) }} / €{{ goal.target_amount }} ({{ goal.percentage }}%)</p>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div class="bg-green-600 h-2.5 rounded-full" :style="{ width: goal.percentage + '%' }"></div>
            </div>
          </div>
        </div>
        <p v-else class="text-gray-500">No goals yet. Create some in Goals view!</p>
        <router-link to="/goals" class="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Manage Goals
        </router-link>
      </div>

      <router-link to="/transactions" class="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Manage Transactions
      </router-link>
      <router-link to="/profile" class="mt-2 inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
        Profile
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserStore } from '../stores/user';
import { Pie, Line, Bar } from 'vue-chartjs';  // Added Bar for comparisons
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement  // For bar chart
} from 'chart.js';

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

const router = useRouter();
const userStore = useUserStore();

const transactions = ref([]);
const goals = ref([]);
const loading = ref(true);
const error = ref('');

const selectedYear = ref('');  // Slicer for year
const selectedMonth = ref('');  // Slicer for month

// Available years and months (from data)
const years = ref([]);
const months = ref([]);

// Chart options (shared)
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' }
  }
};

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
};

// Fetch transactions and goals on mount
onMounted(async () => {
  if (!userStore.isAuthenticated()) {
    router.push('/login');
    return;
  }
  try {
    const token = localStorage.getItem('token');
    const [transRes, goalRes] = await Promise.all([
      axios.get('http://localhost:5000/api/transactions', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('http://localhost:5000/api/goals', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    transactions.value = transRes.data;
    goals.value = goalRes.data;
    await updateGoalAmounts();
    extractYearsAndMonths();  // Extract for slicer
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to fetch data';
    if (err.response?.status === 401) router.push('/login');
  } finally {
    loading.value = false;
  }
});

// Extract unique years and months from transactions for slicer
const extractYearsAndMonths = () => {
  const yearSet = new Set();
  const monthSet = new Set();
  transactions.value.forEach(t => {
    const date = new Date(t.createdAt);
    yearSet.add(date.getFullYear());
    monthSet.add(date.toLocaleDateString('en-US', { month: 'short' }));
  });
  years.value = Array.from(yearSet).sort((a, b) => b - a);  // Latest first
  months.value = Array.from(monthSet).sort();
};

// Filter data based on slicer
const filterData = () => {
  // Re-fetch or filter local (local for speed)
  // For now, filter local transactions
  // Implementation depends on your needs
};

const filteredTransactions = computed(() => {
  let filtered = transactions.value;
  if (selectedYear.value) {
    filtered = filtered.filter(t => new Date(t.createdAt).getFullYear() == selectedYear.value);
  }
  if (selectedMonth.value) {
    filtered = filtered.filter(t => new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short' }) == selectedMonth.value);
  }
  return filtered;
});

// Filtered totals
const filteredTotalAmount = computed(() => {
  return filteredTransactions.value.reduce((sum, t) => sum + parseFloat(t.amount), 0);
});

// Filtered categories for pie
const filteredCategories = computed(() => {
  const catTotals = {};
  filteredTransactions.value.forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + parseFloat(t.amount);
  });
  return Object.entries(catTotals).map(([category, total]) => ({ category, total }));
});

// Pie data (filtered)
const pieData = computed(() => ({
  labels: filteredCategories.value.map(cat => cat.category),
  datasets: [{
    label: 'Expenses',
    data: filteredCategories.value.map(cat => cat.total),
    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
    borderWidth: 1
  }]
}));

// Monthly data for line (filtered)
const monthlyData = computed(() => {
  const monthlyTotals = {};
  filteredTransactions.value.forEach(t => {
    const month = new Date(t.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    monthlyTotals[month] = (monthlyTotals[month] || 0) + parseFloat(t.amount);
  });
  const sortedMonths = Object.keys(monthlyTotals).sort();
  return {
    labels: sortedMonths,
    datasets: [{
      label: 'Monthly Expenses (€)',
      data: sortedMonths.map(m => monthlyTotals[m]),
      borderColor: '#36A2EB',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      tension: 0.1
    }]
  };
});

// Monthly bar data for comparisons (by category per month)
const monthlyBarData = computed(() => {
  const months = [...new Set(filteredTransactions.value.map(t => new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short' })) )].sort();
  const categories = [...new Set(filteredTransactions.value.map(t => t.category))];
  const datasets = categories.map(cat => ({
    label: cat,
    data: months.map(month => {
      const sum = filteredTransactions.value
        .filter(t => t.category === cat && new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short' }) === month)
        .reduce((s, t) => s + parseFloat(t.amount), 0);
      return sum;
    }),
    backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`  // Random color per category
  }));

  return {
    labels: months,
    datasets
  };
});

// Update goal current_amount (filtered)
const updateGoalAmounts = async () => {
  try {
    const token = localStorage.getItem('token');
    for (const goal of goals.value) {
      const catSum = filteredTransactions.value
        .filter(t => t.category === goal.category)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      await axios.put(`http://localhost:5000/api/goals/${goal.id}`, { currentAmount: catSum }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    // Refresh goals
    const res = await axios.get('http://localhost:5000/api/goals', { headers: { Authorization: `Bearer ${token}` } });
    goals.value = res.data;
  } catch (err) {
    console.error('Update goals error:', err);
  }
};

// Goal progress
const goalProgress = computed(() => {
  return goals.value.map(goal => ({
    ...goal,
    percentage: Math.min((goal.current_amount / goal.target_amount * 100), 100)
  }));
});
</script>

<style scoped>
.chart-container {
  height: 300px;
}
</style>