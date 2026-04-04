<template>
  <div class="min-h-screen bg-[#F3F3F3] pt-8 px-4 flex flex-col items-center">

    <!--Header I think mas better if ma component ni sya-->
    <div class="pl-9 flex items-center w-full max-w-[1057px] h-[120px] bg-gradient-to-r from-[#A9D6FF70] to-[#FFFFFF] shadow-[0_10px_15px_rgba(0,0,0,0.3)] rounded-[10px]">

  
      <h1 class="text-[clamp(1rem,2vw,2rem)] font-extrabold text-[#07407B]">
        DEVELOPERS
      </h1>

      <!-- Search -->
      <div class=" flex-1 ml-4 md:ml-[250px]  max-w-[350px]">
        <input type="text"placeholder="Search Developer" class=" text-[clamp(0.5rem,2vw,1rem)] w-full rounded-[10px] border border-[#1C1E76] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
      </div>

      <!-- Button -->
      <div class="flex items-center gap-4 pr-9 ml-4 ">
        <button class="max-h-[43px] max-w-[200px] bg-[#07407B] text-white  rounded-[10px] hover:bg-blue-700 flex items-center gap-2 px-[clamp(0.5rem,2vw,2.5rem)] py-[clamp(0.25rem,0.70vw,1rem)] text-[clamp(0.5rem,2vw,1rem)]">
          <span class="text-lg">+</span> Add Developer
        </button>

        <!--
        <img src="/src/assets/profile.png" class="w-[71px] h-[71px] rounded-full object-cover"/> -->
      </div>
    </div>
        

    <!-- Developer Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2  mt-[50px] gap-6 p-4">
    <div v-for="(developer, index) in developers" :key="index" class="bg-white p-6 rounded-[15px] shadow-lg  w-full max-w-[502px]  hover:shadow-[0_10px_15px_rgba(2,5,5.1,0.3)] transition-shadow">
     
      <!-- Profile -->
      <div class="flex items-center gap-4 mb-4 ">
        <img :src="developer.logo"  class="w-16 h-16 rounded-full object-cover"/>
        <div>
          <h2 class="font-bold text-lg">{{ developer.name }}</h2>
          <span class="bg-[#41BE0126] text-[#41BE01] text-xs font-semibold px-2 py-1 rounded">Active</span>
        </div>
      </div>

      <!-- Contact info -->
      <div class="grid mt-10 break-all text-[clamp(1rem,1vw,1.5rem)] grid-cols-1 md:grid-cols-2 px-1 gap-2 mb-4 text-gray-700">
        <div class="flex items-center gap-2"> {{ developer.phone }}</div>
        <div class="flex items-center gap-2">{{ developer.email }}</div>
        <div class="flex items-center gap-2"> {{ developer.location }}</div>
        <div class="flex items-start gap-2">
          <div v-html="developer.hours" class="leading-tight">
          </div>
        </div>
      </div>

      <!-- Recent Projects -->
      <div class="mb-4">
        <p class="font-semibold text-sm mb-1">Recent Projects</p>
        <div class="flex gap-2 flex-wrap">
          <span v-for="(project, i) in developer.projects" :key="i" class="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">{{ project }}
          </span>
        </div>
      </div>

      <!-- buttons -->
      <div class="flex gap-2 items-end justify-end">
        <button class="text-[clamp(0.75rem,2vw,1rem)] md:h-[36px] md:w-[108px] h-max-[36px] w-max-[108px]  border border-[#B4AFAF] rounded-[5px] px-4 py-2 hover:bg-gray-100 flex items-center gap-2 justify-center">
          Edit
        </button>
        <button class="text-[clamp(0.75rem,2vw,1rem)] w-max-[121px] md:h-[36px] md:w-[121px] bg-[#07407B] text-white rounded-[5px] px-4 py-2 hover:bg-blue-700 flex items-center gap-2 justify-center">
          Contact
        </button>
      </div>
    </div>
  </div>
  </div>

  
</template>

<script setup lang="ts">
import { reactive } from "vue";

const developers = reactive([
  {
    logo: "profile.png",
    name: "Ayala Land Inc.",
    phone: "09325660619",
    email: "ahmanlangit@up.edu.ph",
    location: "Lahug, Cebu City",
    hours: "Monday - Friday <br> 9:00 AM - 6:00 PM",
    projects: ["Ayala", "Ayala", "Ayala"],
  },
  {
    logo: "profile.png",
    name: "Ayala Land Inc.",
    phone: "09325660619",
    email: "ahmanlangit@up.edu.ph",
    location: "Lahug, Cebu City",
    hours: "Monday - Friday <br> 9:00 AM - 6:00 PM",
    projects: ["Ayala", "Ayala", "Ayala"],
  },
  {
    logo: "profile.png",
    name: "Ayala Land Inc.",
    phone: "09325660619",
    email: "ahmanlangit@up.edu.ph",
    location: "Lahug, Cebu City",
    hours: "Monday - Friday <br> 9:00 AM - 6:00 PM",
    projects: ["Ayala", "Ayala", "Ayala"],
  },
  {
    logo: "profile.png",
    name: "Ayala Land Inc.",
    phone: "09325660619",
    email: "ahmanlangit@up.edu.ph",
    location: "Lahug, Cebu City",
    hours: "Monday - Friday <br> 9:00 AM - 6:00 PM",
    projects: ["Ayala", "Ayala", "Ayala"],
  },
  {
    logo: "profile.png",
    name: "Ayala Land Inc.",
    phone: "09325660619",
    email: "ahmanlangit@up.edu.ph",
    location: "Lahug, Cebu City",
    hours: "Monday - Friday <br> 9:00 AM - 6:00 PM",
    projects: ["Ayala", "Ayala", "Ayala"],
  },{
    logo: "profile.png",
    name: "Ayala Land Inc.",
    phone: "09325660619",
    email: "ahmanlangit@up.edu.ph",
    location: "Lahug, Cebu City",
    hours: "Monday - Friday <br> 9:00 AM - 6:00 PM",
    projects: ["Ayala", "Ayala", "Ayala"],
  },
  
]);
</script>