<template>
    <div v-if="details" class="absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <div class="custom-scrollbar bg-white w-10/12 h-11/12 rounded-3xl shadow-2xl border border-gray-100 px-10 py-7 overflow-y-auto">
        <header class="relative mb-4">
          <h1 class="text-3xl max-w-19/20 font-extrabold text-maurealty-blue">
            {{ details.description }}
          </h1>

          <!-- Reminder: add functionality to close -->
          <button class="absolute top-0 right-0">
            <img :src="exit_icon" class="fill-maurealty-blue" />
          </button>
        </header>

        <hr width="100%" class="mb-4 text-maurealty-blue/30">

        <main class="flex gap-12 mx-4">
          
          <div class="grow w-3/5 flex flex-col gap-6">
            
            <div class="relative flex gap-4 items-center">
              <div class="relative grow aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                <img 
                  :src="house1"
                  alt="Property Main View" 
                  class="absolute inset-0 w-full h-full object-contain"
                />
              </div>

              <!-- Reminder: add functionality to move -->
              <button class="absolute left-0 -ml-5 w-8 h-18 bg-slate-500/30 backdrop-blur-xs self-center rounded flex items-center justify-center text-black text-4xl hover:bg-slate-500/60">
                &lt;
              </button>

              <button class="absolute right-0 -mr-5 w-8 h-18 bg-slate-500/30 backdrop-blur-xs self-center rounded flex items-center justify-center text-black text-4xl hover:bg-slate-500/60">
                &gt;
              </button>
            </div>

            <div class="flex gap-4">
              <img 
                v-for="(thumb, index) in thumbnails" 
                :key="index"
                :src="thumb" 
                alt="Property thumbnail" 
                class="w-32 h-24 rounded-lg object-cover cursor-pointer hover:ring-2 hover:ring-maurealty-blue"
              />
            </div>
          </div>

          <div class="w-2/5 flex flex-col gap-2 text-gray-800 text-lg">
            <span class="inline-block bg-maurealty-green w-fit text-2xl text-white px-4 py-0.5 rounded-full tracking-wider mt-0.5">
              ₱ {{ details.price.toLocaleString() }}
            </span>

            <span class="flex items-center gap-1.5 font-semibold">
              <img :src="property_type_icon" class="size-6" />
              {{ details.property_type }}
            </span>

            <span class="flex items-center gap-1.5 font-semibold">
              <img :src="location_icon" class="size-6" />
              {{ details.location }}
            </span>

            <span class="flex items-center gap-1.5">
              <img :src="agent_icon" class="size-6" />
              <p>{{ details.agent_name }}</p>
              <p class="italic text-gray-700">- {{ details.commission }}% Commision</p>
            </span>
            
            <p class="text-sm text-gray-500">Created on: {{ details.created_at.toLocaleDateString() }}</p>

            <span class="flex flex-col items-left mt-2">
              <p class="font-semibold text-xl">Developed by:</p>
              <p class="ml-4">{{ details.developer_name }}</p>
            </span>
          </div>
        </main>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { type Property } from '@/assets/classes/listings'
import house1 from '@/assets/images/sample-house.jpg'
import house2 from '@/assets/images/house2.webp'

import exit_icon from '@/assets/images/exit-icon.svg'

import property_type_icon from '@/assets/images/property-type-icon.svg'
import location_icon from '@/assets/images/location-icon.svg'
import agent_icon from '@/assets/images/agent-icon.svg'

// 2. State definition: Start as null to represent the "not loaded" state
const details = ref<Property | null>(null)

const thumbnails = ref([house1, house2]);

const loadProperties = () => {
  // 4. Correct Assignment: Assign a single object, not an array
  details.value = { 
    listing_id: 1, 
    agent_name: 'Carl Santillan', 
    property_type: 'House And Lot', 
    price: 150000, 
    commission: 5, 
    location: 'Cebu City', 
    description: 'Pre-selling Single Attached House and Lot in Talamban, Cebu / Metropolis Subdivision', 
    created_at: new Date('2005-09-18T11:49:36'), 
    is_active: true,
    developer_name: 'Ayala'
  }
}

onMounted(() => {
  loadProperties()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background-color: transparent;
  margin-block: 25px;
}

/* Style the draggable thumb */
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #1E3A8A; 
  border-radius: 9999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #172b66; 
}
</style>