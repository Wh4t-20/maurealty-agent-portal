<template>
  <div class="relative w-full h-full">
    <!-- POI category chips (only when we have a listing to cache against) -->
    <div v-if="listingId != null" class="absolute z-10 top-2 left-2 right-2 flex flex-wrap gap-1.5">
      <button
        v-for="c in categories"
        :key="c.id"
        type="button"
        @click="toggleCategory(c.id)"
        :style="active.has(c.id) ? { backgroundColor: c.color, color: '#fff', borderColor: c.color } : { borderColor: c.color, color: c.color }"
        class="text-xs px-2.5 py-1 rounded-full border bg-white/90 backdrop-blur-sm shadow-sm cursor-pointer hover:opacity-90 transition"
      >
        {{ c.label }}
      </button>
      <span v-if="poiLoading" class="text-xs px-2 py-1 text-gray-600 bg-white/90 rounded-full shadow-sm">Loading…</span>
    </div>

    <div id="map-container" ref="mapContainer" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { poiService, POI_CATEGORIES, haversineKm, type NearbyPois } from '@/services/poiService';

const mapContainer = ref<HTMLElement | null>(null);
const map = ref<any>(null);
const marker = ref<any>(null);

const props = defineProps<{
  targetLocation?: { lng: number; lat: number } | null;
  listingId?: number | null;
}>();

const categories = POI_CATEGORIES;
const active = ref<Set<string>>(new Set());
const poiData = ref<NearbyPois | null>(null);
const poiLoading = ref(false);
// markers grouped by category so a toggle-off can remove just that set.
const poiMarkers: Record<string, any[]> = {};

onMounted(() => {
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

  if (!mapContainer.value) return;

  // fallback coords to Fuente
  const lng = props.targetLocation?.lng ?? 123.89313980;
  const lat = props.targetLocation?.lat ?? 10.30995455;

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [lng, lat],
    zoom: 15
  });

  marker.value = new mapboxgl.Marker({ color: 'red' })
    .setLngLat([lng, lat])
    .addTo(map.value);
});

// Lazy-fetch POIs the first time any category is enabled, then cache in memory.
async function ensurePois(): Promise<NearbyPois | null> {
  if (poiData.value) return poiData.value;
  if (props.listingId == null) return null;

  const lng = props.targetLocation?.lng ?? 123.89313980;
  const lat = props.targetLocation?.lat ?? 10.30995455;

  poiLoading.value = true;
  try {
    poiData.value = await poiService.getNearbyPois(props.listingId, lng, lat);
    return poiData.value;
  } catch (e) {
    console.error('Failed to load nearby POIs:', e);
    return null;
  } finally {
    poiLoading.value = false;
  }
}

function categoryColor(id: string): string {
  return categories.find((c) => c.id === id)?.color ?? '#07407B';
}

function renderCategory(id: string, data: NearbyPois) {
  if (!map.value) return;
  const origin = props.targetLocation;
  const list = data.categories[id] || [];
  poiMarkers[id] = list.map((poi) => {
    const dist = origin ? haversineKm(origin.lng, origin.lat, poi.lng, poi.lat) : null;
    const popupHtml = `<strong>${poi.name}</strong>${dist != null ? ` <br/><span style="color:#64748b">${dist.toFixed(1)} km away</span>` : ''}`;
    return new mapboxgl.Marker({ color: categoryColor(id) })
      .setLngLat([poi.lng, poi.lat])
      .setPopup(new mapboxgl.Popup({ offset: 18 }).setHTML(popupHtml))
      .addTo(map.value);
  });
}

function clearCategory(id: string) {
  (poiMarkers[id] || []).forEach((m) => m.remove());
  poiMarkers[id] = [];
}

async function toggleCategory(id: string) {
  if (active.value.has(id)) {
    active.value.delete(id);
    clearCategory(id);
    return;
  }
  active.value.add(id);
  const data = await ensurePois();
  if (data && active.value.has(id)) renderCategory(id, data);
}

// Re-center / move the listing pin when the parent changes coordinates.
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

onUnmounted(() => {
  Object.keys(poiMarkers).forEach(clearCategory);
  if (marker.value) {
    marker.value.remove();
    marker.value = null;
  }
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
