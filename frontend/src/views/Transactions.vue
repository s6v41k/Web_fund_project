<!-- src/views/Transactions.vue - Full CRUD for transactions (list + form) -->
<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-4 text-gray-900">Transactions</h1>
    <div v-if="loading" class="text-center text-blue-500">Loading...</div>
    <div v-else-if="error" class="text-red-500 text-center mb-4">{{ error }}</div>
    <div v-else>
      <!-- Form for add/update transaction -->
      <div class="bg-white p-4 rounded shadow-md mb-6">
        <h2 class="text-xl font-semibold mb-2">Add/Update Transaction</h2>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <input
            v-model="form.amount"
            type="number"
            step="0.01"
            placeholder="Amount (€)"
            class="border p-2 rounded w-full"
            required
          />
          <input
            v-model="form.category"
            type="text"
            placeholder="Category (e.g., food)"
            class="border p-2 rounded w-full"
            required
          />
          <input
            v-model="form.description"
            type="text"
            placeholder="Description"
            class="border p-2 rounded w-full"
          />
          <div class="space-x-2">
            <button
              type="submit"
              :disabled="loading"
              class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {{ editingId ? 'Update' : 'Add' }} Transaction
            </button>
            <button
              v-if="editingId"
              type="button"
              @click="cancelEdit"
              class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      <!-- List of transactions -->
      <div class="bg-white rounded shadow-md overflow-hidden">
        <h2 class="text-xl font-semibold p-4 border-b">Your Transactions</h2>
        <div v-if="transactions.length" class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left">Amount</th>
                <th class="px-4 py-2 text-left">Category</th>
                <th class="px-4 py-2 text-left">Description</th>
                <th class="px-4 py-2 text-left">Date</th>
                <th class="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in transactions" :key="transaction.id" class="border-t">
                <td class="px-4 py-2">{{ transaction.amount }} €</td>
                <td class="px-4 py-2">{{ transaction.category }}</td>
                <td class="px-4 py-2">{{ transaction.description }}</td>
                <td class="px-4 py-2">{{ new Date(transaction.created_at).toLocaleDateString() }}</td>
                <td class="px-4 py-2 space-x-2">
                  <button @click="editTransaction(transaction)" class="text-blue-500 hover:underline">Edit</button>
                  <button @click="deleteTransaction(transaction.id)" class="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="p-4 text-gray-500">No transactions yet. Add one above!</p>
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

const transactions = ref([]);
const loading = ref(true);
const error = ref('');
const editingId = ref(null);  // ID for edit mode
const form = ref({ amount: '', category: '', description: '' });  // Form data

// Fetch transactions on mount
onMounted(async () => {
  if (!userStore.isAuthenticated()) {
    router.push('/login');
    return;
  }
  await fetchTransactions();
});

// Fetch list from API
const fetchTransactions = async () => {
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
};

// Submit form (add or update)
const handleSubmit = async () => {
  if (loading.value) return;
  loading.value = true;
  error.value = '';
  try {
    const token = localStorage.getItem('token');
    const data = { amount: parseFloat(form.value.amount), category: form.value.category, description: form.value.description };
    if (editingId.value) {
      // Update
      await axios.put(`http://localhost:3000/api/transactions/${editingId.value}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } else {
      // Add
      await axios.post('http://localhost:3000/api/transactions', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    form.value = { amount: '', category: '', description: '' };  // Reset form
    editingId.value = null;
    await fetchTransactions();  // Refresh list
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to save transaction';
  } finally {
    loading.value = false;
  }
};

// Edit transaction (load to form)
const editTransaction = (transaction) => {
  editingId.value = transaction.id;
  form.value = { amount: transaction.amount, category: transaction.category, description: transaction.description };
};

// Cancel edit
const cancelEdit = () => {
  editingId.value = null;
  form.value = { amount: '', category: '', description: '' };
};

// Delete transaction
const deleteTransaction = async (id) => {
  if (!confirm('Delete this transaction?')) return;
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`http://localhost:3000/api/transactions/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await fetchTransactions();  // Refresh
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to delete';
  }
};
</script>