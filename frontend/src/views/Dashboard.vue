<!-- src/views/Dashboard.vue - Dashboard with income vs expense comparison -->
<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-4 text-gray-900">Dashboard</h1>
    <div v-if="loading" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-red-500 text-center mb-4">{{ error }}</div>
    <div v-else>
      <!-- Compact Filter Data Section -->
      <div class="bg-white rounded-lg shadow-md mb-6 overflow-hidden border border-gray-200">
        <div class="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white cursor-pointer" @click="toggleFilter">
          <h3 class="text-lg font-semibold flex justify-between items-center">
            Filter Data
            <span class="text-sm">{{ selectedYear ? selectedYear : 'All Years' }} | {{ selectedMonths.length ? selectedMonths.join(', ') : 'All Months' }}</span>
          </h3>
          <span class="ml-auto transition-transform" :class="{ 'rotate-180': showFilter }">▼</span>
        </div>
        <div v-show="showFilter" class="p-4 border-t border-gray-200">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2 text-gray-700">Year</label>
              <select v-model="selectedYear" class="border border-gray-300 p-2 rounded-md w-full focus:ring-2 focus:ring-blue-500">
                <option value="">All Years</option>
                <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2 text-gray-700">Months (multi-select for comparison)</label>
              <div class="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto bg-gray-50">
                <label v-for="month in orderedMonths" :key="month" class="block text-sm flex items-center p-1 hover:bg-white rounded cursor-pointer">
                  <input type="checkbox" v-model="selectedMonths" :value="month" class="mr-2 rounded border-gray-300">
                  {{ month }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary cards (filtered) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <h2 class="text-xl font-semibold mb-2 text-gray-900">Total Expenses</h2>
          <p class="text-2xl font-bold text-red-600">€{{ filteredExpenseTotal.toFixed(2) }}</p>
          <p class="text-sm text-gray-500">Transactions: {{ filteredTransactions.length }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <h2 class="text-xl font-semibold mb-2 text-gray-900">Total Income</h2>
          <p class="text-2xl font-bold text-green-600">€{{ filteredIncomeTotal.toFixed(2) }}</p>
          <p class="text-sm text-gray-500">Net: €{{ (filteredIncomeTotal - filteredExpenseTotal).toFixed(2) }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <h2 class="text-xl font-semibold mb-2 text-gray-900">Monthly Trend</h2>
          <p class="text-sm text-gray-500">Compare below</p>
        </div>
      </div>

      <!-- Pie Chart: Expense categories (filtered) -->
      <div class="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-200">
        <h2 class="text-xl font-semibold mb-4 text-gray-900">Expenses by Category</h2>
        <div class="chart-container">
          <Pie v-if="filteredCategories.length" :data="pieData" :options="chartOptions" />
          <p v-else class="text-gray-500 text-center py-8">No data for chart</p>
        </div>
      </div>

      <!-- Bar Chart: Monthly totals by category (comparisons) -->
      <div class="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-200">
        <h2 class="text-xl font-semibold mb-4 text-gray-900">Monthly Expenses by Category (Bar Comparison)</h2>
        <p v-if="selectedMonths.length < 2" class="text-sm text-gray-500 mb-2">Select 2+ months for comparison</p>
        <div class="chart-container">
          <Bar v-if="selectedMonths.length >= 2 && monthlyBarData.labels.length" :data="monthlyBarData" :options="barChartOptions" />
          <p v-else class="text-gray-500 text-center py-8">Select multiple months to compare</p>
        </div>
      </div>

      <!-- New: Income vs Expense Bar Chart (monthly comparison) -->
      <div class="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-200">
        <h2 class="text-xl font-semibold mb-4 text-gray-900">Income vs Expenses (Monthly Comparison)</h2>
        <p class="text-sm text-gray-500 mb-2">Stacked bar for selected months (green = income, red = expense)</p>
        <div class="chart-container">
          <Bar v-if="incomeExpenseData.labels.length" :data="incomeExpenseData" :options="incomeExpenseOptions" />
          <p v-else class="text-gray-500 text-center py-8">Select months to compare income/expense</p>
        </div>
      </div>

      <!-- Line Chart: Overall monthly totals (filtered) -->
      <div class="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-200">
        <h2 class="text-xl font-semibold mb-4 text-gray-900">Overall Monthly Expenses Trend</h2>
        <div class="chart-container">
          <Line v-if="monthlyData.labels.length" :data="monthlyData" :options="chartOptions" />
          <p v-else class="text-gray-500 text-center py-8">No data for chart</p>
        </div>
      </div>

      <!-- Goals Progress (with alerts) -->
      <div class="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-200">
        <h2 class="text-xl font-semibold mb-4 text-gray-900">Goals Progress</h2>
        <div v-if="goalProgress.length" class="space-y-4">
          <div v-for="goal in goalProgress" :key="goal.id" class="mb-4 p-3 bg-gray-50 rounded border">
            <p class="font-semibold flex items-center">
              {{ goal.category }}:
              €{{ goal.current_amount.toFixed(2) }} /
              €{{ goal.target_amount }}
              (
              ({{
                goal.target_amount > 0 && Number.isFinite(goal.percentage)
                  ? goal.percentage.toFixed(0) + '%'
                  : 'Not started'
              }})

              )

              <span v-if="goal.percentage >= 90 && goal.percentage <= 100" class="ml-2 text-yellow-500 text-sm">⚠️ Alert: Close to limit!</span>
              <span v-if="goal.percentage > 100" class="ml-2 text-red-500 text-sm">🚨 Over limit!</span>
            </p>
            <div class="w-full bg-gray-200 rounded-full h-2.5 mt-1">
              <div class="bg-green-600 h-2.5 rounded-full transition-all duration-300" :style="{ width: (goal.target_amount > 0 ? goal.percentage : 0) + '%' }"></div>
            </div>
          </div>
        </div>
        <p v-else class="text-gray-500">No goals yet. Create some in Goals view!</p>
        <router-link to="/goals" class="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
          Manage Goals
        </router-link>
      </div>

      <div class="space-x-2">
        <router-link to="/transactions" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
          Manage Transactions
        </router-link>
        <router-link to="/profile" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors">
          Profile
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserStore } from '../stores/user';
import { toast } from 'vue-sonner';  // For toast alerts
import { Pie, Line, Bar } from 'vue-chartjs';
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
  BarElement
} from 'chart.js';

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

const router = useRouter();
const userStore = useUserStore();
//const { toast } = useSonner();  // Toast instance

const transactions = ref([]);
const goals = ref([]);
const loading = ref(true);
const error = ref('');

const selectedYear = ref('');  // Slicer for year
const selectedMonths = ref([]);  // Multi-select for months (array)
const showFilter = ref(false);  // Toggle for compact filter

// Available years and ordered months (Jan-Dec)
const years = ref([]);
const orderedMonths = ref(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);  // Ordered

// Chart options
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

const incomeExpenseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  },
  tooltips: {
    mode: 'index',
    intersect: false
  }
};

// Fetch data
onMounted(async () => {
  if (!userStore.isAuthenticated()) {
    router.push('/login');
    return;
  }
  try {
    const token = userStore.token;
    const [transRes, goalRes] = await Promise.all([
      axios.get('http://localhost:5000/api/transactions', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('http://localhost:5000/api/goals', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    transactions.value = transRes.data;
    goals.value = goalRes.data.map(g => ({
  ...g,
  current_amount: Number(g.current_amount) || 0,
  target_amount: Number(g.target_amount) || 0
}));

    //await updateGoalAmounts();
    extractYears();
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to fetch data';
    if (err.response?.status === 401) router.push('/login');
  } finally {
    loading.value = false;
  }
});

// Extract unique years
const extractYears = () => {
  const yearSet = new Set();
  transactions.value.forEach(t => {
    const year = new Date(t.createdAt).getFullYear();
    if (!Number.isNaN(year)) yearSet.add(year);

  });
  years.value = Array.from(yearSet).sort((a, b) => b - a);  // Latest first
};

// Toggle filter section
const toggleFilter = () => {
  showFilter.value = !showFilter.value;
};

// Filtered transactions (year + multi-month)
const filteredTransactions = computed(() => {
  let filtered = transactions.value;
  if (selectedYear.value) {
    filtered = filtered.filter(t => new Date(t.createdAt).getFullYear() == selectedYear.value);
  }
  if (selectedMonths.value.length) {
    filtered = filtered.filter(t => selectedMonths.value.includes(new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short' })));
  }
  return filtered;
});

// Filtered totals (income vs expense)
const filteredIncomeTotal = computed(() => {
  return filteredTransactions.value
    .filter(t => t.category === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
});

const filteredExpenseTotal = computed(() => {
  return filteredTransactions.value
    .filter(t => t.category !== 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
});

// Filtered categories for pie (merge groceries to food)
const filteredCategories = computed(() => {
  const catTotals = {};
  filteredTransactions.value.forEach(t => {
    const category = t.category === 'groceries' ? 'food' : t.category;
    catTotals[category] = (catTotals[category] || 0) + parseFloat(t.amount);
  });
  return Object.entries(catTotals).map(([category, total]) => ({ category, total }));
});

// Pie data (unique colors)
const pieData = computed(() => ({
  labels: filteredCategories.value.map(cat => cat.category),
  datasets: [{
    label: 'Expenses',
    data: filteredCategories.value.map(cat => cat.total),
    backgroundColor: [
      '#FF6B6B',  // food (coral/red)
      '#4ECDC4',  // transport (teal)
      '#45B7D1',  // entertainment (blue)
      '#96CEB4',  // utilities (green)
      '#FFEAA7',  // bills (yellow)
      '#DDA0DD',  // shopping (plum)
      '#98D8C8',  // healthcare (mint)
      '#F7DC6F',  // travel (gold)
      '#BB8FCE',  // rent (lavender)
      '#85C1E9'   // Extra (sky blue)
    ],
    borderWidth: 1
  }]
}));

// Monthly data for line
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

// Monthly bar data (comparisons)
const monthlyBarData = computed(() => {
  if (selectedMonths.value.length < 2) return { labels: [], datasets: [] };

  const selectedMonthYears = [];
  selectedMonths.value.forEach(month => {
    const year = selectedYear.value || years.value[0];
    selectedMonthYears.push(`${month} ${year}`);
  });

  const categories = [...new Set(filteredTransactions.value.map(t => t.category === 'groceries' ? 'food' : t.category))];
  const datasets = selectedMonthYears.map((monthYear, index) => ({
    label: monthYear,
    data: categories.map(cat => {
      const sum = filteredTransactions.value
        .filter(t => (t.category === cat || (cat === 'food' && t.category === 'groceries')) && new Date(t.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) === monthYear)
        .reduce((s, t) => s + parseFloat(t.amount), 0);
      return sum;
    }),
    backgroundColor: `hsl(${index * 60}, 70%, 50%)`
  }));

  return {
    labels: categories,
    datasets
  };
});

// New: Income vs Expense stacked bar (monthly comparison)
const incomeExpenseData = computed(() => {
  if (selectedMonths.value.length < 1) return { labels: [], datasets: [] };

  const selectedMonthYears = [];
  selectedMonths.value.forEach(month => {
    const year = selectedYear.value || years.value[0];
    selectedMonthYears.push(`${month} ${year}`);
  });

  const datasets = [
    {
      label: 'Income',
      data: selectedMonthYears.map(monthYear => {
        return filteredTransactions.value
          .filter(t => t.category === 'income' && new Date(t.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) === monthYear)
          .reduce((s, t) => s + parseFloat(t.amount), 0);
      }),
      backgroundColor: 'rgba(34, 197, 94, 0.8)',  // Green
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 1
    },
    {
      label: 'Expense',
      data: selectedMonthYears.map(monthYear => {
        return filteredTransactions.value
          .filter(t => t.category !== 'income' && new Date(t.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) === monthYear)
          .reduce((s, t) => s + parseFloat(t.amount), 0);
      }),
      backgroundColor: 'rgba(239, 68, 68, 0.8)',  // Red
      borderColor: 'rgba(239, 68, 68, 1)',
      borderWidth: 1
    }
  ];

  return {
    labels: selectedMonthYears,
    datasets
  };
});

// Update goal amounts (filtered, merge food/groceries)
const updateGoalAmounts = async () => {
  try {
    const token = localStorage.getItem('token');
    for (const goal of goals.value) {
      const effectiveCat = goal.category === 'food' ? ['food', 'groceries'] : [goal.category];
      const catSum = filteredTransactions.value
        .filter(t => effectiveCat.includes(t.category))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      await axios.put(`http://localhost:5000/api/goals/${goal.id}`, { currentAmount: catSum }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    // Refresh goals
    const res = await axios.get('http://localhost:5000/api/goals', { headers: { Authorization: `Bearer ${token}` } });
    goals.value = res.data.map(g => ({
  ...g,
  current_amount: Number(g.current_amount) || 0,
  target_amount: Number(g.target_amount) || 0
}));
  } catch (err) {
    console.error('Update goals error:', err);
  }
};

// Goal progress (with alerts)
const goalProgress = computed(() => {
  return goals.value.map(goal => ({
    ...goal,
    percentage: goal.target_amount > 0
  ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
  : 0

  }));
});

// Watch for alerts (toast on change)
watch(goalProgress, (newGoals) => {
  newGoals.forEach(goal => {
    if (goal.percentage >= 90 && goal.percentage <= 100) {
      toast.warning(`Goal alert for ${goal.category}: ${goal.percentage.toFixed(1)}% reached!`);
    } else if (goal.percentage > 100) {
      toast.error(`Goal exceeded for ${goal.category}! (€${goal.current_amount.toFixed(2)} / €${goal.target_amount})`);
    }
  });
}, { deep: true });
</script>

<style scoped>
.chart-container {
  height: 300px;
}
</style>


