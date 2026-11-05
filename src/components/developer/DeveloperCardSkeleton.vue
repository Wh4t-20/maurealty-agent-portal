<template>
  <div class="bg-white dark:bg-black p-6 rounded-[15px] shadow-lg w-full animate-pulse" aria-hidden="true">
    <!-- Placeholder shaped like developerCard.vue (same card, spacing and sections), shown by the
         Developer List while the developers load. Gray blocks pulse like the Project Listings
         skeleton cards (components/listings/PropertyCard.vue). Hidden from screen readers: the page
         announces "Loading developers…" instead. -->

    <!-- Profile: picture, name and the "Active" badge -->
    <div class="flex items-center gap-4 mb-4">
      <div class="w-16 h-16 shrink-0 rounded-full bg-gray-300 dark:bg-gray-700"></div>
      <div class="flex flex-col gap-2 w-full">
        <div class="h-7 w-1/2 rounded bg-gray-300 dark:bg-gray-700"></div>
        <div class="h-5 w-14 rounded bg-gray-300 dark:bg-gray-700"></div>
      </div>
    </div>

    <!-- Contact details, location and office hours -->
    <div class="mt-5 flex flex-col px-1 gap-2 mb-4">
      <div class="h-5 w-32 rounded bg-gray-300 dark:bg-gray-700"></div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <div class="h-5 w-3/4 rounded bg-gray-300 dark:bg-gray-700"></div>
        <div class="h-5 w-3/4 rounded bg-gray-300 dark:bg-gray-700"></div>
      </div>

      <div class="mt-4 h-6 w-2/3 rounded bg-gray-300 dark:bg-gray-700"></div>

      <div class="mt-4 flex flex-col gap-2">
        <div class="h-5 w-44 rounded bg-gray-300 dark:bg-gray-700"></div>
        <!-- Same grey box as the real office-hours list -->
        <div class="p-2 pl-4 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full flex flex-col gap-2">
          <div class="h-5 w-2/3 rounded bg-gray-300 dark:bg-gray-700"></div>
          <div class="h-5 w-1/2 rounded bg-gray-300 dark:bg-gray-700"></div>
        </div>
      </div>
    </div>

    <!-- Recent Projects chips -->
    <div class="mb-4">
      <div class="h-4 w-28 mb-2 rounded bg-gray-300 dark:bg-gray-700"></div>
      <div class="flex gap-2 flex-wrap">
        <div v-for="n in 3" :key="'project-' + n" class="h-6 w-24 rounded bg-gray-200 dark:bg-gray-800"></div>
      </div>
    </div>

    <!-- Promotions (poster thumbnails) -->
    <div class="mb-4">
      <div class="h-4 w-24 mb-2 rounded bg-gray-300 dark:bg-gray-700"></div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div v-for="n in 3" :key="'promo-' + n" class="h-24 rounded-lg bg-gray-200 dark:bg-gray-800"></div>
      </div>
    </div>

    <!-- Buttons (Contact; admins also get Delete / Edit once loaded) -->
    <div class="flex justify-end">
      <div class="h-9 w-30 rounded-[5px] bg-gray-300 dark:bg-gray-700"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
// DeveloperCardSkeleton: loading placeholder for one developer card on the Developer List
// (src/views/developerlist.vue). No props or logic; it only mirrors developerCard.vue's layout,
// so update both together when the card's sections change.
</script>
