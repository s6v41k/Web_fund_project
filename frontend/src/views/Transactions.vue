<!-- src/views/Transactions.vue - Placeholder for transaction list + form -->
<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-4 text-gray-900">Transactions</h1>
    <p class="text-gray-600 mb-4">Manage your expenses here.</p>
    <div class="bg-white p-4 rounded shadow-md mb-4">
      <h2 class="text-xl font-semibold mb-2">Add New Transaction</h2>
      <form @submit.prevent="addTransaction" class="space-y-4">
        <input v-model="newTransaction.amount" type="number" step="0.01" placeholder="Amount (€)" class="border p-2 rounded w-full" required />
        <input v-model="newTransaction.category" type="text" placeholder="Category (e.g., food)" class="border p-2 rounded w-full" required />
        <input v-model="newTransaction.description" type="text" placeholder="Description" class="border p-2 rounded w-full" />
        <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Add Transaction</button>
      </form>
    </div>
    <div class="bg-white p-4 rounded shadow-md">
      <h2 class="text-xl font-semibold mb-2">Your Transactions</h2>
      <p class="text-gray-500">List will appear here (fetch from API later).</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const newTransaction = ref({ amount: '', category: '', description: '' });

const addTransaction = () => {
  // Later: POST to backend API
  console.log('Add:', newTransaction.value);
  newTransaction.value = { amount: '', category: '', description: '' };
};
</script>