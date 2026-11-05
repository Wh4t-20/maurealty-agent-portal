<template>
  <!-- Location picker over the Property Management form (search or drop a pin).
       Moved here from PropertyManagement.vue unchanged; the page keeps the zoom transition around it. -->
  <div class="absolute inset-0 z-50 bg-white dark:bg-black dark:bg-black overflow-hidden rounded-2xl">

    <button
      @click="$emit('close')"
      type="button"
      class="absolute top-4 right-4 z-60 bg-red-500 text-white p-3 rounded-full font-bold shadow-md hover:bg-red-600 transition-colors cursor-pointer"
    >
      <XIcon />
    </button>

    <MapInteractive
      :target-location="location"
      @update:targetLocation="(loc) => $emit('picked', loc)"
    />
  </div>
</template>

<script setup lang="ts">
// location: where the pin starts (the form's current coordinates and location text).
// picked: the place the user searched for or pinned ({ lng, lat, name }).
import { XIcon } from 'lucide-vue-next';
import MapInteractive from '@/components/listings/MapInteractive.vue';

defineProps<{ location: { lng: number; lat: number; loc: string } }>();
defineEmits<{
  (e: 'close'): void
  (e: 'picked', location: { lng: number; lat: number; name: string }): void
}>();
</script>
