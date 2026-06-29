<template>
  <div class="flex">
    <Sidebar v-if="!route.meta.hideSidebar" />
    
    <div class="flex-1">
      <RouterView />
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import Sidebar from './components/Sidebar.vue';

const route = useRoute();

// for graphic settings
import { watchEffect } from 'vue';
import { useSettings } from '@/utils/useSettings';

const { configs } = useSettings();

// watches for changes and toggle a class on the body element
watchEffect(() => {
  if (configs.disableAnimations) {
    document.body.classList.add('disable-animations');
  } else {
    document.body.classList.remove('disable-animations');
  }
});
</script>

<style>
/* Ensure the body takes full height and removes default margins */
body {
  margin: 0;
  padding: 0;
}
</style>