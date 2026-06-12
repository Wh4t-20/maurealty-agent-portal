<template>
  <div id='map-container' ref="mapContainer" />
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapContainer = ref(null);
const map = ref(null);

onMounted(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

  if (!mapContainer.value) return;
  
  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [123.8854, 10.3157],
    zoom: 12
  });
});

onUnmounted(() => {
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});
</script>

<style scoped>
#map-container {
  width: 100%;
  height: 100%;
}
</style>