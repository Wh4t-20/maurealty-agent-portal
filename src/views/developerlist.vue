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
  
  <div class="relative w-full bg-background-gray dark:bg-background-dark-gray pt-8 flex flex-col items-center flex-1 overflow-y-auto">

    <!--Header I think mas better if ma component ni sya-->
    <!-- Better component iff we will use the same exact design for every page -->
    <header class="fixed z-5 pl-9 flex items-center w-auto h-30 bg-linear-to-r from-[#CEE5F9] dark:from-[#031a2b] to-[#FFFFFF] dark:to-black shadow-[0_10px_15px_rgba(0,0,0,0.3)] rounded-lg">
  
      <h1 class="text-[clamp(1rem,2vw,2rem)] font-extrabold text-[#07407B] dark:text-white">
        DEVELOPERS
      </h1>

      <!-- Search -->
      <div class=" flex-1 ml-4 md:ml-20 lg:ml-62.5 max-w-87.5">
        <input type="text"placeholder="Search Developer" class=" text-[clamp(0.5rem,2vw,1rem)] w-full rounded-[10px] border border-[#1C1E76] dark:border-white dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maurealty-blue dark:focus:ring-maurealty-light-blue"/>
      </div>

      <!-- Button -->
      <div class="flex items-center gap-4 pr-9 ml-4 ">
        <button @click="showAddDeveloper = true" class="max-h-10.75 bg-maurealty-blue text-white  rounded-[10px] hover:bg-[#045fa3] flex items-center gap-2 px-[clamp(0.5rem,2vw,2.5rem)] py-[clamp(0.25rem,0.70vw,1rem)] text-[clamp(0.5rem,2vw,1rem)]">
          <span class="text-lg">+</span> Add Developer
        </button>

        <!--
        <img src="/src/assets/profile.png" class="w-[71px] h-[71px] rounded-full object-cover"/> -->
      </div>
    </header>
    
    <!-- Developer Cards -->
    <div class="w-3/4 grid grid-cols-1 lg:grid-cols-2 mt-35 gap-6 p-4">
      <DeveloperCard v-for="(developer, index) in developers" :key="index" :dev="developer" @edit-developer = "handleEditDeveloper" @delete-developer = "handleDeleteDeveloper" @open-listing="openListing"/>
    </div>
  </div>
  <PropertyDetails
    v-if="selectedProject"
    :prop_id="selectedProject.listing_ID"
    :prop_type="selectedProject.property_type"
    @closeDetails="selectedProject = null"
  />
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { type Developer, type OfficeHourSlot, type DeveloperProject } from "@/assets/classes/developers.ts";
import { developerService } from "@/services/developerService";
import DeveloperCard from "@/components/developer/developerCard.vue";
import AddDeveloperTab from "@/components/developer/addDeveloper.vue";
import PropertyDetails from "@/components/listings/PropertyDetails.vue";


const developers = ref<Developer[]>([])
const devToEdit = ref<Developer | null>(null);
const selectedProject = ref<DeveloperProject | null>(null)
const openListing = (project: DeveloperProject) => { 
  
  selectedProject.value = project
  console.log('OPENED LISTING: ', selectedProject.value, '        ', project)

 }
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