<template>
  <div class="flex">
    <Sidebar v-if="!route.meta.hideSidebar" />
    
    <!-- Extra bottom padding on phones so the bottom nav bar doesn't cover the page. -->
    <div class="flex-1 pb-16 md:pb-0">
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
  // Animation settings
  if (configs.disableAnimations) {
    document.body.classList.add('disable-animations');
  } else {
    document.body.classList.remove('disable-animations');
  }

  // Dark Theme settings
  if (configs.darkThemeEnabled) {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark'; // syncing with local storage
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.theme = 'light'; 
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