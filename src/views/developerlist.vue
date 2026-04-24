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
        <button @click = "isModalOpen = true" class="max-h-10.75  bg-[#07407B] text-white  rounded-[10px] hover:bg-blue-700 flex items-center gap-2 px-[clamp(0.5rem,2vw,2.5rem)] py-[clamp(0.25rem,0.70vw,1rem)] text-[clamp(0.5rem,2vw,1rem)]">
          <span class="text-lg">+</span> Add Developer
        </button>

        <!--
        <img src="/src/assets/profile.png" class="w-[71px] h-[71px] rounded-full object-cover"/> -->
      </div>
    </header>
        

    <!-- Developer Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2  mt-[50px] gap-6 p-4">
    <div v-for="(developer, index) in developers" :key="index" class="bg-white p-6 rounded-[15px] shadow-lg  w-full max-w-[502px] hover:shadow-[0_10px_15px_rgba(2,5,5.1,0.3)] transition-shadow">
     
      <!-- Profile -->
      <div class="flex items-center gap-4 mb-4 ">
       
        <img :src="developer.profile_url" class="w-16 h-16 rounded-full object-cover"/>
        <div>
          <h2 class="font-bold text-lg">{{ developer.name }}</h2>
          <span class="bg-[#41BE0126] text-[#41BE01] text-xs font-semibold px-2 py-1 rounded">Active</span>
        </div>
      </div>

      <!-- Contact info -->
      <div class="grid mt-10 break-all text-[clamp(1rem,1vw,1.5rem)] grid-cols-1 md:grid-cols-2 px-1 gap-2 mb-4 text-gray-700">
        <div class="flex items-center gap-2"> {{ developer.contact_number }}</div>
        <div class="flex items-center gap-2">{{ developer.contact_email }}</div>
        <div class="flex items-center gap-2"> {{ developer.location }}</div>
        <div class="flex items-start gap-2">
          {{ developer.available_days }} {{ formatToAMPM(developer.open_hours) }} - {{ formatToAMPM(developer.close_hours) }}
        </div>
      </div>

      <!-- Recent Projects -->
      <div class="mb-4">
        <p class="font-semibold text-sm mb-1"></p>
        <div class="flex gap-2 flex-wrap">
          <!-- <span v-for="(project, i) in developer.projects" :key="i" class="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">{{ project }}
          </span> -->
        </div>
      </div>

      <!-- buttons -->
      <div class="flex gap-2 items-end justify-end">
        <button @click = "editDev = developer; isModalOpen = true" class="text-[clamp(0.75rem,2vw,1rem)] md:h-[36px] md:w-[108px] h-max-[36px] w-max-[108px]  border border-[#B4AFAF] rounded-[5px] px-4 py-2 hover:bg-gray-100 flex items-center gap-2 justify-center" >
          Edit
        </button>
        <button class="text-[clamp(0.75rem,2vw,1rem)] w-max-[121px] md:h-[36px] md:w-[121px] bg-[#07407B] text-white rounded-[5px] px-4 py-2 hover:bg-blue-700 flex items-center gap-2 justify-center">
          Contact
        </button>
      </div>
    </div>
  </div>
  </div>
  
  <!-- the input fields will be empty if add developer is clicked, but will have
   developer data if edit data is clicked
   also might need a more appropriate name for this component but haven't thought of anything yet -->
  <addDeveloper :developerData ="editDev" v-if="isModalOpen" 
  @close= "isModalOpen = false; editDev = undefined"
  @save = "handleModalSave" 
  />
  
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { type Developer} from "@/assets/classes/developers.ts";
import { developerService } from "@/services/developerService";
import addDeveloper from "@/components/addDeveloper.vue";
const developers = ref<Developer[]>([]);
const editDev = ref<Developer | undefined>(undefined);
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
const formatToAMPM = (timeStr: any): string => { // Helper function to format time from supabase default to AM/PM format
  if (!timeStr) return '';
  
  const [hoursStr, minutes, useless] = timeStr.split(':');
  let hours = parseInt(hoursStr);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours > 12 ? hours % 12 : hours; 
  return `${hours}:${minutes} ${ampm}`;
}; 
const isModalOpen = ref(false);
const handleModalSave = async (developer: Developer) => {
  if(developer.dev_ID){
    await developerService.updateDeveloper(developer);
  }
  else{
    await developerService.addDeveloper(developer);
  }
};

</script>