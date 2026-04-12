<template>
  <div class="relative w-full max-w-150"> 
    <img src="@/assets/images/sample-house.jpg" alt="House" 
      class="w-full aspect-square object-cover rounded-3xl border border-gray-300" 
    />

    <div class="z-1 -mt-10 w-9/10 p-3 px-10 rounded-2xl bg-white border border-gray-300 shadow-md/30 ">
      <p class="text-xl text-maurealty-blue font-semibold tracking-tight truncate">{{ details.description }}</p>

      <span class="inline-block bg-[#33b058] text-lg text-white px-3 rounded-full tracking-wider mr-2 mt-0.5">
        ₱ {{ details.price.toLocaleString() }}
      </span>
      <span class="inline-block bg-[#336db0] text-white px-3 rounded-full tracking-wider mt-0.5">
        {{ details.property_type  }}
      </span>
      
      <p class="text-sm text-gray-500 mt-2">Created at: {{ details.created_at.toLocaleDateString() }}</p>
      <p class="tracking-wide">Brokerage firm</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Property }  from '@/assets/classes/listings'

defineProps<{ details: Property }>()
</script>