<template>
  <div 
    class="bg-white dark:bg-black p-6 rounded-[16px] shadow-[0_4px_6px_rgba(0,0,0,0.02)] cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-[5px] hover:shadow-[0_15px_30px_rgba(0,0,0,0.08)]" 
    @click="$emit('click', stat)"
  >
    <div class="flex justify-between items-center">
      <h3 class="text-xs text-[#64748b] dark:text-[#9bb6dc] m-0">{{ stat.label }}</h3>
      <span class="icon"></span>
    </div>
    
    <div class="text-[1.8rem] font-extrabold text-[#1a1a1a] dark:text-[#efefef] my-2.5">
      {{ stat.value }}
    </div>
    
    <div class="flex items-center gap-2 text-sm">
      <span 
        class="font-medium"
        :class="{
          'text-[var(--color-maurealty-green,#16a34a)]': stat.type === 'positive',
          'text-gray-500': stat.type === 'neutral',
          'text-red-500': stat.type === 'negative'
        }"
      >
        {{ stat.trend }}
      </span>
      <span class="text-[#94a3b8] dark:text-[#bacbe2]">{{ stat.sub }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ stat: any }>();
defineEmits(['click']);
</script>