<template>
    <div class="min-h-screen w-full bg-[#F3F3F3] pt-8 flex flex-col items-center">
  
      <!-- MAIN CONTAINER -->
      <div class="w-full max-w-[1100px] px-4">
  
        <!-- HEADER -->
        <div class="flex items-center justify-between h-[110px] px-6 mb-6
                    bg-gradient-to-r from-[#A9D6FF70] to-[#FFFFFF] 
                    shadow-[0_10px_15px_rgba(0,0,0,0.15)] rounded-[12px]">
  
          <!-- TITLE -->
          <h1 class="text-[clamp(1.2rem,2vw,2rem)] font-extrabold text-[#07407B]">
            GENEALOGY
          </h1>
  
          <!-- SEARCH -->
          <div class="flex-1 mx-6 max-w-[350px]">
            <input 
              type="text"
              placeholder="Search Agent"
              class="w-full rounded-[10px] border border-[#1C1E76] px-3 py-2 
                     text-[clamp(0.7rem,1vw,1rem)]
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
  
          <!-- ACTIONS -->
          <div class="flex items-center gap-4">
            <button class="flex items-center gap-2 bg-[#07407B] text-white 
                           px-4 py-2 rounded-[10px] hover:bg-blue-700 text-sm">
              <span class="text-lg">+</span>
              Add Agent
            </button>
  
            <img 
              src="/src/assets/images/profile.png" 
              class="w-[45px] h-[45px] rounded-full object-cover border"
            />
          </div>
        </div>
  
        <!-- STATS -->
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="bg-[#C8DDF64A] p-4 rounded-xl shadow border-l-4 border-blue-500">
            Total Agents<br><b>300</b>
          </div>
          <div class="bg-[#c8ddf6b7] p-4 rounded-xl border-l-4 border-blue-500 shadow">
            Team Leaders<br><b>50</b>
          </div>
          <div class="bg-[#c8ddf6b7] p-4 rounded-xl border-l-4 border-blue-500 shadow">
            Active Teams<br><b>60</b>
          </div>
          <div class="bg-[#c8ddf6b7] p-4 rounded-xl border-l-4 border-blue-500 shadow">
            New This Month<br><b>0</b>
          </div>
        </div>
  
        <!-- CONTENT -->
        <section class="custom-scrollbar h-full overflow-y-auto">
        <div class="grid grid-cols-2 gap-6">
          
          <!-- TOP TEAM -->
          <div class="bg-white p-8 rounded-xl shadow">
            <h2 class="font-bold mb-4">TOP PERFORMING TEAM</h2>
  
            <div v-for="i in 5" :key="i" 
                 class="flex justify-between p-3 bg-[#C8DDF64A] rounded mb-2">
              <div>
                Cole Andrei Unson's Team<br>
                <span class="text-sm text-gray-500">8 Members</span>
              </div>
  
              <div class="text-right">
                <div class="text-blue-600 font-bold">₱12.5M</div>
                <div class="text-green-500 text-sm">+12%</div>
              </div>
            </div>
          </div>
          
          <!-- RECENT -->
          <div class="bg-white p-8 rounded-xl shadow">
            <h2 class="font-bold mb-4">RECENTLY ADDED</h2>
  
            <div v-for="i in 5" :key="i" 
                 class="flex justify-between p-3 bg-[#C8DDF64A] rounded mb-2">
              <div>
                Kenji Bad Boyboy<br>
                <span class="text-sm text-gray-500">Team: Kat Kat Kat</span>
              </div>
  
              <div class="text-right">
                <div class="text-sm text-gray-500">2 Days Ago</div>
                <div class="text-green-600 text-sm">Active</div>
              </div>
            </div>
          </div>
        
        </div>
      </section>
  
      </div>
    </div>
  </template>
<script lang="ts">
//import { computed } from 'vue' // Don't forget to import this
//import { type Genealogy }  from '@/assets/classes/genealogy'

//const props = defineProps<{ details: Genealogy }>()

</script>


<style scoped>
</style>