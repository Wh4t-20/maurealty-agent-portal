<template>
  <div class="relative w-full max-w-150"> 
    <img src="@/assets/images/sample-house.jpg" alt="House" 
      class="w-full aspect-square object-cover rounded-3xl border border-gray-300" 
    />

    <div class="z-1 -mt-10 w-9/10 p-3 px-10 rounded-2xl bg-white border border-gray-300 shadow-md/30 ">
      <p class="property-desc">{{ details.description }}</p>
      <p class="property-price">Php {{ details.price.toLocaleString() }}</p>
      <p class="broker">Brokerage firm</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Property }  from '@/assets/classes/listings'

defineProps<{ details: Property }>()
</script>