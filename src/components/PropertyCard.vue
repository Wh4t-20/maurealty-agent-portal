<template>
  <div class="relative w-full max-w-150"> 
    <div class = "relative hover:shadow-2xl">
      <img :src="houseimg"
            alt="House"
            loading="lazy"

        class="w-full aspect-square object-cover rounded-lg border border-gray-300" 
        />
    <span :class="['absolute top-3 right-3 text-sm font-light text-white px-3 py-1 rounded-full tracking-wider shadow-md',propertyTypeColor(details.property_type)]">
      {{ displayType }}
    </span>
    </div>
    
    <div class="flex flex-col h-full z-1 -mt-10 w-9/10 p-3 px-5  rounded-lg bg-white border border-gray-300 shadow-md/30 ">
      <p class="text-xl text-maurealty-blue truncate font-semibold tracking-tight ">{{ details.listing_title }}</p>
      
      <span class="block bg-maurealty-green break-all font-normal text-lg text-white px-3 rounded-full tracking-wider mr-2 mt-0.5">
        ₱ {{ formattedPrice}}
      </span>
      
      <div class="flex items-center gap-1 text-black mt-2">
        <MapPin class="w-4 h-4" />
        <span class="text-sm truncate">
            {{ details.location }}
        </span>
      </div>
      <p class="tracking-wide mb-0 truncate">{{ details.developer_name }}</p>
      <p class=" text-sm text-gray-500 mt-auto">Created at: {{ formattedDate }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue' // Don't forget to import this
import { type Property, formattedPropertyType }  from '@/assets/classes/listings'
import house1 from '@/assets/images/sample-house.jpg' // Kept as a fallback image
import { MapPin } from 'lucide-vue-next'

const props = defineProps<{ details: Property }>()

// Cache formatters for better performance  
const numberFormatter = new Intl.NumberFormat('en-US')
const dateFormatter = new Intl.DateTimeFormat('en-US')

function propertyTypeColor(type: string) {
  switch (type) {
    case 'house_and_lot':
      return 'bg-[#1b5c2d]'
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

// Computed properties for formatted display values
const displayType = computed(() => formattedPropertyType(props.details.property_type))
const formattedPrice = computed(() => numberFormatter.format(props.details.price))
const formattedDate = computed(() => dateFormatter.format(props.details.created_at))

// Returns the database image URL if it exists, otherwise uses the local fallback
const houseimg = computed(() => {
  return props.details.image_url ? props.details.image_url : house1
})
</script>