<template>
  <div
    class="p-6 transition-all duration-300 ease-in-out bg-white shadow-sm cursor-pointer dark:bg-black rounded-2xl hover:-translate-y-1.5 hover:shadow-xl"
    @click="$emit('open-details')"
  >
    <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
      <h2 class="text-base font-bold tracking-wide text-gray-800 dark:text-gray-100">SALES PERFORMANCE</h2>
      <div class="flex gap-4 text-sm text-gray-600 dark:text-[#c5cede]">
        <span>Approved: <strong>{{ sold }}</strong></span>
        <span>Avg Deal: <strong>{{ avgDealText }}</strong></span>
      </div>
    </div>

    <!-- Approved sales per month (awaiting payment or complete), live from the sales table -->
    <div class="flex items-end gap-3 h-44">
      <div
        v-for="(bar, i) in bars"
        :key="i"
        class="flex flex-col justify-end flex-1 h-full gap-1"
        :title="`${bar.label}: ${bar.value} approved sale(s)`"
      >
        <span
          class="text-xs text-center"
          :class="isSelected(i) ? 'font-bold text-maurealty-blue' : 'font-medium text-gray-500 dark:text-gray-400'"
        >{{ bar.value }}</span>
        <div class="flex items-end flex-1 border-b border-gray-200 dark:border-gray-700">
          <div
            v-if="bar.value > 0"
            class="w-full transition-all duration-700 ease-out rounded-t-md"
            :class="isSelected(i) ? 'bg-linear-to-b from-maurealty-blue to-[#2980b9]' : 'bg-maurealty-blue/30'"
            :style="{ height: heightOf(bar.value) + '%' }"
          ></div>
        </div>
        <span
          class="text-[10px] text-center"
          :class="isSelected(i) ? 'font-bold text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'"
        >{{ bar.label }}</span>
      </div>
    </div>
    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
      Approved sales per month (by reservation date). Highlighted = selected month.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  bars: { label: string; value: number }[];  // last bar = the selected month
  sold: number;       // approved sales in the selected month
  avgDeal: number;    // average contract price of those sales
}>();
defineEmits(['open-details']);

const isSelected = (i: number) => i === props.bars.length - 1;
const maxValue = computed(() => Math.max(1, ...props.bars.map(b => b.value)));
// Height is the share of the busiest month, so 1 sale vs 4 sales looks like 1 vs 4.
const heightOf = (v: number) => (v / maxValue.value) * 100;
const avgDealText = computed(() =>
  props.avgDeal > 0
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(props.avgDeal)
    : '—'
);
</script>