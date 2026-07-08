<template>
  <div class="w-full h-screen bg-background-gray dark:bg-background-dark-gray flex flex-col items-center overflow-hidden">

    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="toast" class="fixed top-6 right-6 z-[60] flex items-center gap-3 rounded-lg bg-white dark:bg-black border border-maurealty-green/40 shadow-lg px-5 py-3">
        <span class="flex items-center justify-center size-6 rounded-full bg-maurealty-green text-white text-sm font-bold">✓</span>
        <p class="text-sm font-medium text-gray-700">{{ toast }}</p>
      </div>
    </Transition>

    <!-- HEADER -->
    <header class="flex flex-col py-5 px-10 pb-3 w-full bg-linear-to-r from-[#A9D6FF70] dark:from-[#041d3070] to-[#FFFFFF] dark:to-black text-maurealty-blue dark:text-white shadow-md sticky top-0 z-20">
      <div class="flex justify-between items-center w-full">
        <div class="flex items-baseline gap-3">
          <h1 class="text-3xl font-bold">SALES REPORT</h1>
          <span class="text-sm font-medium text-maurealty-blue/70 dark:text-white/70">
            {{ isAdmin ? 'All agents' : 'Your sales' }}
          </span>
        </div>
        <div class="flex gap-3 items-center">
          <button
            @click="exportCsv"
            :disabled="filteredSales.length === 0"
            class="flex items-center gap-1 border border-maurealty-blue dark:border-maurealty-light-blue text-maurealty-blue dark:text-maurealty-light-blue text-md px-4 py-1.5 rounded-full cursor-pointer hover:bg-maurealty-blue dark:hover:bg-maurealty-light-blue hover:text-white dark:hover:text-maurealty-blue transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-maurealty-blue"
          >
            <Download class="size-4" /> Export
          </button>
          <button
            class="flex items-center gap-1 bg-maurealty-blue text-white text-md px-4 py-1.5 rounded-full cursor-pointer hover:opacity-70 transition-opacity"
            @click="showUpload = true"
          >
            <Plus class="size-4" /> Add Sale
          </button>
          <input
            id="search" type="text" name="search" placeholder="Search client / project / voucher"
            v-model="searchQuery"
            class="block min-w-72 py-1.5 pr-3 pl-2 text-base placeholder:text-gray-500 border border-blue-950 dark:border-blue-50 rounded-sm focus:outline-none sm:text-sm/6"
          />
        </div>
      </div>

      <!-- FILTERS -->
      <div class="flex flex-wrap items-end gap-4 mt-3">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-maurealty-blue/70 dark:text-white/70">From</label>
          <input type="date" v-model="dateFrom" class="py-1 px-2 text-sm rounded-md bg-white dark:bg-black/70 border border-maurealty-blue/30 dark:border-maurealty-light-blue/30 focus:outline-2 focus:outline-maurealty-blue dark:focus:outline-maurealty-light-blue" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-maurealty-blue/70 dark:text-white/70">To</label>
          <input type="date" v-model="dateTo" class="py-1 px-2 text-sm rounded-md bg-white dark:bg-black/70 border border-maurealty-blue/30 dark:border-maurealty-light-blue/30 focus:outline-2 focus:outline-maurealty-blue dark:focus:outline-maurealty-light-blue" />
        </div>
        <div v-if="isAdmin" class="flex flex-col gap-1">
          <label class="text-xs font-medium text-maurealty-blue/70 dark:text-white/70">Agent</label>
          <select v-model="agentFilter" class="py-1 px-2 text-sm rounded-md bg-white dark:bg-black/70 border border-maurealty-blue/30 dark:border-maurealty-light-blue/30 focus:outline-2 focus:outline-maurealty-blue dark:focus:outline-maurealty-light-blue">
            <option :value="null">All agents</option>
            <option v-for="a in agentOptions" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>
        </div>
        <button v-if="hasActiveFilters" @click="clearFilters" class="text-sm text-maurealty-blue underline hover:opacity-70 pb-1 cursor-pointer">
          Clear filters
        </button>
      </div>

      <!-- SUMMARY STRIP -->
      <div class="flex flex-wrap gap-4 mt-4">
        <div class="flex flex-col min-w-40 rounded-xl bg-white dark:bg-black border border-[#A9D6FF]/40 dark:border-[#A9D6FF]/20 shadow-[0_4px_6px_rgba(0,0,0,0.05)] px-5 py-3">
          <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Sales</span>
          <span class="text-xl font-extrabold text-maurealty-blue dark:text-white">{{ totals.count }}</span>
        </div>
        <div class="flex flex-col min-w-40 rounded-xl bg-white dark:bg-black border border-[#A9D6FF]/40 dark:border-[#A9D6FF]/20 shadow-[0_4px_6px_rgba(0,0,0,0.05)] px-5 py-3">
          <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Contract Price</span>
          <span class="text-xl font-extrabold text-maurealty-blue dark:text-white">{{ formatPeso(totals.tcp) }}</span>
        </div>
        <div class="flex flex-col min-w-40 rounded-xl bg-white dark:bg-black border border-[#A9D6FF]/40 dark:border-[#A9D6FF]/20 shadow-[0_4px_6px_rgba(0,0,0,0.05)] px-5 py-3">
          <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Gross Commission</span>
          <span class="text-xl font-extrabold text-maurealty-blue dark:text-white">{{ formatPeso(totals.gross) }}</span>
        </div>
        <div class="flex flex-col min-w-40 rounded-xl bg-white dark:bg-black border border-[#A9D6FF]/40 dark:border-[#A9D6FF]/20 shadow-[0_4px_6px_rgba(0,0,0,0.05)] px-5 py-3">
          <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Net Commission</span>
          <span class="text-xl font-extrabold text-maurealty-blue dark:text-white">{{ formatPeso(totals.net) }}</span>
        </div>
      </div>
    </header>

    <!-- BODY -->
    <main class="relative flex-1 overflow-hidden flex flex-col w-full">
      <section class="custom-scrollbar flex-1 overflow-y-auto">
        <div class="p-10 flex flex-col min-h-full">

          <!-- LOADING -->
          <div v-if="loading" class="flex-1 flex items-center justify-center text-maurealty-blue/60 dark:text-maurealty-light-blue/60">
            Loading sales…
          </div>

          <!-- EMPTY -->
          <div v-else-if="filteredSales.length === 0" class="flex-1 flex flex-col items-center justify-center text-center text-gray-500 gap-2">
            <ClipboardList class="size-10 opacity-40" />
            <p class="font-medium">{{ hasActiveFilters ? 'No sales match your filters.' : 'No sales recorded yet.' }}</p>
            <button v-if="hasActiveFilters" @click="clearFilters" class="text-sm text-maurealty-blue dark:text-white underline hover:opacity-70 cursor-pointer">Clear filters</button>
          </div>

          <!-- TABLE -->
          <div v-else class="bg-white dark:bg-black rounded-xl border border-[#A9D6FF]/40 dark:border-[#A9D6FF]/20 shadow-[0_4px_6px_rgba(0,0,0,0.05)] max-h-[calc(100vh-19rem)] overflow-auto">
            <table class="w-full min-w-[720px] text-sm text-left">
              <thead class="bg-maurealty-blue dark:bg-[#072339] text-white sticky top-0 z-10">
                <tr>
                  <th class="px-4 py-3 font-semibold cursor-pointer select-none hover:bg-white dark:hover:bg-[#1da2d6]/20 transition-colors" @click="setSort('reservation_date')">
                    <span class="inline-flex items-center gap-1">Date <component :is="sortIcon('reservation_date')" class="size-4" :class="sortKey==='reservation_date' ? 'text-amber-300' : 'opacity-70'" /></span>
                  </th>
                  <th class="px-4 py-3 font-semibold cursor-pointer select-none hover:bg-white dark:hover:bg-[#1da2d6]/20 transition-colors" @click="setSort('client_name')">
                    <span class="inline-flex items-center gap-1">Client <component :is="sortIcon('client_name')" class="size-4" :class="sortKey==='client_name' ? 'text-amber-300' : 'opacity-70'" /></span>
                  </th>
                  <th class="px-4 py-3 font-semibold">Project</th>
                  <th v-if="isAdmin" class="px-4 py-3 font-semibold">Agent</th>
                  <th class="px-4 py-3 font-semibold">Status</th>
                  <th class="px-4 py-3 font-semibold text-right cursor-pointer select-none hover:bg-white dark:hover:bg-[#1da2d6]/20 transition-colors" @click="setSort('total_contract_price')">
                    <span class="inline-flex items-center gap-1">Contract Price <component :is="sortIcon('total_contract_price')" class="size-4" :class="sortKey==='total_contract_price' ? 'text-amber-300' : 'opacity-70'" /></span>
                  </th>
                  <th class="px-4 py-3 font-semibold text-right cursor-pointer select-none hover:bg-white dark:hover:bg-[#1da2d6]/20 transition-colors" @click="setSort('gross_commission')">
                    <span class="inline-flex items-center gap-1">Gross Comm. <component :is="sortIcon('gross_commission')" class="size-4" :class="sortKey==='gross_commission' ? 'text-amber-300' : 'opacity-70'" /></span>
                  </th>
                  <th class="px-4 py-3 font-semibold text-right">Net Comm.</th>
                  <th class="px-4 py-3 font-semibold text-center">#</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="sale in paginatedSales"
                  :key="sale.sale_ID"
                  class="group border-b border-gray-100 last:border-0 hover:bg-background-gray/60 dark:hover:bg-background-dark-gray/80 transition-colors cursor-pointer"
                  @click="selectedSale = sale"
                >
                  <td class="px-4 py-3 whitespace-nowrap dark:text-white">{{ formatDate(sale.reservation_date) }}</td>
                  <td class="px-4 py-3 font-medium text-maurealty-blue dark:text-white">
                    <span class="inline-flex items-center gap-1.5">
                      <span v-if="isFlagged(sale)" class="relative inline-flex items-center group/flag">
                        <AlertTriangle class="size-3.5 text-amber-500 shrink-0" />
                        <span class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-md bg-gray-800 text-white text-xs font-medium px-2 py-1 shadow-lg opacity-0 group-hover/flag:opacity-100 transition-opacity z-30">
                          {{ flagReason(sale) }}
                          <span class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></span>
                        </span>
                      </span>
                      {{ sale.client_name }}
                    </span>
                  </td>
                  <td class="px-4 py-3 dark:text-white">{{ sale.listing_title }}</td>
                  <td v-if="isAdmin" class="px-4 py-3 dark:text-white">{{ sale.agent_name || '—' }}</td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span :class="['px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border', getStatusClass(sale.status)]">
                      {{ sale.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right whitespace-nowrap dark:text-white">{{ formatPeso(sale.total_contract_price) }}</td>
                  <td class="px-4 py-3 text-right whitespace-nowrap dark:text-white">{{ sale.gross_commission != null ? formatPeso(sale.gross_commission) : '—' }}</td>
                  <td class="px-4 py-3 text-right whitespace-nowrap dark:text-white">{{ sale.net_commission != null ? formatPeso(sale.net_commission) : '—' }}</td>
                  <td class="px-4 py-3 text-center dark:text-white">{{ sale.agent_sale_seq ?? '—' }}</td>

                  <td class="px-2 py-3">
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" v-if="canEditSale(sale)">
                      <button @click.stop="openEdit(sale)" title="Edit" class="p-1.5 rounded-md text-maurealty-blue dark:text-maurealty-light-blue hover:bg-maurealty-blue/10 dark:hover:bg-maurealty-light-blue/10 cursor-pointer">
                        <Pencil class="size-4" />
                      </button>
                      <button @click.stop="confirmDelete(sale)" title="Delete" class="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer">
                        <Trash2 class="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- PAGINATION -->
          <footer v-if="!loading && filteredSales.length > 0" class="pt-5 flex justify-center items-center gap-4 w-full mt-auto">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="px-4 py-1 border border-maurealty-blue dark:border-maurealty-light-blue text-maurealty-blue dark:text-maurealty-light-blue rounded hover:bg-maurealty-blue dark:hover:bg-maurealty-light-blue hover:text-white dark:hover:text-maurealty-blue transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-maurealty-blue dark:disabled:hover:text-maurealty-light-blue cursor-pointer disabled:cursor-not-allowed"
            >
              &lt;
            </button>
            <span class="text-sm font-medium text-maurealty-blue dark:text-maurealty-light-blue">Page {{ currentPage }} of {{ totalPages }}</span>
            <button
              @click="currentPage++"
              :disabled="currentPage >= totalPages || totalPages === 0"
              class="px-4 py-1 border border-maurealty-blue dark:border-maurealty-light-blue text-maurealty-blue dark:text-maurealty-light-blue rounded hover:bg-maurealty-blue dark:hover:bg-maurealty-light-blue hover:text-white dark:hover:text-maurealty-blue transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-maurealty-blue dark:disabled:hover:text-maurealty-light-blue cursor-pointer disabled:cursor-not-allowed"
            >
              &gt;
            </button>
          </footer>

        </div>
      </section>
    </main>

    <!-- ADD SALE MODAL -->
    <SalesUploadModal
      v-if="showUpload"
      @close="showUpload = false"
      @saved="onSaleSaved"
    />

    <!-- EDIT SALE MODAL -->
    <SalesUploadModal
      v-if="editingSale"
      :edit-sale="editingSale"
      @close="editingSale = null"
      @saved="onSaleSaved"
    />

    <!-- SALE DETAIL -->
    <div v-if="selectedSale" class="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(10,61,98,0.7)] backdrop-blur-sm p-4" @click.self="selectedSale = null">
      <div class="w-full max-w-lg bg-white dark:bg-black rounded-2xl shadow-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-600">
          <h2 class="text-xl font-bold text-maurealty-blue dark:text-white">Sale Details</h2>
          <button class="text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 text-xl leading-none cursor-pointer" @click="selectedSale = null">✕</button>
        </div>

        <dl class="px-6 py-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><dt class="text-gray-500 dark:text-gray-400">Client</dt><dd class="font-medium text-maurealty-blue dark:text-white">{{ selectedSale.client_name }}</dd></div>
          <div><dt class="text-gray-500 dark:text-gray-400">Project</dt><dd class="font-medium dark:text-white">{{ selectedSale.listing_title }}</dd></div>
          <div v-if="isAdmin"><dt class="text-gray-500 dark:text-gray-400">Agent</dt><dd class="dark:text-white">{{ selectedSale.agent_name || '—' }}</dd></div>
          <div v-if="isAdmin" class="col-span-2">
            <dt class="text-gray-500 dark:text-gray-400">Upline</dt>
            <dd>
              <span v-if="uplineLoading" class="text-gray-400 dark:text-gray-600">Loading…</span>
              <span v-else-if="upline.length === 0" class="dark:text-white">—</span>
              <span v-else>
                <template v-for="(u, i) in upline" :key="u.agent_ID"
                  ><span class="font-medium dark:text-white">{{ u.first_name }} {{ u.last_name }}</span
                  ><span v-if="uplinePosition(u)" class="text-gray-500 dark:text-gray-400"> ({{ uplinePosition(u) }})</span
                  ><span v-if="i < upline.length - 1" class="text-gray-400 dark:text-gray-600"> → </span
                ></template>
              </span>
            </dd>
          </div>
          <div><dt class="text-gray-500 dark:text-gray-400">Reservation Date</dt><dd class="dark:text-white">{{ formatDate(selectedSale.reservation_date) }}</dd></div>
          <div><dt class="text-gray-500 dark:text-gray-400">Contract Price</dt><dd class="dark:text-white">{{ formatPeso(selectedSale.total_contract_price) }}</dd></div>
          <div><dt class="text-gray-500 dark:text-gray-400">Sale #</dt><dd class="dark:text-white">{{ selectedSale.agent_sale_seq ?? '—' }}</dd></div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Status</dt>
            <dd>
              <span :class="['px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border', getStatusClass(selectedSale.status)]">
                {{ selectedSale.status }}
              </span>
            </dd>
          </div>
          <div><dt class="text-gray-500 dark:text-gray-400">Gross Commission</dt><dd class="dark:text-white">{{ selectedSale.gross_commission != null ? formatPeso(selectedSale.gross_commission) : '—' }}</dd></div>
          <div><dt class="text-gray-500 dark:text-gray-400">Net Commission</dt><dd class="dark:text-white">{{ selectedSale.net_commission != null ? formatPeso(selectedSale.net_commission) : '—' }}</dd></div>
          <div><dt class="text-gray-500 dark:text-gray-400">Voucher</dt><dd class="dark:text-white">{{ selectedSale.voucher_series || '—' }}</dd></div>
          <div class="col-span-2"><dt class="text-gray-500 dark:text-gray-400">Remarks</dt><dd class="dark:text-white">{{ selectedSale.remarks || '—' }}</dd></div>
        </dl>

        <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-600" v-if="canEditSale(selectedSale)">
          <button @click="confirmDelete(selectedSale)" class="px-4 py-2 rounded-lg border border-red-300 dark:border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/80 cursor-pointer">Delete</button>
          <button @click="openEdit(selectedSale)" class="px-4 py-2 rounded-lg bg-maurealty-blue text-white hover:opacity-80 transition cursor-pointer">Edit</button>
        </div>
      </div>
    </div>
  </div>  
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, onUnmounted, watch } from 'vue'
import { ClipboardList, Plus, Download, Pencil, Trash2, AlertTriangle, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-vue-next'
import { salesService, type Sale } from '@/services/salesService'
import { authService } from '@/services/authService'
import { genealogyService, type GenealogyAgent } from '@/services/genealogyService'
import { positionMap } from '@/assets/classes/agent'
import SalesUploadModal from '@/components/sales/SalesUploadModal.vue'

const sales = shallowRef<Sale[]>([])
const loading = ref(true)
const isAdmin = ref(false)
const searchQuery = ref('')
const showUpload = ref(false)
const selectedSale = ref<Sale | null>(null)   // detail view
const editingSale = ref<Sale | null>(null)     // edit modal
const agentFilter = ref<number | null>(null)   // admin: filter by agent
const dateFrom = ref('')
const dateTo = ref('')

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

// --- Toast feedback ---
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined
function showToast(msg: string) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2500)
}

// After any create/edit: close modals and refresh the table + totals.
function onSaleSaved() {
  showUpload.value = false
  editingSale.value = null
  loadSales()
  showToast('Sale saved')
}

function openEdit(sale: Sale) {
  selectedSale.value = null
  editingSale.value = sale
}

async function confirmDelete(sale: Sale) {
  if (!confirm(`Delete the sale for "${sale.client_name}"? This can't be undone.`)) return
  try {
    const res = await salesService.deleteSale(sale.sale_ID)
    if (!res.success) {
      showToast('Delete failed — check permissions')
      return
    }
    selectedSale.value = null
    loadSales()
    showToast('Sale deleted')
  } catch (e) {
    console.error('Failed to delete sale:', e)
    showToast('Something went wrong deleting the sale')
  }
}

// Upline of the selected sale's agent (admin only — hierarchy is sensitive).
// Two levels = supervisor + manager, per the Commission Releasing doc.
const upline = ref<GenealogyAgent[]>([])
const uplineLoading = ref(false)

watch(selectedSale, async (sale) => {
  upline.value = []
  if (!sale || !isAdmin.value) return
  uplineLoading.value = true
  try {
    upline.value = await genealogyService.getUplineChain(sale.agent_ID, 2)
  } catch (e) {
    console.error('Failed to load upline:', e)
  } finally {
    uplineLoading.value = false
  }
})

function uplinePosition(u: GenealogyAgent): string {
  if (u.position) return u.position
  if (u.position_ID != null) return positionMap[u.position_ID] ?? ''
  return ''
}

// --- Esc-to-close + body scroll lock while a modal is open ---
const anyModalOpen = computed(() => showUpload.value || !!editingSale.value || !!selectedSale.value)
watch(anyModalOpen, (open) => { document.body.style.overflow = open ? 'hidden' : '' })
function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (editingSale.value) editingSale.value = null
  else if (selectedSale.value) selectedSale.value = null
  else if (showUpload.value) showUpload.value = false
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

// Admin agent dropdown: unique agents present in the loaded sales.
const agentOptions = computed(() => {
  const map = new Map<number, string>()
  for (const s of sales.value) {
    if (!map.has(s.agent_ID)) map.set(s.agent_ID, s.agent_name || `Agent ${s.agent_ID}`)
  }
  return [...map].map(([id, name]) => ({ id, name }))
})

const hasActiveFilters = computed(() =>
  !!searchQuery.value || !!dateFrom.value || !!dateTo.value || agentFilter.value !== null
)
function clearFilters() {
  searchQuery.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  agentFilter.value = null
}

// Client-side filtering: search + date range + (admin) agent.
const filteredSales = computed(() => {
  let result = sales.value

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    result = result.filter(s =>
      s.client_name?.toLowerCase().includes(q) ||
      s.listing_title?.toLowerCase().includes(q) ||
      s.voucher_series?.toLowerCase().includes(q)
    )
  }

  if (dateFrom.value) result = result.filter(s => s.reservation_date >= dateFrom.value)
  if (dateTo.value) result = result.filter(s => s.reservation_date <= dateTo.value)
  if (agentFilter.value !== null) result = result.filter(s => s.agent_ID === agentFilter.value)

  return result
})

// --- Sorting ---
type SortKey = 'reservation_date' | 'client_name' | 'total_contract_price' | 'gross_commission'
const sortKey = ref<SortKey>('reservation_date')
const sortDir = ref<'asc' | 'desc'>('desc')
function setSort(key: SortKey) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortIcon(key: SortKey) {
  if (sortKey.value !== key) return ChevronsUpDown
  return sortDir.value === 'asc' ? ChevronUp : ChevronDown
}

const sortedSales = computed(() => {
  const arr = [...filteredSales.value]
  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  arr.sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av == null) return 1   // nulls always last
    if (bv == null) return -1
    if (typeof av === 'string') return (av as string).localeCompare(bv as string) * dir
    return ((av as number) - (bv as number)) * dir
  })
  return arr
})

// Summary strip reflects the currently filtered set.
const totals = computed(() => ({
  count: filteredSales.value.length,
  tcp: filteredSales.value.reduce((sum, s) => sum + (s.total_contract_price || 0), 0),
  gross: filteredSales.value.reduce((sum, s) => sum + (s.gross_commission || 0), 0),
  net: filteredSales.value.reduce((sum, s) => sum + (s.net_commission || 0), 0),
}))

// --- Red-flag indicator: a sale missing its voucher or commission ---
function isFlagged(s: Sale) {
  return !s.voucher_series || s.gross_commission == null
}
function flagReason(s: Sale) {
  const missing = []
  if (!s.voucher_series) missing.push('voucher')
  if (s.gross_commission == null) missing.push('commission')
  return `Lacking ${missing.join(' & ')}`
}

// Pagination (over the sorted set)
const currentPage = ref(1)
const itemsPerPage = 12
const totalPages = computed(() => Math.ceil(filteredSales.value.length / itemsPerPage))
const paginatedSales = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return sortedSales.value.slice(start, start + itemsPerPage)
})
watch([searchQuery, dateFrom, dateTo, agentFilter, sortKey, sortDir], () => { currentPage.value = 1 })

// --- CSV export of the current filtered view ---
function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
function exportCsv() {
  if (filteredSales.value.length === 0) return
  const cols = ['Date', 'Client', 'Project', 'Agent', 'Contract Price', 'Gross Commission', 'Net Commission', 'Sale #', 'Voucher', 'Remarks']
  const rows = sortedSales.value.map(s => [
    s.reservation_date, s.client_name, s.listing_title, s.agent_name,
    s.total_contract_price, s.gross_commission, s.net_commission,
    s.agent_sale_seq, s.voucher_series, s.remarks,
  ].map(csvCell).join(','))
  const csv = [cols.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// Formatting helpers
const pesoFmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
const formatPeso = (n: number) => pesoFmt.format(n || 0)
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })

// for checking if user can edit sale
function canEditSale(sale: Sale) {
  return isAdmin.value || sale.status === 'pending approval';
}

// Maps the status string to its corresponding Tailwind colored badge styling
function getStatusClass(status: string) {
  switch (status) {
    case 'pending approval':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800';
    case 'awaiting payment':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    case 'complete':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200';
  }
}

</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
