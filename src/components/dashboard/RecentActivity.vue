<template>
  <div class="p-6 transition-all duration-300 ease-in-out bg-white border border-gray-200 shadow-sm cursor-pointer rounded-2xl dark:bg-black dark:border-gray-900 hover:-translate-y-1.5 hover:shadow-xl">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-sm font-bold tracking-wide text-gray-900 dark:text-gray-100">
        RECENT ACTIVITY
      </h3>
      <button 
        class="text-sm font-medium text-blue-500 bg-transparent border-none cursor-pointer dark:text-blue-400 hover:underline" 
        @click="$emit('view-all')"
      >
        View All
      </button>
    </div>

    <div 
      v-for="act in activities.slice(0, 3)" 
      :key="act.id" 
      class="flex items-start py-4 border-b border-gray-100 cursor-pointer dark:border-gray-800 last:border-b-0" 
      @click="$emit('view-item', act)"
    >
      <div 
        class="w-2 h-2 mt-1.5 mr-3 rounded-full shrink-0" 
        :class="[
          act.type === 'money' ? 'bg-green-500' : 
          act.type === 'lead' ? 'bg-blue-500' : 
          'bg-gray-400'
        ]"
      ></div>
      <div class="grow">
        <p class="m-0 text-sm text-gray-800 dark:text-gray-200">
          <strong class="font-bold">{{ act.title }}</strong> {{ act.desc }}
        </p>
        <span class="text-xs text-gray-400 dark:text-gray-500">{{ act.time }}</span>
      </div>
      <span class="self-center ml-2.5 text-xl text-gray-300 dark:text-gray-600">›</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ activities: any[] }>();
defineEmits(['view-item', 'view-all']);
</script>