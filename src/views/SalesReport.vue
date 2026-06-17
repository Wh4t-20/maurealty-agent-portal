<template>
  <div class="w-full h-screen bg-background-gray flex flex-col items-center overflow-hidden">

    <!-- HEADER -->
    <header class="flex flex-col py-5 px-10 pb-3 w-full bg-linear-to-r from-[#A9D6FF70] to-[#FFFFFF] text-maurealty-blue shadow-md sticky z-20">
      <div class="flex justify-between items-center w-full">
        <div class="flex items-baseline gap-3">
          <h1 class="text-3xl font-bold">SALES REPORT</h1>
          <span class="text-sm font-medium text-maurealty-blue/70">
            {{ isAdmin ? 'All agents' : 'Your sales' }}
          </span>
        </div>
        <div class="flex gap-4 items-center">
          <button
            class="flex items-center gap-1 bg-maurealty-blue text-white text-md px-4 py-1.5 rounded-full cursor-pointer hover:opacity-70 transition-opacity"
            @click="showUpload = true"
          >
            <Plus class="size-4" /> Add Sale
          </button>
          <input
            id="search" type="text" name="search" placeholder="Search client / project / voucher"
            v-model="searchQuery"
            class="block min-w-72 py-1.5 pr-3 pl-2 text-base placeholder:text-gray-500 border border-blue-950 rounded-sm focus:outline-none sm:text-sm/6"
          />
        </div>
      </div>

      <!-- SUMMARY STRIP -->
      <div class="flex gap-4 mt-4">
        <div class="flex flex-col rounded-lg bg-white/70 shadow-sm px-4 py-2">
          <span class="text-xs font-medium text-gray-500">Sales</span>
          <span class="text-lg font-bold">{{ totals.count }}</span>
        </div>
        <div class="flex flex-col rounded-lg bg-white/70 shadow-sm px-4 py-2">
          <span class="text-xs font-medium text-gray-500">Total Contract Price</span>
          <span class="text-lg font-bold">{{ formatPeso(totals.tcp) }}</span>
        </div>
        <div class="flex flex-col rounded-lg bg-white/70 shadow-sm px-4 py-2">
          <span class="text-xs font-medium text-gray-500">Gross Commission</span>
          <span class="text-lg font-bold">{{ formatPeso(totals.gross) }}</span>
        </div>
      </div>
    </header>

    <!-- BODY -->
    <main class="relative flex-1 overflow-hidden flex flex-col w-full">
      <section class="custom-scrollbar flex-1 overflow-y-auto">
        <div class="p-10 flex flex-col min-h-full">

          <!-- LOADING -->
          <div v-if="loading" class="flex-1 flex items-center justify-center text-maurealty-blue/60">
            Loading sales…
          </div>

          <!-- EMPTY -->
          <div v-else-if="filteredSales.length === 0" class="flex-1 flex flex-col items-center justify-center text-center text-gray-500 gap-2">
            <ClipboardList class="size-10 opacity-40" />
            <p class="font-medium">{{ searchQuery ? 'No sales match your search.' : 'No sales recorded yet.' }}</p>
          </div>

          <!-- TABLE -->
          <div v-else class="bg-white rounded-xl shadow-md overflow-hidden">
            <table class="w-full text-sm text-left">
              <thead class="bg-maurealty-blue text-white">
                <tr>
                  <th class="px-4 py-3 font-semibold">Date</th>
                  <th class="px-4 py-3 font-semibold">Client</th>
                  <th class="px-4 py-3 font-semibold">Project</th>
                  <th v-if="isAdmin" class="px-4 py-3 font-semibold">Agent</th>
                  <th class="px-4 py-3 font-semibold text-right">Contract Price</th>
                  <th class="px-4 py-3 font-semibold text-right">Gross Comm.</th>
                  <th class="px-4 py-3 font-semibold text-center">#</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="sale in paginatedSales"
                  :key="sale.sale_ID"
                  class="border-b border-gray-100 last:border-0 hover:bg-background-gray/60 transition-colors"
                >
                  <td class="px-4 py-3 whitespace-nowrap">{{ formatDate(sale.reservation_date) }}</td>
                  <td class="px-4 py-3 font-medium text-maurealty-blue">{{ sale.client_name }}</td>
                  <td class="px-4 py-3">{{ sale.listing_title }}</td>
                  <td v-if="isAdmin" class="px-4 py-3">{{ sale.agent_name || '—' }}</td>
                  <td class="px-4 py-3 text-right whitespace-nowrap">{{ formatPeso(sale.total_contract_price) }}</td>
                  <td class="px-4 py-3 text-right whitespace-nowrap">{{ sale.gross_commission != null ? formatPeso(sale.gross_commission) : '—' }}</td>
                  <td class="px-4 py-3 text-center">{{ sale.agent_sale_seq ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- PAGINATION -->
          <footer v-if="!loading && filteredSales.length > 0" class="pt-5 flex justify-center items-center gap-4 w-full mt-auto">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="px-4 py-1 border border-maurealty-blue text-maurealty-blue rounded hover:bg-maurealty-blue hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-maurealty-blue cursor-pointer disabled:cursor-not-allowed"
            >
              &lt;
            </button>
            <span class="text-sm font-medium text-maurealty-blue">Page {{ currentPage }} of {{ totalPages }}</span>
            <button
              @click="currentPage++"
              :disabled="currentPage >= totalPages || totalPages === 0"
              class="px-4 py-1 border border-maurealty-blue text-maurealty-blue rounded hover:bg-maurealty-blue hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-maurealty-blue cursor-pointer disabled:cursor-not-allowed"
            >
              &gt;
            </button>
          </footer>

        </div>
      </section>
    </main>

    <!-- UPLOAD SALE MODAL -->
    <SalesUploadModal
      v-if="showUpload"
      @close="showUpload = false"
      @created="onSaleCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, watch } from 'vue'
import { ClipboardList, Plus } from 'lucide-vue-next'
import { salesService, type Sale } from '@/services/salesService'
import { authService } from '@/services/authService'
import SalesUploadModal from '@/components/sales/SalesUploadModal.vue'

const sales = shallowRef<Sale[]>([])
const loading = ref(true)
const isAdmin = ref(false)
const searchQuery = ref('')
const showUpload = ref(false)

// Admin sees all sales; an agent sees only their own. Decided by admin_access.
async function loadSales() {
  loading.value = true
  try {
    const agent = await authService.getCurrentAgent()
    isAdmin.value = !!agent?.admin_access
    sales.value = await salesService.getSales(
      isAdmin.value ? {} : { agentId: agent?.agent_ID }
    )
  } catch (e) {
    console.error('Failed to load sales report:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadSales)

// After a new sale is saved: close the modal and refresh the table + totals.
function onSaleCreated() {
  showUpload.value = false
  loadSales()
}

// Client-side search across client, project, voucher (mirrors Listings search).
const filteredSales = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return sales.value
  return sales.value.filter(s =>
    s.client_name?.toLowerCase().includes(q) ||
    s.listing_title?.toLowerCase().includes(q) ||
    s.voucher_series?.toLowerCase().includes(q)
  )
})

// Summary strip reflects the currently filtered set.
const totals = computed(() => ({
  count: filteredSales.value.length,
  tcp: filteredSales.value.reduce((sum, s) => sum + (s.total_contract_price || 0), 0),
  gross: filteredSales.value.reduce((sum, s) => sum + (s.gross_commission || 0), 0),
}))

// Pagination
const currentPage = ref(1)
const itemsPerPage = 12
const totalPages = computed(() => Math.ceil(filteredSales.value.length / itemsPerPage))
const paginatedSales = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredSales.value.slice(start, start + itemsPerPage)
})
watch(searchQuery, () => { currentPage.value = 1 })

// Formatting helpers
const pesoFmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
const formatPeso = (n: number) => pesoFmt.format(n || 0)
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
</script>
