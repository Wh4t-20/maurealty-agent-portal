<template>
  <div id='map-container' ref="mapContainer" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapContainer = ref<HTMLElement | null>(null);
const map = ref<any>(null);
const marker = ref<any>(null);

const props = defineProps<{
  targetLocation?: { lng: number; lat: number; } | null
}>();

onMounted(() => {
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

  if (!mapContainer.value) return;
  
  console.log(props.targetLocation?.lng, props.targetLocation?.lat)

  // fallback coords to Fuente
  const lng = props.targetLocation?.lng ?? 123.89313980;
  const lat = props.targetLocation?.lat ?? 10.30995455;

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [lng, lat],
    zoom: 15
  });

  marker.value = new mapboxgl.Marker({
    color: 'red'
  }).setLngLat([lng, lat])
    .addTo(map.value);
});

// Watch for coordinate changes to dynamically update the map and marker
watch(() => props.targetLocation, (newLoc) => {
  if (map.value && newLoc) {
    map.value.flyTo({ center: [newLoc.lng, newLoc.lat], essential: true });
    
    if (marker.value) {
      marker.value.setLngLat([newLoc.lng, newLoc.lat]);
    } else {
      marker.value = new mapboxgl.Marker({ color: 'red' })
        .setLngLat([newLoc.lng, newLoc.lat])
        .addTo(map.value);
    }
  }
}, { deep: true });

const clearMarker = () => {
  if (marker.value) {
    marker.value.remove();
    marker.value = null;
  }
};

onUnmounted(() => {
  clearMarker();

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