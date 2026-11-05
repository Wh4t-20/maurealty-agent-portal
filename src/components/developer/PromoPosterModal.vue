<template>
  <!-- Promo poster lightbox (Developer List). Moved here from developerlist.vue unchanged. -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" @click.self="$emit('close')">
    <div class="relative max-w-3xl w-full max-h-full flex flex-col items-center">
      <button class="absolute -top-3 -right-3 bg-white text-black p-2 rounded-full shadow hover:bg-gray-200 transition cursor-pointer" @click="$emit('close')">
        <XIcon class="size-5" stroke-width="3" />
      </button>
      <img :src="promo.image_url" :alt="promo.title" class="max-h-[80vh] w-auto rounded-xl object-contain" />
      <div v-if="promo.title || promo.valid_until" class="mt-3 text-center text-white">
        <p v-if="promo.title" class="font-semibold text-lg">{{ promo.title }}</p>
        <p v-if="promo.valid_until" class="text-sm text-gray-300">Valid until {{ promo.valid_until }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// A developer's promo poster, full size, with its title and validity date.
import { XIcon } from 'lucide-vue-next';
import type { DeveloperPromo } from '@/assets/classes/developers';

defineProps<{ promo: DeveloperPromo }>();
defineEmits<{ (e: 'close'): void }>();
</script>
