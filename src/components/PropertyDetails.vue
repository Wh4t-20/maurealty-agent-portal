<template>
    <div v-if="details" class="absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <div class="bg-white w-10/12 h-11/12 rounded-3xl shadow-2xl border border-gray-100 px-10 py-7">
        <header class="mb-4">
          <h1 class="text-3xl font-extrabold text-maurealty-blue">
            {{ details.description }}
          </h1>
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

          <div class="w-2/5 flex flex-col gap-3 text-gray-800">
            <span class="inline-block bg-maurealty-green w-fit text-2xl text-white px-4 py-0.5 rounded-full tracking-wider mt-0.5">
              ₱ {{ details.price.toLocaleString() }}
            </span>

            <div>Location: {{ details.location }}</div>
            <div>Agent: {{ details.agent_id }}</div>
            <div>Type: {{ details.property_type }}</div>
            <div>Price: {{ details.price }}</div>
            <div>Commission: {{ details.commission }}</div>
            <div>Created at: {{ details.created_at }}</div>
            <div>Developer: {{ details.developer_name }}</div>
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
import profile from '@/assets/images/profile.png'

// 2. State definition: Start as null to represent the "not loaded" state
const details = ref<Property | null>(null)

const thumbnails = ref([house1, house2]);

const loadProperties = () => {
  // 4. Correct Assignment: Assign a single object, not an array
  details.value = { 
    listing_id: 1, 
    agent_id: 1, 
    property_type: 'House And Lot', 
    price: 150000, 
    commission: 5, 
    location: 'Cebu City', 
    description: 'Modern House in the Heart of Cebu', 
    created_at: new Date('2024-11-10T11:49:36'), 
    is_active: true,
    developer_name: 'Ayala'
  }
}

onMounted(() => {
  loadProperties()
})
</script>