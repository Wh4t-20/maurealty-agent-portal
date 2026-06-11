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
      <AddDeveloperTab v-if="showAddDeveloper" @close-add-developer="showAddDeveloper = false"/>
  </transition>
  
  <div class="relative w-full bg-background-gray pt-8 flex flex-col items-center flex-1 overflow-y-auto">

    <!--Header I think mas better if ma component ni sya-->
    <!-- Better component iff we will use the same exact design for every page -->
    <header class="fixed z-5 pl-9 flex items-center w-full max-w-264.25 h-30 bg-linear-to-r from-[#CEE5F9] to-[#FFFFFF] shadow-[0_10px_15px_rgba(0,0,0,0.3)] rounded-lg">
  
      <h1 class="text-[clamp(1rem,2vw,2rem)] font-extrabold text-[#07407B]">
        DEVELOPERS
      </h1>

      <!-- Search -->
      <div class=" flex-1 ml-4 md:ml-62.5  max-w-87.5">
        <input type="text"placeholder="Search Developer" class=" text-[clamp(0.5rem,2vw,1rem)] w-full rounded-[10px] border border-[#1C1E76] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maurealty-blue"/>
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
    <div class="w-3/4 grid grid-cols-1 md:grid-cols-2  mt-35 gap-6 p-4">
      <DeveloperCard v-for="(developer, index) in developers" :key="index" :dev="developer" />
    </div>
  </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { type Developer } from "@/assets/classes/developers.ts";
import { developerService } from "@/services/developerService";
import DeveloperCard from "@/components/developer/developerCard.vue";
import AddDeveloperTab from "@/components/developer/addDeveloper.vue";

const developers = ref<Developer[]>([])
const loadDevelopers = async () => {
  try {
    const data = await developerService.getDevelopers();
    developers.value = data;
  } catch (error) {
    console.error("Error fetching developers:", error);
  }

};

const showAddDeveloper = ref(false);

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