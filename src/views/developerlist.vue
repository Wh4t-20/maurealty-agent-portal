<template>
  <div class="min-h-screen w-full bg-background-gray pt-8 px-4 flex flex-col items-center">

    <!--Header I think mas better if ma component ni sya-->
    <header class="pl-9 flex items-center w-full max-w-264.25 h-30 bg-linear-to-r from-[#A9D6FF70] to-[#FFFFFF] shadow-[0_10px_15px_rgba(0,0,0,0.3)] rounded-lg">
  
      <h1 class="text-[clamp(1rem,2vw,2rem)] font-extrabold text-[#07407B]">
        DEVELOPERS
      </h1>

      <!-- Search -->
      <div class=" flex-1 ml-4 md:ml-62.5  max-w-87.5">
        <input type="text"placeholder="Search Developer" class=" text-[clamp(0.5rem,2vw,1rem)] w-full rounded-[10px] border border-[#1C1E76] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
      </div>

      <!-- Button -->
      <div class="flex items-center gap-4 pr-9 ml-4 ">
        <button class="max-h-10.75  bg-[#07407B] text-white  rounded-[10px] hover:bg-[#045fa3] flex items-center gap-2 px-[clamp(0.5rem,2vw,2.5rem)] py-[clamp(0.25rem,0.70vw,1rem)] text-[clamp(0.5rem,2vw,1rem)]">
          <span class="text-lg">+</span> Add Developer
        </button>

        <!--
        <img src="/src/assets/profile.png" class="w-[71px] h-[71px] rounded-full object-cover"/> -->
      </div>
    </header>
        

    <!-- Developer Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2  mt-12.5 gap-6 p-4">
      <DeveloperCard v-for="(developer, index) in developers" :key="index" :dev="developer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { type Developer } from "@/assets/classes/developers.ts";
import { developerService } from "@/services/developerService";
import DeveloperCard from "@/components/developer/developerCard.vue";

const developers = ref<Developer[]>([])
const loadDevelopers = async () => {
  try {
    const data = await developerService.getDevelopers();
    developers.value = data;
  } catch (error) {
    console.error("Error fetching developers:", error);
  }

};

onMounted(() => {
  loadDevelopers();

});

</script>