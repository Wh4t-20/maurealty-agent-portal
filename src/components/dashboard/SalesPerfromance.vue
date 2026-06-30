<template>
  <div 
    class="p-6 bg-white dark:bg-black rounded-2xl shadow-sm cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1.5 hover:shadow-xl" 
    @click="$emit('open-details')"
  >
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-bold tracking-wide text-gray-800 dark:text-gray-100">
        SALES PERFORMANCE
      </h2>
      <div class="flex gap-4 text-sm text-gray-600 dark:text-[#c5cede]">
        <span>Conv: <strong>3.2%</strong></span>
        <span>Avg Deal: <strong>$450k</strong></span>
      </div>
    </div>
    
    <div class="flex items-end gap-3 h-45">
      <div 
        v-for="(val, i) in [40, 70, 45, 90, 65, 80, 95]" 
        :key="i" 
        class="relative flex-1 h-full overflow-hidden bg-gray-100 rounded-md dark:bg-gray-800"
      >
        <div 
          class="absolute bottom-0 w-full transition-all duration-1000 ease-out bg-linear-to-b from-maurealty-blue to-[#2980b9]" 
          :style="{ height: val + '%' }"
        ></div>
      </div>
    </div>
  </div>
</template>