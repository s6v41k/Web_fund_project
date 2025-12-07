<!-- src/views/Dashboard.vue - Placeholder for dashboard (summary of expenses) -->
<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-4 text-gray-900">Dashboard</h1>
    <p class="text-gray-600 mb-4">Welcome! Your expense summary will appear here.</p>
    <div class="bg-white p-4 rounded shadow-md">
      <h2 class="text-xl font-semibold mb-2">Total Expenses: €0.00</h2>
      <p class="text-sm text-gray-500">No transactions yet. Add some in Transactions view.</p>
    </div>
    <router-link to="/transactions" class="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
      Go to Transactions
    </router-link>
  </div>
</template>

<script setup>
// Later: fetch transactions from API, calculate totals, add chart
</script>