<template>
  <!-- DETAILS & OTHER FUNCTIONALITY -->
  <section class="absolute z-20 bottom-10 left-5 flex gap-2">
    <div v-if="props.targetLocation?.loc" class="p-4 px-6 w-fit bg-maurealty-blue text-white rounded-2xl">
      <h1>Pinned Location: {{ props.targetLocation?.loc  }}</h1>
    </div>
    <button type="button" class="p-4 bg-maurealty-blue hover:bg-[#045fa3] rounded-2xl text-white cursor-pointer" @click="togglePinning">
      <MapPinIcon v-if="!enablePin" />
      <MapPinOffIcon v-if="enablePin" />
    </button>
  </section>
  

  <div :class="{ 'pin-enabled': enablePin }" id='map-container' ref="mapContainer" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Import the Geocoder and its CSS
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { MapPinIcon, MapPinOffIcon } from 'lucide-vue-next';

const mapContainer = ref<HTMLElement | null>(null);
const map = shallowRef<any>(null);
const marker = shallowRef<any>(null);

const props = defineProps<{
  targetLocation?: { lng: number; lat: number; loc: string } | null
}>();

const enablePin = ref(false);

function togglePinning() {
  enablePin.value = !enablePin.value;
  console.log(enablePin.value ? "Pin enabled" : "Pin disabled");
}

// Emit the new coordinates back to the parent when searched
const emit = defineEmits<{
  (e: 'update:targetLocation', location: { lng: number; lat: number; name: string }): void
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

  // Initialize the Geocoder
  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken as string,
    mapboxgl: mapboxgl as any,
    marker: false, // Set to false so we can manually manage our existing red marker
    placeholder: 'Search for a location...'
  });

  // Add the search bar to the top-left of the map
  map.value.addControl(geocoder, 'top-left');

  // Listen for the result event when a user clicks an autofill option
  geocoder.on('result', (e: any) => {
    const [newLng, newLat] = e.result.center;
    const locationName = e.result.place_name;

    // The map automatically flies to the location, so we just update the pin
    if (marker.value) {
      marker.value.setLngLat([newLng, newLat]);
    } else {
      marker.value = new mapboxgl.Marker({ color: 'red' })
        .setLngLat([newLng, newLat])
        .addTo(map.value);
    }

    console.log(newLng, newLat, locationName )
    // Inform the parent component of the new state
    emit('update:targetLocation', { lng: newLng, lat: newLat, name: locationName });
  });

  map.value.on('click', async (e: any) => {
    if (enablePin.value) {
      const { lng, lat } = e.lngLat;

      // setting up the pin
      if (marker.value) {
        marker.value.setLngLat([lng, lat]);
      } else {
        marker.value = new mapboxgl.Marker({ color: 'red' })
          .setLngLat([lng, lat])
          .addTo(map.value);
      }

      // Query Mapbox API to turn coordinates into a location name (Reverse Geocoding)
      try {
        const token = mapboxgl.accessToken;
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`
        );
        const data = await response.json();

        const locationName = data.features?.[0]?.place_name || `Pinned Location (${lat.toFixed(8)}, ${lng.toFixed(8)})`;

        // update the text inside the Geocoder search bar so the UI matches the pin
        geocoder.setInput(locationName);

        // send everything back to the parent PropertyManagement form
        emit('update:targetLocation', { lng, lat, name: locationName });

      } catch (error) {
        console.error("Reverse geocoding failed:", error);
        // fallback
        emit('update:targetLocation', { 
          lng, 
          lat, 
          name: `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})` 
        });
      }
    }
  }); 
});

// Watch for coordinate changes from the parent to dynamically update the map and marker
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

:deep(.mapboxgl-ctrl-geocoder) {
  min-width: 280px;
}

#map-container.pin-enabled :deep(.mapboxgl-canvas) {
  cursor: crosshair !important;
}
</style>