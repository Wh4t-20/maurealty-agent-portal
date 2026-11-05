<template>
  <div class="flex">
    <!-- routerReady: wait for the first page before deciding, so the sidebar doesn't flash on the
         login page or a shared listing link while that page's code downloads -->
    <Sidebar v-if="routerReady && !route.meta.hideSidebar" />
    
    <!-- min-w-0 stops wide page content (like a big table) from stretching this
         box past the browser width. Without it, a flex item never shrinks smaller
         than its widest child, so the whole page — sidebar included — would grow
         sideways and force a horizontal scrollbar instead of the content
         scrolling on its own. Extra bottom padding on phones so the bottom nav
         bar doesn't cover the page. -->
    <div class="flex-1 min-w-0 pb-16 md:pb-0">
      <RouterView />
    </div>
  </div>
</template>

<script setup>
// App shell: the Sidebar (desktop) / bottom bar (phones) beside the current page, plus the
// dark-mode and no-animation classes from the user's settings.
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Sidebar from './components/Sidebar.vue';

const route = useRoute();

// Pages load on demand (src/router/index.ts), so the first route's meta (hideSidebar) is only
// known once its navigation finishes. Until then the route is a blank start location that would
// show the sidebar. Shown even if that first navigation failed (second handler).
const routerReady = ref(false);
const markRouterReady = () => { routerReady.value = true; };
useRouter().isReady().then(markRouterReady, markRouterReady);

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