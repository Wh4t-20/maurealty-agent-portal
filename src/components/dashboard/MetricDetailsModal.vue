<template>
  <!-- The "Analysis" popup of a Dashboard card: the records behind the number, 10 per page.
       Moved here from Dashboard.vue unchanged; the page keeps the fade transition around it. -->
  <div class="fixed inset-0 w-full h-full bg-[#0a3d62]/70 backdrop-blur-sm flex items-center justify-center z-[9999]" @click.self="$emit('close')">

    <div class="bg-white dark:bg-black rounded-[24px] relative p-8 w-full max-w-2xl shadow-xl flex flex-col max-h-[80vh]">
      <button class="absolute top-4 right-5 text-gray-400 dark:text-gray-700 hover:text-gray-700 dark:hover:text-gray-400 text-xl font-bold" @click="$emit('close')">✕</button>

      <div class="border-b border-gray-200 dark:border-gray-800 pb-4 mb-4 shrink-0">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200">{{ metric.label }} Analysis</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Total: <span class="font-medium text-gray-900 dark:text-white">{{ metric.value }}</span></p>
      </div>

      <div class="overflow-y-auto flex-1 pr-2">
        <table class="w-full text-left border-collapse" v-if="metric.details && metric.details.length">
          <thead class="sticky top-0 bg-white dark:bg-black z-10">
            <tr class="border-b border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
              <th class="pb-3 font-medium">Date</th>
              <th class="pb-3 font-medium">Title</th>
              <th class="pb-3 font-medium">Status</th>
              <th class="pb-3 font-medium text-right" v-if="metric.showAmount">Amount</th>
            </tr>
          </thead>
          <tbody>
                            <tr v-for="(item, index) in paginatedDetails" :key="index" class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
              <td class="py-3 text-sm text-gray-700 dark:text-gray-300">{{ formatDate(item.date) }}</td>
              <td class="py-3 text-sm text-gray-700 dark:text-gray-300">{{ item.title }}</td>
              <td class="py-3 text-sm">
                <span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {{ item.status || 'N/A' }}
                </span>
              </td>
              <td class="py-3 text-sm text-right font-medium text-gray-900 dark:text-white" v-if="metric.showAmount">
                {{ formatCurrency(item.amount || 0) }}
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="totalPages > 1" class="flex justify-between items-center px-4 py-4 mt-2 border-t border-gray-100 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-black">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Previous
          </button>

          <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Page {{ currentPage }} of {{ totalPages }}
          </span>

          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>

        <div v-else-if="!metric.details || !metric.details.length" class="text-center py-12 flex flex-col items-center justify-center">
          <div class="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-3">
            <span class="text-2xl">📋</span>
          </div>
          <p class="text-gray-500 dark:text-gray-400 font-medium">No records found</p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">There is no data available for this time period.</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
// Breakdown popup for a Dashboard stat card (moved out of Dashboard.vue, same look and behaviour).
// The Dashboard passes a fresh `metric` when the live refresh changes the numbers.
import { ref, computed, watch } from 'vue';
import type { Metric } from '@/services/dashboardService';

const props = defineProps<{ metric: Metric }>();
defineEmits<{ (e: 'close'): void }>();

const currentPage = ref(1);
const itemsPerPage = 10;

// Back to the first page whenever another (or a refreshed) metric is shown.
watch(() => props.metric, () => {
  currentPage.value = 1;
});

const totalPages = computed(() => {
  if (!props.metric?.details) return 0;
  return Math.ceil(props.metric.details.length / itemsPerPage);
});

const paginatedDetails = computed(() => {
  if (!props.metric?.details) return [];
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return props.metric.details.slice(start, end);
});

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

// Helper to format dates cleanly for the modal table
const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

// Helper to format large numbers into clean currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(value);
};
</script>
