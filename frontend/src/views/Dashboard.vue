<!-- src/views/Dashboard.vue - Dashboard with real transaction fetch and summary -->
<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-4 text-gray-900">Dashboard</h1>
    <div v-if="loading" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-red-500 text-center mb-4">{{ error }}</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white p-4 rounded shadow-md">
        <h2 class="text-xl font-semibold mb-2">Total Expenses: €{{ totalAmount.toFixed(2) }}</h2>
        <ul class="space-y-1">
          <li v-for="cat in categories" :key="cat.category" class="text-sm">
            {{ cat.category }}: €{{ cat.total.toFixed(2) }}
          </li>
        </ul>
      </div>
      <div class="bg-white p-4 rounded shadow-md">
        <h2 class="text-xl font-semibold mb-2">Transactions Count</h2>
        <p class="text-lg">{{ transactions.length }}</p>
      </div>
    </div>
    <router-link to="/transactions" class="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
      Manage Transactions
    </router-link>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

const transactions = ref([]);
const loading = ref(true);
const error = ref('');

// Fetch transactions on mount
onMounted(async () => {
  if (!userStore.isAuthenticated()) {
    router.push('/login');
    return;
  }
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:3001/api/transactions', {
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

// Computed: Categories summary
const categories = computed(() => {
  return transactions.value.reduce((acc, t) => {
    const cat = acc.find(c => c.category === t.category);
    if (cat) cat.total += parseFloat(t.amount);
    else acc.push({ category: t.category, total: parseFloat(t.amount) });
    return acc;
  }, []);
});
</script>