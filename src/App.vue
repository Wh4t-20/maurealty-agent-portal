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
</script>

<style>
/* Ensure the body takes full height and removes default margins */
body {
  margin: 0;
  padding: 0;
}
</style>