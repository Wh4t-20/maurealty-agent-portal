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
      <AddDeveloperTab  v-if="showAddDeveloper" @close-add-developer="showAddDeveloper = false; devToEdit = null" :dev = "devToEdit? devToEdit : undefined"/>
  </transition>
  
  <div class="relative w-full bg-background-gray dark:bg-background-dark-gray flex flex-col flex-1 overflow-hidden">

    <!-- Same header style as the Project Listings page so every page looks consistent -->
    <header class="flex flex-col py-5 px-4 sm:px-10 w-full bg-linear-to-r from-[#A9D6FF70] dark:from-[#041d3070] to-[#FFFFFF] dark:to-black text-maurealty-blue dark:text-white shadow-md sticky top-0 z-20">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-2">
        <h1 class="text-xl sm:text-3xl font-bold">DEVELOPERS</h1>

        <div class="flex gap-3 sm:gap-5 w-full sm:w-auto">
          <button @click="showAddDeveloper = true" class="flex items-center gap-1 bg-maurealty-blue text-md text-white px-4 py-1.5 rounded-full cursor-pointer hover:opacity-70 transition-opacity whitespace-nowrap">
            <Plus class="size-4" /> Add Developer
          </button>
          <input type="text" placeholder="Search Developer"
            class="block min-w-0 flex-1 sm:flex-none py-1.5 pr-3 pl-2 text-base placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:text-white border border-blue-950 dark:border-blue-50 rounded-sm focus:outline-none sm:text-sm/6" />
        </div>
      </div>
    </header>

    <!-- Developer Cards -->
    <div class="flex-1 overflow-y-auto">
      <div class="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-8">
        <DeveloperCard v-for="(developer, index) in developers" :key="index" :dev="developer" @edit-developer = "handleEditDeveloper" @delete-developer = "handleDeleteDeveloper" @open-listing="openListing" @open-promo="openPromo"/>
      </div>
    </div>
  </div>
  <PropertyDetails
    v-if="selectedProject"
    :prop_id="selectedProject.listing_ID"
    :prop_type="selectedProject.property_type"
    @closeDetails="selectedProject = null"
  />

  <!-- Promo poster lightbox -->
  <div v-if="selectedPromo" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" @click.self="selectedPromo = null">
    <div class="relative max-w-3xl w-full max-h-full flex flex-col items-center">
      <button class="absolute -top-3 -right-3 bg-white text-black p-2 rounded-full shadow hover:bg-gray-200 transition cursor-pointer" @click="selectedPromo = null">
        <XIcon class="size-5" stroke-width="3" />
      </button>
      <img :src="selectedPromo.image_url" :alt="selectedPromo.title" class="max-h-[80vh] w-auto rounded-xl object-contain" />
      <div v-if="selectedPromo.title || selectedPromo.valid_until" class="mt-3 text-center text-white">
        <p v-if="selectedPromo.title" class="font-semibold text-lg">{{ selectedPromo.title }}</p>
        <p v-if="selectedPromo.valid_until" class="text-sm text-gray-300">Valid until {{ selectedPromo.valid_until }}</p>
      </div>
    </div>
  </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { type Developer, type OfficeHourSlot, type DeveloperProject, type DeveloperPromo } from "@/assets/classes/developers.ts";
import { developerService } from "@/services/developerService";
import DeveloperCard from "@/components/developer/developerCard.vue";
import AddDeveloperTab from "@/components/developer/addDeveloper.vue";
import PropertyDetails from "@/components/listings/PropertyDetails.vue";
import { Plus, XIcon } from "lucide-vue-next";


const developers = ref<Developer[]>([])
const devToEdit = ref<Developer | null>(null);
const selectedProject = ref<DeveloperProject | null>(null)
const selectedPromo = ref<DeveloperPromo | null>(null)
const openListing = (project: DeveloperProject) => {

  selectedProject.value = project
  console.log('OPENED LISTING: ', selectedProject.value, '        ', project)

 }
const openPromo = (promo: DeveloperPromo) => { selectedPromo.value = promo }
const loadDevelopers = async () => {
  try {
    const data = await developerService.getDevelopers();
    developers.value = data;
  } catch (error) {
    console.error("Error fetching developers:", error);
  }

};

const showAddDeveloper = ref(false);
const handleEditDeveloper = (developer: Developer) => {
  devToEdit.value = developer;
  showAddDeveloper.value = true;
};
const handleDeleteDeveloper = (developer: Developer) => {
  developerService.deleteDeveloper(developer);
  loadDevelopers(); 
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

onMounted(() => {
  loadDevelopers();

});

</script>