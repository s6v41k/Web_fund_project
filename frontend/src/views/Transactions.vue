<!-- src/views/Transactions.vue -->
<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-4 text-gray-900">Transactions</h1>

    <div v-if="loading" class="text-center text-blue-500">Loading...</div>
    <div v-else-if="error" class="text-red-500 text-center mb-4">{{ error }}</div>

    <div v-else>
      <!-- Filters -->
      <div class="bg-white p-4 rounded-lg shadow-md mb-6 border">
        <h3 class="text-lg font-semibold mb-2">Filter Transactions</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select v-model="selectedYear" class="border p-2 rounded">
            <option value="">All Years</option>
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>

          <select v-model="selectedMonth" class="border p-2 rounded">
            <option value="">All Months</option>
            <option v-for="m in orderedMonths" :key="m" :value="m">{{ m }}</option>
          </select>

          <select v-model="selectedCategory" class="border p-2 rounded">
            <option value="">All Categories</option>
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <button @click="applyFilter" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
          Apply Filter
        </button>
      </div>

      <!-- Form -->
      <div class="bg-white p-4 rounded-lg shadow-md mb-6 border">
        <h2 class="text-xl font-semibold mb-2">Add / Update Transaction</h2>

        <form @submit.prevent="handleSubmit" class="space-y-3">
          <input
            v-model="form.amount"
            type="number"
            step="5"
            min="0"
            placeholder="Amount (€)"
            class="border p-2 rounded w-full"
            required
          />

          <input
            v-model="form.category"
            type="text"
            placeholder="Category"
            class="border p-2 rounded w-full"
            required
          />

          <input
            v-model="form.description"
            type="text"
            placeholder="Description"
            class="border p-2 rounded w-full"
          />

          <input
            v-model="form.date"
            type="date"
            class="border p-2 rounded w-full"
            required
          />

          <div class="space-x-2">
            <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded">
              {{ editingId ? 'Update' : 'Add' }} Transaction
            </button>

            <button
              v-if="editingId"
              type="button"
              @click="cancelEdit"
              class="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- List -->
      <div class="bg-white rounded-lg shadow-md border overflow-hidden">
        <h2 class="text-xl font-semibold p-4 border-b">
          Your Transactions ({{ filteredTransactions.length }})
        </h2>

        <table v-if="filteredTransactions.length" class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="p-2 text-left">Amount</th>
              <th class="p-2 text-left">Category</th>
              <th class="p-2 text-left">Description</th>
              <th class="p-2 text-left">Date</th>
              <th class="p-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="t in filteredTransactions"
              :key="t.id"
              class="border-t hover:bg-gray-50"
            >
              <td class="p-2">{{ t.amount }} €</td>
              <td class="p-2">{{ t.category }}</td>
              <td class="p-2">{{ t.description }}</td>
              <td class="p-2">{{ formatDate(t.createdAt) }}</td>
              <td class="p-2 flex gap-3">
                <button
                  type="button"
                  class="text-blue-600 hover:underline cursor-pointer"
                  @click.stop="editTransaction(t)"
                >
                  Edit
                </button>

                <button
                  type="button"
                  class="text-red-600 hover:underline cursor-pointer"
                  @click.stop="deleteTransaction(t.id)"
                >
                  Delete
                </button>
              </td>

            </tr>
          </tbody>
        </table>

        <p v-else class="p-4 text-center text-gray-500">
          No transactions found
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import moment from 'moment'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { toast } from 'vue-sonner'
const router = useRouter()
const userStore = useUserStore()

const transactions = ref([])
const loading = ref(true)
const error = ref('')
const editingId = ref(null)

const form = ref({
  amount: '',
  category: '',
  description: '',
  date: ''
})

const selectedYear = ref('')
const selectedMonth = ref('')
const selectedCategory = ref('')

const years = ref([])
const categories = ref([])
const orderedMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

onMounted(fetchTransactions)

async function fetchTransactions() {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('http://localhost:5000/api/transactions', {
      headers: { Authorization: `Bearer ${token}` }
    })
    transactions.value = res.data
    extractFilters()
  } catch {
    router.push('/login')
  } finally {
    loading.value = false
  }
}

function extractFilters() {
  const y = new Set()
  const c = new Set()

  transactions.value.forEach(t => {
    const d = new Date(t.createdAt)
    y.add(d.getFullYear())
    c.add(t.category)
  })

  years.value = [...y].sort((a,b) => b - a)
  categories.value = [...c].sort()
}

const filteredTransactions = computed(() => {
  return transactions.value.filter(t => {
    const d = new Date(t.createdAt)
    return (
      (!selectedYear.value || d.getFullYear() == selectedYear.value) &&
      (!selectedMonth.value || d.toLocaleString('en',{month:'short'}) === selectedMonth.value) &&
      (!selectedCategory.value || t.category === selectedCategory.value)
    )
  })
})

function applyFilter() {}

function formatDate(d) {
  return moment(d).format('MMM DD, YYYY')
}

async function handleSubmit() {
  try {
    const token = localStorage.getItem('token')

    const payload = {
      amount: Number(form.value.amount),
      category: form.value.category,
      description: form.value.description
    }

    if (editingId.value) {
      await axios.put(
        `http://localhost:5000/api/transactions/${editingId.value}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } else {
      await axios.post(
        'http://localhost:5000/api/transactions',
        {
          ...payload,
          date: form.value.date
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    }

    editingId.value = null
    form.value = { amount:'', category:'', description:'', date:'' }
    await fetchTransactions()

  } catch (err) {
    console.error(err)
    error.value = 'Failed to save transaction'
  }
}




function editTransaction(t) {
  editingId.value = t.id
  form.value = {
    amount: t.amount,
    category: t.category,
    description: t.description,
    date: t.createdAt.split('T')[0]
  }
}

function cancelEdit() {
  editingId.value = null
  form.value = { amount:'', category:'', description:'', date:'' }
}

async function deleteTransaction(id) {
  try {
    const token = localStorage.getItem('token')

    if (!id) {
      alert('NO ID')
      return
    }

    await axios.delete(
      `http://localhost:5000/api/transactions/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    transactions.value = transactions.value.filter(t => t.id !== id)

    alert('DELETED')
  } catch (err) {
    alert('DELETE ERROR')
    console.error(err)
  }
}



</script>
