<template>
  <div class="relative w-full flex flex-col min-h-screen bg-background-gray">

    <header class="flex flex-col py-5 px-10 pb-3 w-full bg-linear-to-r from-[#A9D6FF70] to-[#FFFFFF] text-maurealty-blue shadow-md sticky top-0 z-20">
      <div class="flex items-baseline gap-3">
        <h1 class="text-3xl font-bold">ACCOUNTING</h1>
        <span class="text-sm font-medium text-maurealty-blue/70">Calculators</span>
      </div>
    </header>

    <main class="flex-1 p-8 md:p-10 overflow-y-auto">
      <div class="mx-auto w-full max-w-2xl">
        <CalculatorPanel />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// Calculator (incl. the amortization schedule) lives in the shared
// CalculatorPanel so the listing popup can reuse it.
import CalculatorPanel from '@/components/calculator/CalculatorPanel.vue'
</script>
