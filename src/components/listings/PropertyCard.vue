<template>
  <div class="relative w-full max-w-150" :class="{ 'animate-pulse cursor-wait': isLoading }">
    <div class="relative hover:shadow-2xl">
      
      <!-- Skeleton Image -->
      <div v-show="isLoading || !isImageLoaded" class="w-full aspect-square bg-gray-300 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-800"></div>
      
      <!-- Actual Image -->
      <img 
        v-show="!isLoading && isImageLoaded"
        :src="houseimg"
        alt="House"
        loading="lazy"
        @load="handleImageLoad"
        class="w-full aspect-square object-cover rounded-lg border border-gray-300 dark:border-gray-800"
      />
      
      <!-- Skeleton Badge -->
      <span v-if="isLoading" class="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 w-16 sm:w-24 h-4 sm:h-6 bg-gray-400 dark:bg-gray-600 rounded-full shadow-md"></span>
      <!-- Actual Badge -->
      <span v-else :class="['absolute top-1.5 right-1.5 sm:top-3 sm:right-3 text-[10px] sm:text-sm font-light text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full tracking-wider shadow-md', propertyTypeColor(details?.property_type)]">
        {{ displayType }}
      </span>
    </div>

    <!-- Original Details Container -->
    <div class="flex flex-col h-full z-1 -mt-6 sm:-mt-10 w-9/10 p-2 px-3 sm:p-3 sm:px-5 rounded-lg bg-white dark:bg-black border border-gray-300 dark:border-gray-800 shadow-md/30">
      
      <!-- Title -->
      <div v-if="isLoading" class="h-5 sm:h-7 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
      <p v-else class="text-sm sm:text-xl text-maurealty-blue dark:text-maurealty-light-blue truncate font-semibold tracking-tight ">{{ details?.listing_title }}</p>

      <!-- Price -->
      <div v-if="isLoading" class="h-4 sm:h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-1/2 mt-1 mb-1"></div>
      <span v-else class="block bg-maurealty-green break-all font-normal text-xs sm:text-lg text-white px-2 sm:px-3 rounded-full tracking-wider mr-2 mt-0.5 w-fit">
          {{ formattedPrice }}
      </span>

      <!-- Location -->
      <div class="flex items-center gap-1 text-black dark:text-white mt-1 sm:mt-2">
        <MapPin class="w-3 h-3 sm:w-4 sm:h-4 shrink-0" :class="{ 'text-gray-300 dark:text-gray-700': isLoading }" />
        <div v-if="isLoading" class="h-3 sm:h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
        <span v-else class="text-[10px] sm:text-sm truncate">
            {{ details?.location }}
        </span>
      </div>
      
      <!-- Developer -->
      <div v-if="isLoading" class="hidden sm:block h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mt-1"></div>
      <p v-else class="hidden sm:block tracking-wide mb-0 text-black dark:text-white truncate">{{ details?.developer_name }}</p>
      
      <!-- Date -->
      <div v-if="isLoading" class="hidden sm:block h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mt-auto"></div>
      <p v-else class="hidden sm:block text-sm text-gray-500 mt-auto">Created at: {{ formattedDate }}</p>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue' // Don't forget to import this
import { type Property, formattedPropertyType }  from '@/assets/classes/listings'
import placeholder from '@/assets/images/default_placeholder.png'
import { MapPin } from 'lucide-vue-next'

import { formatPrice } from '@/utils/conversion.ts';

const props = withDefaults(defineProps<{ 
  details?: Property; 
  isLoading?: boolean;
}>(), {
  isLoading: false
})

// New state to track whether the image of the card is finished downloading
const isImageLoaded = ref(false)

// function to fire when the image fully loads
const handleImageLoad = () => {
  isImageLoaded.value = true
}

// Cache formatters for better performance  
const dateFormatter = new Intl.DateTimeFormat('en-US')

function propertyTypeColor(type?: string) {
  if (!type) return 'bg-gray-400'

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
const displayType = computed(() => props.details ? formattedPropertyType(props.details.property_type): '')

const formattedPrice = computed(() => {
  if (!props.details) return '';

  const minPrice = formatPrice(props.details.price);
  // Return range if listing is bulk and max_price is available
  if (props.details.is_bulk && props.details.max_price) {
    return `${minPrice} - ${formatPrice(props.details.max_price)}`;
  }
  return minPrice;
})

const formattedDate = computed(() => props.details ? dateFormatter.format(props.details.created_at): '');

// Returns the database image URL if it exists, otherwise uses the local fallback
const houseimg = computed(() => {
  if (!props.details) return placeholder;
  return props.details.image_url ? props.details.image_url : placeholder;
})
</script>