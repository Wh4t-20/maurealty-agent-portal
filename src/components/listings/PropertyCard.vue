<template>
  <div class="relative w-full max-w-150">

    <!-- Skeleton State: Shown while fetching Supabase data -->
    <!-- Utilizes Tailwind's 'animate-pulse' for the loading effect -->
    <div v-if="isLoading" class="animate-pulse relative hover:shadow-2xl">
      <!-- Skeleton Image Box -->
      <div class="w-full aspect-square bg-gray-300 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-800"></div>
      
      <!-- Skeleton Details Box (Matches your floating layout) -->
      <div class="flex flex-col h-full z-1 -mt-6 sm:-mt-10 w-9/10 p-2 px-3 sm:p-3 sm:px-5 rounded-lg bg-white dark:bg-black border border-gray-300 dark:border-gray-800 shadow-md/30">
        <div class="h-5 sm:h-7 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div class="h-5 sm:h-7 bg-gray-300 dark:bg-gray-700 rounded-full w-1/3 mb-2"></div>
        <div class="h-3 sm:h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6 mb-2 mt-1 sm:mt-2"></div>
        <div class="hidden sm:block h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
        <div class="hidden sm:block h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mt-auto"></div>
      </div>
    </div>

    <!-- Actual Content State: Shown after data is retrieved -->
    <div v-else>
      <div class="relative hover:shadow-2xl">
        <!-- Image Loading Skeleton: Displayed while the image downloads -->
        <div v-show="!isImageLoaded" class="animate-pulse w-full aspect-square bg-gray-300 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-800"></div>
        
        <!-- load and v-show to track and reveal image upon load -->
        <img :src="houseimg"
             alt="House"
             loading="lazy"
             @load="handleImageLoad"
             v-show="isImageLoaded"
             class="w-full aspect-square object-cover rounded-lg border border-gray-300 dark:border-gray-800"
        />
        <span :class="['absolute top-1.5 right-1.5 sm:top-3 sm:right-3 text-[10px] sm:text-sm font-light text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full tracking-wider shadow-md', propertyTypeColor(details?.property_type)]">
          {{ displayType }}
        </span>
      </div>

      <div class="flex flex-col h-full z-1 -mt-6 sm:-mt-10 w-9/10 p-2 px-3 sm:p-3 sm:px-5 rounded-lg bg-white dark:bg-black border border-gray-300 dark:border-gray-800 shadow-md/30 ">
        <!-- Appended '?.' to strictly handle optional details object -->
        <p class="text-sm sm:text-xl text-maurealty-blue dark:text-maurealty-light-blue truncate font-semibold tracking-tight ">{{ details?.listing_title }}</p>

        <span class="block bg-maurealty-green break-all font-normal text-xs sm:text-lg text-white px-2 sm:px-3 rounded-full tracking-wider mr-2 mt-0.5">
            {{ formattedPrice }}
        </span>

        <div class="flex items-center gap-1 text-black dark:text-white mt-1 sm:mt-2">
          <MapPin class="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
          <span class="text-[10px] sm:text-sm truncate">
              {{ details?.location }}
          </span>
        </div>
        <p class="hidden sm:block tracking-wide mb-0 text-black dark:text-white truncate">{{ details?.developer_name }}</p>
        <p class="hidden sm:block text-sm text-gray-500 mt-auto">Created at: {{ formattedDate }}</p>
      </div>
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