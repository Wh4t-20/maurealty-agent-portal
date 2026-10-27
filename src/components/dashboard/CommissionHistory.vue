<template>
  <div class="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl dark:bg-black dark:border-gray-900">
    <div class="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
      <h3 class="text-sm font-bold tracking-wide text-gray-900 dark:text-gray-100">COMMISSION HISTORY</h3>
      <div class="flex flex-col gap-2 sm:flex-row">
        <select v-model="saleFilter"
          class="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md dark:bg-black dark:text-white dark:border-gray-700 min-w-0">
          <option value="all">All sales</option>
          <option v-for="s in saleOptions" :key="s.id" :value="String(s.id)">{{ s.label }}</option>
        </select>
        <select v-model="statusFilter"
          class="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md dark:bg-black dark:text-white dark:border-gray-700">
          <option value="all">All statuses</option>
          <option v-for="st in statuses" :key="st" :value="st">{{ st }}</option>
        </select>
      </div>
    </div>

    <p v-if="filtered.length === 0" class="text-sm text-gray-500 dark:text-gray-400">No commission payouts match.</p>

    <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
      <li v-for="h in paged" :key="h.id" class="flex items-center justify-between gap-3 py-3">
        <div class="min-w-0">
          <p class="text-sm font-medium text-gray-800 truncate dark:text-gray-200" :title="h.sale_label">{{ h.sale_label }}</p>
          <p class="text-xs text-gray-500 truncate dark:text-gray-400">
            {{ h.agent_name }} · {{ h.role }}<template v-if="h.rank"> ({{ h.rank }})</template>
            · <span class="font-semibold">Payment {{ h.payment_no }} of {{ h.payment_total }}</span>
            · due {{ h.due_date }}
          </p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-sm font-bold text-gray-900 dark:text-white">{{ peso(h.amount) }}</p>
          <span :class="['text-[10px] font-bold uppercase px-2 py-0.5 rounded-full', badge(h.status)]">{{ h.status }}</span>
        </div>
      </li>
    </ul>

    <div v-if="pages > 1" class="flex items-center justify-between mt-3 text-sm">
      <button class="px-3 py-1 bg-gray-100 rounded-md dark:bg-gray-800 dark:text-gray-300 disabled:opacity-40" :disabled="page === 1" @click="page--">Previous</button>
      <span class="text-gray-500 dark:text-gray-400">Page {{ page }} of {{ pages }}</span>
      <button class="px-3 py-1 bg-gray-100 rounded-md dark:bg-gray-800 dark:text-gray-300 disabled:opacity-40" :disabled="page === pages" @click="page++">Next</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { HistoryItem, HistoryStatus } from '@/services/dashboardService';

const props = defineProps<{ history: HistoryItem[] }>();

const statuses: HistoryStatus[] = ['Pending Approval', 'Approved', 'Payment Requested', 'Payment Released', 'Received'];
const saleFilter = ref('all');
const statusFilter = ref('all');
const page = ref(1);
const PER_PAGE = 6;

const saleOptions = computed(() => {
  const seen = new Map<number, string>();
  for (const h of props.history) if (!seen.has(h.sale_ID)) seen.set(h.sale_ID, h.sale_label);
  return [...seen.entries()].map(([id, label]) => ({ id, label }));
});

const filtered = computed(() =>
  props.history.filter(h =>
    (saleFilter.value === 'all' || String(h.sale_ID) === saleFilter.value) &&
    (statusFilter.value === 'all' || h.status === statusFilter.value)
  )
);
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PER_PAGE)));
const paged = computed(() => filtered.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE));

watch([saleFilter, statusFilter], () => { page.value = 1; });
watch(pages, (n) => { if (page.value > n) page.value = n; });

const peso = (n: number) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const badge = (s: HistoryStatus) =>
  s === 'Received' ? 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  : s === 'Payment Released' ? 'bg-green-100 text-green-700'
  : s === 'Approved' ? 'bg-emerald-100 text-emerald-700'
  : s === 'Pending Approval' ? 'bg-amber-100 text-amber-700'
  : 'bg-blue-100 text-blue-700';
</script>
