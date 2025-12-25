<script setup>
// App.vue - Root component for FinTracker app
// Uses Vue Router's <router-view /> to display child views (Login, Dashboard, Transactions)
// No additional logic here — keeps it clean and focused on routing

import { Toaster } from 'vue-sonner';  // Correct import for Toaster component
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Main layout with router-view for dynamic content -->
    <header class="bg-blue-600 text-white p-4 shadow-md">
      <h1 class="text-2xl font-bold">FinTracker</h1>
      <p class="text-blue-100">Your Smart Spending Coach</p>
    </header>
    <main class="container mx-auto p-4">
      <!-- Router-view renders the active view (LoginView, Dashboard, etc.) -->
      <router-view />
    </main>
    <!-- Sonner Toaster for global toast notifications -->
    <Toaster 
      position="top-right"
      rich-colors
      close-button
      offset="72"
    />

  </div>
</template>

<style scoped>
/* Scoped styles can be added here if needed, but Tailwind handles most via classes */
</style>