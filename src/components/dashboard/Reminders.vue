<template>
  <div class="p-6 mt-4 bg-white shadow-sm rounded-2xl dark:bg-black">
    <!-- Clicking the header only expands / collapses -->
    <button
      type="button"
      class="flex items-center justify-between w-full mb-4 text-left cursor-pointer"
      @click="expanded = !expanded"
    >
      <h3 class="text-sm font-bold tracking-wide text-gray-900 dark:text-gray-100">
        REMINDERS
        <span
          v-if="reminders.length"
          class="ml-1 px-2 py-0.5 text-[10px] rounded-full"
          :class="hasCritical ? 'bg-red-600 text-white' : 'bg-maurealty-blue/10 text-maurealty-blue'"
        >{{ reminders.length }}</span>
      </h3>
      <span v-if="reminders.length > 3" class="text-[11px] font-semibold text-maurealty-blue">
        {{ expanded ? 'Show less ▲' : 'Show all ▼' }}
      </span>
    </button>

    <p v-if="reminders.length === 0" class="text-xs text-gray-500 dark:text-gray-400">Nothing needs your attention right now.</p>

    <!-- Clicking a reminder goes to its page (or, for the password one, opens the change-password modal) -->
    <button
      v-for="(rem, index) in visible"
      :key="index"
      type="button"
      class="block w-full px-3 py-2.5 mb-2 text-xs text-left transition-all duration-200 rounded-lg cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
      :class="rem.critical
        ? 'bg-red-600 text-white font-medium border border-red-700 shadow-sm dark:bg-red-700 dark:border-red-500'
        : rem.urgent
          ? 'bg-red-50 text-red-600 font-medium border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
          : 'bg-gray-50 text-gray-600 border border-transparent dark:bg-gray-800 dark:text-gray-300'"
      @click="$emit('open', rem)"
    >
      <!-- Critical (account security): icon, label and a call to action so it can't be missed -->
      <span v-if="rem.critical" class="flex items-start gap-2">
        <ShieldAlert class="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span class="flex-1">
          <span class="block mb-0.5 text-[10px] font-bold tracking-wider uppercase text-red-100">Important · Account security</span>
          {{ rem.text }}
          <span class="block mt-1.5 font-semibold underline underline-offset-2">Change password →</span>
        </span>
      </span>
      <template v-else>{{ rem.text }}</template>
    </button>

    <button
      v-if="!expanded && reminders.length > 3"
      type="button"
      class="block w-full px-3 py-2.5 text-xs text-center text-gray-500 bg-transparent border border-gray-300 border-dashed rounded-lg dark:text-gray-400 dark:border-gray-700"
      @click="expanded = true"
    >
      + {{ reminders.length - 3 }} more tasks...
    </button>
  </div>
</template>

<script setup lang="ts">
// Reminders: Dashboard reminder list, collapsible after 3. A critical reminder (initial password still
// in use) renders solid red and comes first. Clicking one emits "open"; the Dashboard handles it.
import { computed, ref } from 'vue';
import { ShieldAlert } from 'lucide-vue-next';
import type { Reminder } from '@/services/dashboardService';

const props = defineProps<{ reminders: Reminder[] }>();
defineEmits<{ (e: 'open', reminder: Reminder): void }>();

const expanded = ref(false);
const visible = computed(() => (expanded.value ? props.reminders : props.reminders.slice(0, 3)));
const hasCritical = computed(() => props.reminders.some(r => r.critical));
</script>
