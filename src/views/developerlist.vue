<template>
  <main class="relative w-full h-screen flex flex-1 flex-col overflow-hidden">
  <!-- Add developer tab -->
  <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform opacity-0"
        enter-to-class="transform opacity-100"
        leave-active-class="transition duration-75 ease-out"
        leave-from-class="transform opacity-100"
        leave-to-class="transform opacity-0"
    > 
      <AddDeveloperTab  v-if="showAddDeveloper" @close-add-developer="showAddDeveloper = false; devToEdit = null" @saved="onDeveloperSaved" :dev = "devToEdit? devToEdit : undefined"/>
  </transition>
  
  <div class="relative w-full bg-background-gray dark:bg-background-dark-gray flex flex-col flex-1 overflow-hidden">

    <!-- Same header style as the Project Listings page so every page looks consistent -->
    <header class="flex flex-col py-5 px-4 sm:px-10 w-full bg-linear-to-r from-[#A9D6FF70] dark:from-[#041d3070] to-[#FFFFFF] dark:to-black text-maurealty-blue dark:text-white shadow-md sticky top-0 z-20">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-2">
        <h1 class="text-xl sm:text-3xl font-bold">DEVELOPERS</h1>

        <div class="flex gap-3 sm:gap-5 w-full sm:w-auto">
          <!-- Adding, editing and deleting developers is admin-only -->
          <button v-if="isAdmin" @click="showAddDeveloper = true" class="flex items-center gap-1 bg-maurealty-blue text-md text-white px-4 py-1.5 rounded-full cursor-pointer hover:opacity-70 transition-opacity whitespace-nowrap">
            <Plus class="size-4" /> Add Developer
          </button>
          <!-- Filters the loaded developers in the browser (name, location, email, phone) -->
          <input type="text" placeholder="Search Developer" v-model="searchQuery" maxlength="100"
            class="block min-w-0 flex-1 sm:flex-none py-1.5 pr-3 pl-2 text-base placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:text-white border border-blue-950 dark:border-blue-50 rounded-sm focus:outline-none sm:text-sm/6" />
        </div>
      </div>
    </header>

    <!-- Developer Cards -->
    <div class="flex-1 overflow-y-auto" :aria-busy="!hasLoaded">
      <p v-if="deleteError" class="w-full max-w-6xl mx-auto px-4 sm:px-8 pt-4 text-sm text-red-600 dark:text-red-400" role="alert">{{ deleteError }}</p>
      <!-- LOADING: announced to screen readers while the skeleton cards below are shown -->
      <p v-if="!hasLoaded" class="sr-only" role="status">Loading developers…</p>
      <div class="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-8">
        <!-- SKELETON: placeholder cards until the first load finishes (reloads after a save or
             delete keep the current cards on screen instead) -->
        <template v-if="!hasLoaded">
          <DeveloperCardSkeleton v-for="n in SKELETON_CARDS" :key="'skeleton-' + n" />
        </template>
        <template v-else>
          <DeveloperCard v-for="developer in filteredDevelopers" :key="developer.dev_ID" :dev="developer" :can-manage="isAdmin" @edit-developer = "handleEditDeveloper" @delete-developer = "handleDeleteDeveloper" @open-listing="openListing" @open-promo="openPromo"/>
        </template>
      </div>
      <p v-if="hasLoaded && searchQuery && filteredDevelopers.length === 0" class="text-center text-sm text-gray-500 dark:text-gray-400 pb-8">No developers match your search.</p>
      <!-- EMPTY: loaded, nothing to show and no search typed -->
      <p v-else-if="hasLoaded && developers.length === 0" class="text-center text-sm text-gray-500 dark:text-gray-400 pb-8">No developers to show.</p>
    </div>
  </div>
  <!-- read-only: this page doesn't handle edit / delete / sold / approve (use Project Listings) -->
  <PropertyDetails
    v-if="selectedProject"
    :prop_id="selectedProject.listing_ID"
    :prop_type="selectedProject.property_type"
    read-only
    @closeDetails="selectedProject = null"
  />

  <!-- Promo poster lightbox: components/developer/PromoPosterModal.vue -->
  <PromoPosterModal v-if="selectedPromo" :promo="selectedPromo" @close="selectedPromo = null" />
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from "vue";
import { type Developer, type OfficeHourSlot, type DeveloperProject, type DeveloperPromo } from "@/assets/classes/developers.ts";
import { developerService } from "@/services/developerService";
import DeveloperCard from "@/components/developer/developerCard.vue";
import DeveloperCardSkeleton from "@/components/developer/DeveloperCardSkeleton.vue";
import AddDeveloperTab from "@/components/developer/addDeveloper.vue";
import PromoPosterModal from "@/components/developer/PromoPosterModal.vue";

// The listing overlay (Recent Projects chips) brings the Mapbox and jsPDF libraries, so it downloads
// when a project is first opened instead of holding up the cards (also prefetched by the router).
const PropertyDetails = defineAsyncComponent(() => import("@/components/listings/PropertyDetails.vue"));
import { authService } from "@/services/authService";
import { Plus } from "lucide-vue-next";

// Developer management (add / edit / delete, promos) is admin-only: the buttons are hidden for
// agents and the database (RLS) refuses their changes anyway.
const isAdmin = ref(false);

const developers = ref<Developer[]>([])
const devToEdit = ref<Developer | null>(null);
const selectedProject = ref<DeveloperProject | null>(null)
const selectedPromo = ref<DeveloperPromo | null>(null)
// Recent Projects chip -> the listing overlay (read-only); promo thumbnail -> the poster lightbox.
const openListing = (project: DeveloperProject) => { selectedProject.value = project }
const openPromo = (promo: DeveloperPromo) => { selectedPromo.value = promo }

// Skeleton cards are shown until the first load finishes (two rows on wide screens).
const SKELETON_CARDS = 4;
const hasLoaded = ref(false);

const loadDevelopers = async () => {
  try {
    const data = await developerService.getDevelopers();
    developers.value = data;
  } catch (error) {
    console.error("Error fetching developers:", error);
  } finally {
    hasLoaded.value = true;
  }
};

// Search box: filters the loaded developers in the browser (it was not connected before).
const searchQuery = ref('');
const filteredDevelopers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return developers.value;
  return developers.value.filter(d =>
    [d.name, d.location, d.email, d.phone].some(v => (v || '').toLowerCase().includes(q))
  );
});

const showAddDeveloper = ref(false);
const handleEditDeveloper = (developer: Developer) => {
  devToEdit.value = developer;
  showAddDeveloper.value = true;
};

// Saved in the form: close it and show the change (the form used to stay open).
const onDeveloperSaved = () => {
  showAddDeveloper.value = false;
  devToEdit.value = null;
  loadDevelopers();
};

// Asks first, waits for the delete, then reloads. (It deleted on the first click without asking
// and reloaded before the delete had finished, so the developer often stayed on the page.)
const deleteError = ref('');
const handleDeleteDeveloper = async (developer: Developer) => {
  if (!isAdmin.value) return;
  deleteError.value = '';
  if (!window.confirm(`Delete ${developer.name}? Their office hours and promo posters are deleted too. This cannot be undone.`)) return;
  try {
    await developerService.deleteDeveloper(developer);
    await loadDevelopers();
  } catch (e: any) {
    console.error('Delete developer failed:', e);
    deleteError.value = e?.message || 'The developer could not be deleted.';
  }
};
watch(showAddDeveloper, (isOpen) => {
  if (isOpen) {
    // Hide the scrollbar and prevent scrolling
    document.body.style.overflow = 'hidden';
  } else {
    // Restore the scrollbar when closed
    document.body.style.overflow = '';
  }
}); 

onMounted(async () => {
  loadDevelopers();
  isAdmin.value = !!(await authService.getCurrentAgent())?.admin_access;
});

</script>