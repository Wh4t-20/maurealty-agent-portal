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
        <span v-if="reminders.length" class="ml-1 px-2 py-0.5 text-[10px] rounded-full bg-maurealty-blue/10 text-maurealty-blue">{{ reminders.length }}</span>
      </h3>
      <span v-if="reminders.length > 3" class="text-[11px] font-semibold text-maurealty-blue">
        {{ expanded ? 'Show less ▲' : 'Show all ▼' }}
      </span>
    </button>

    <p v-if="reminders.length === 0" class="text-xs text-gray-500 dark:text-gray-400">Nothing needs your attention right now.</p>

    <!-- Clicking a reminder goes to its page -->
    <button
      v-for="(rem, index) in visible"
      :key="index"
      type="button"
      class="block w-full px-3 py-2.5 mb-2 text-xs text-left transition-all duration-200 rounded-lg cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
      :class="rem.urgent
        ? 'bg-red-50 text-red-600 font-medium border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
        : 'bg-gray-50 text-gray-600 border border-transparent dark:bg-gray-800 dark:text-gray-300'"
      @click="$emit('open', rem)"
    >
      {{ rem.text }}
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
import { computed, ref } from 'vue';

const props = defineProps<{ reminders: { text: string; urgent: boolean; to: string }[] }>();
defineEmits<{ (e: 'open', reminder: { text: string; urgent: boolean; to: string }): void }>();

const expanded = ref(false);
const visible = computed(() => (expanded.value ? props.reminders : props.reminders.slice(0, 3)));
</script>