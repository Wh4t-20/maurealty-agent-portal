<template>
  <div class="relative w-full max-w-150"> 
    <div class = "relative">
    <img :src="houseimg" alt="House" 
      class="w-full aspect-square object-cover rounded-lg border border-gray-300" 
    />
    <span :class="['absolute top-3 right-3 text-sm font-light text-white px-3 rounded-full tracking-wider shadow-md',propertyTypeColor(details.property_type)]">
  {{ formattedPropertyType(details.property_type) }}
</span>
    </div>
    <div class="z-1 -mt-10 w-9/10 p-3 px-5  rounded-lg bg-white border border-gray-300 shadow-md/30 ">
      <p class="text-xl text-maurealty-blue text-balance font-semibold tracking-tight ">{{ details.listing_title }}</p>
      
      <span class="block bg-maurealty-green break-all font-normal text-lg text-white px-3 rounded-full tracking-wider mr-2 mt-0.5">
        ₱ {{ details.price.toLocaleString() }}
      </span>
    
      <p class="text-base text-black text-balance tracking-tight mt-5 ">{{ details.location }}</p>
      <p class="text-sm text-gray-500 mt-1">Created at: {{ details.created_at.toLocaleDateString() }}</p>
      <p class="tracking-wide">{{ details.developer_name }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue' // Don't forget to import this
import { type Property }  from '@/assets/classes/listings'
import house1 from '@/assets/images/sample-house.jpg' // Kept as a fallback image

const props = defineProps<{ details: Property }>()

function formattedPropertyType (type: string) {
  if (type === 'house_and_lot')
    return 'House and Lot'
  else if (type === 'lot_only')
    return 'Lot Only'
  else if (type === 'condominium')
    return 'Condominium'
  else if (type === 'memorial')
    return 'Memorial'
  else if (type === 'clubshare')
    return 'Clubshare'
  else if (type === 'golfshare')
    return 'Golfshare'
  else
    return 'N/A'
}

function propertyTypeColor(type: string) {
  switch (type) {
    case 'house_and_lot':
      return 'bg-green-600'
    case 'lot_only':
      return 'bg-yellow-500'
    case 'condominium':
      return 'bg-[#336db0]'
    case 'memorial':
      return 'bg-gray-500'
    case 'clubshare':
      return 'bg-purple-600'
    case 'golfshare':
      return 'bg-emerald-700'
    default:
      return 'bg-gray-400'
  }
}

// Returns the database image URL if it exists, otherwise uses the local fallback
const houseimg = computed(() => {
  return props.details.image_url ? props.details.image_url : house1
})
</script>