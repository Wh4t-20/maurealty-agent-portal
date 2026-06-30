<template>
  <div 
    class="p-6 mt-4 transition-all duration-300 ease-in-out bg-white shadow-sm cursor-pointer rounded-2xl dark:bg-black hover:-translate-y-1.5 hover:shadow-xl" 
    @click="$emit('view-all')"
  >
    <h3 class="mb-4 text-sm font-bold tracking-wide text-gray-900 dark:text-gray-100">
      REMINDERS
    </h3>
    
    <div 
      v-for="(rem, index) in reminders.slice(0, 3)" 
      :key="index" 
      class="px-3 py-2.5 mb-2 text-xs transition-colors duration-200 rounded-lg"
      :class="rem.urgent 
        ? 'bg-red-50 text-red-600 font-medium border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50' 
        : 'bg-gray-50 text-gray-600 border border-transparent dark:bg-gray-800 dark:text-gray-300'"
    >
      {{ rem.text }}
    </div>

    <div 
      v-if="reminders.length > 3" 
      class="px-3 py-2.5 mb-2 text-xs text-center text-gray-500 bg-transparent border border-gray-300 border-dashed rounded-lg dark:text-gray-400 dark:border-gray-700"
    >
      + {{ reminders.length - 3 }} more tasks...
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ reminders: any[] }>();
defineEmits(['view-all']);
</script>