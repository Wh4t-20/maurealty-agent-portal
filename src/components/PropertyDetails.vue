<template>
    <div v-if="details" class="absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <div class="custom-scrollbar bg-white w-10/12 h-11/12 rounded-3xl shadow-2xl border border-gray-100 px-10 py-7 overflow-y-auto">
        <header class="relative mb-4">
          <h1 class="text-3xl max-w-19/20 font-extrabold text-maurealty-blue">
            {{ details.listing_title }}
          </h1>

          <!-- Reminder: add functionality to close -->
          <button class="absolute top-0 right-0">
            <XIcon class="size-7.5" stroke-width="3"/>
          </button>
        </header>

        <hr width="100%" class="mb-4 text-maurealty-blue/30">

        <main class="flex gap-12 mx-4">
          
          <div class="grow w-3/5 flex flex-col gap-6">
            
            <div class="relative flex gap-4 items-center">
              <div class="relative grow aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                <img 
                  :src="house2"
                  alt="Property Main View" 
                  class="absolute inset-0 w-full h-full object-contain"
                />
              </div>

              <!-- Reminder: add functionality to move -->
              <button class="absolute left-2 w-8 h-18 bg-slate-500/30 backdrop-blur-xs self-center rounded flex items-center justify-center text-black text-4xl hover:bg-slate-500/60 hover:text-maurealty-blue">
                <ChevronLeft stroke-width=2.75 />
              </button>

              <button class="absolute right-2 w-8 h-18 bg-slate-500/30 backdrop-blur-xs self-center rounded flex items-center justify-center text-black text-4xl hover:bg-slate-500/60 hover:text-maurealty-blue">
                <ChevronRight stroke-width=2.75 />
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
              <Building2Icon class="size-6" color="#000000" />
              {{ formattedPropertyType(details.property_type) }}
            </span>

            <span class="flex items-center gap-1.5 font-semibold">
              <MapPinIcon class="size-6" color="#000000" />
              {{ details.location }}
            </span>

            <span class="flex items-center gap-1.5">
              <UserStarIcon class="size-6" color="#000000" />
              <p>{{ details.agent_name }}</p>
              <p class="italic text-gray-700">- {{ details.commission }}% Commision</p>
            </span>
            
            <p class="text-sm text-gray-500">Created on: {{ details.created_at.toLocaleDateString() }}</p>

            <span class="flex items-center-safe mt-2 text-xl">
              <p class="font-semibold">Developed by:</p>
              <p class="ml-2.5">{{ details.developer_name }}</p>
            </span>
            
            <!-- Property details -->
            <!-- House and Lot -->
            <template v-if="details.property_type === 'house_and_lot'">
              <fieldset class="border border-maurealty-blue/20 rounded-xl px-4 py-2 w-full">
                <legend class="px-2 font-semibold text-maurealty-blue">House and Lot Features</legend>
                <main class="text-sm px-2 flex flex-col">
                  <div class="grid grid-cols-2 gap-y-0.5">
                    <span class="flex items-center-safe gap-1"><LandPlot /> <b> Lot Area: </b> {{ details.lot_area }} sqm</span>
                    <span class="flex items-center-safe gap-1"><SquareDashed /> <b> Floor Area: </b> {{ details.floor_area }} sqm</span>
                    <span class="flex items-center-safe gap-1"><Sofa /> {{ details.room_count }} room{{ details.room_count != 1 ? 's' : '' }}</span>
                    <span class="flex items-center-safe gap-1"><Toilet /> {{ details.toilet_count }} toilet{{ details.toilet_count != 1 ? 's' : '' }}</span>
                  </div>
                  
                  <span class="flex items-center-safe justify-around pr-2 mt-3">
                    <p class="flex items-center-safe gap-1" v-if="details.helper_room_count > 0">
                      <BrushCleaning class="size-4" /> {{ details.helper_room_count }} helper room{{ details.helper_room_count != 1 ? 's' : '' }}
                    </p>
                    <p v-if="details.driver_room_count > 0 || details.carpark_count > 0">|</p>
                    <p class="flex items-center-safe gap-1" v-if="details.driver_room_count > 0">
                      <LifeBuoy class="size-3" /> {{ details.driver_room_count }} driver room{{ details.driver_room_count != 1 ? 's' : '' }}
                    </p>
                    <p v-if="details.carpark_count > 0">|</p>
                    <p class="flex items-center-safe gap-1" v-if="details.carpark_count > 0">
                      <Car class="size-4" /> {{ details.carpark_count }} carpark{{ details.carpark_count != 1 ? 's' : '' }}
                    </p>
                  </span>

                  <div class="mt-3">
                    <ul class="grid grid-cols-3">
                      <li v-if="details.one_storey" class="flex items-center-safe gap-1"><Check class="size-5" /> One Storey</li>
                      <li v-if="details.two_storey" class="flex items-center-safe gap-1"><Check class="size-5" /> Two Storey</li>
                      <li v-if="details.with_loft" class="flex items-center-safe gap-1"><Check class="size-5" /> With Loft</li>
                      <li v-if="details.townhome" class="flex items-center-safe gap-1"><Check class="size-5" /> Townhome</li>
                      <li v-if="details.rowhouse" class="flex items-center-safe gap-1"><Check class="size-5" /> Rowhouse</li>
                    </ul>
                  </div>
                </main>
              </fieldset>
            </template>

            <!-- Lot only -->
            <template v-if="details.property_type === 'lot_only'">
              <fieldset class="border border-maurealty-blue/20 rounded-xl px-4 py-2 w-full">
                <legend class="px-2 font-semibold text-maurealty-blue">Lot Features</legend>
                <main class="text-sm px-2 flex flex-col">
                  <div class="grid grid-cols-2">
                    <div>
                      <span class="flex items-center-safe gap-1"><CircleSmall class="size-3.5" /> Block No. <b>{{ details.block_number }}</b></span>
                      <span class="flex items-center-safe gap-1"><CircleSmall class="size-3.5" /> Lot No. <b>{{ details.lot_number }}</b></span>
                      <span class="flex items-center-safe gap-1"><CircleSmall class="size-3.5" /> Phase No. <b>{{ details.phase_number }}</b></span>  
                    </div>
                    <div>
                      <span class="flex items-center-safe gap-1"><SquareDashed /> {{ details.area }} sqm</span>
                    </div>
                  </div>
                  
                  <div class="mt-2 pb-2 flex gap-2">
                    <p class="font-bold text-xl text-maurealty-blue">Class:</p>
                    <p class="text-xl">{{ details.class }}</p>
                  </div>
                </main>
              </fieldset>
            </template>

            <!-- Condominium -->
            <template v-if="details.property_type === 'condominium'">
              <fieldset class="border border-maurealty-blue/20 rounded-xl px-4 py-2 w-full">
                <legend class="px-2 font-semibold text-maurealty-blue">Condominium Features</legend>
                <main class="text-sm px-2 flex flex-col">
                  <div class="grid grid-cols-2">
                    <span class="flex items-center-safe gap-1"><Hash /> Unit No. <b>{{ details.unit_number }}</b></span>
                    <span class="flex items-center-safe gap-1"><BedDouble /> {{ details.bedroom_count }} bedroom{{ details.carpark_count != 1 ? 's' : '' }}</span>
                    <span class="flex items-center-safe gap-1"><BookImage /> {{ details.balcony_count }} balcon{{ details.carpark_count != 1 ? 'ies' : 'y' }}</span>
                    <span class="flex items-center-safe gap-1"><Car /> {{ details.carpark_count }} carpark{{ details.carpark_count != 1 ? 's' : '' }}</span>
                  </div>
                  
                  <div class="mt-2 flex gap-2">
                    <p class="font-bold text-xl text-maurealty-blue">Class:</p>
                    <p class="text-xl">{{ details.class }}</p>
                  </div>

                  <div class="pb-2 flex gap-2">
                    <p class="font-bold text-xl text-maurealty-blue">Type:</p>
                    <p class="text-xl">{{ getCondoType() }}</p>
                  </div>
                </main>
              </fieldset>
            </template>

            <!-- Memorial -->
            <template v-if="details.property_type === 'memorial'">
              <fieldset class="border border-maurealty-blue/20 rounded-xl px-4 py-2 w-full">
                <legend class="px-2 font-semibold text-maurealty-blue">Memorial Features</legend>
                <main class="text-sm px-2 flex flex-col">
                  <div class="pb-2 flex gap-2">
                    <p class="font-bold text-xl text-maurealty-blue">Type:</p>
                    <p class="text-xl">{{ getMemorialType() }}</p>
                  </div>
                </main>
              </fieldset>
            </template>

            <!-- Description -->
            <section class="mt-2 text-base">
              {{ details.description }}
            </section>
          </div>
        </main>

        <!-- EDIT and DELETE button -->
         <!-- Note: if you wanna put it in the right side just put justify-end in section class -->
        <section class="w-full flex mt-4 px-3 gap-4">
          <button class="flex flex-col items-center py-2 px-5 w-32 rounded-full border-2 border-maurealty-blue text-maurealty-blue font-bold hover:bg-maurealty-blue hover:text-white hover:shadow-md hover:-translate-y-0.75 transition">
            <span class="flex items-center-safe gap-1"><SquarePen class="size-4" /> EDIT</span>
          </button>

          <button class="flex flex-col items-center py-2 px-5 w-32 rounded-full border-2 border-red-600 text-red-600 font-bold hover:bg-red-600 hover:text-white hover:shadow-md hover:-translate-y-0.75 transition">
            <span class="flex items-center-safe gap-1"><Trash2 class="size-4" /> DELETE</span>
          </button>
        </section>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { type Property, formattedPropertyType } from '@/assets/classes/listings'

import house1 from '@/assets/images/sample-house.jpg'
import house2 from '@/assets/images/house2.webp'

import { XIcon, Building2Icon, MapPinIcon, UserStarIcon, ChevronLeft, ChevronRight, LandPlot, SquareDashed, Sofa, Toilet, BrushCleaning, Car, LifeBuoy, Check, CircleSmall, BedDouble, BookImage, Hash, Trash2, SquarePen } from "lucide-vue-next";

const props = defineProps<{ prop_id: number }>()

// 2. State definition: Start as null to represent the "not loaded" state
const details = ref<Property | null>(null)

const thumbnails = ref([house1, house2]);

const loadProperties = () => {
  // 4. Correct Assignment: Assign a single object, not an array
  details.value = { 
    listing_id: 1,
    listing_title: 'Pre-selling Single Attached House and Lot in Talamban, Cebu / Metropolis Subdivision', 
    agent_name: 'Carl Santillan', 
    property_type: 'house_and_lot', 
    price: 150000, 
    commission: 5, 
    location: 'Cebu City', 
    description: 'Pre-selling Single Attached House and Lot in Talamban, Cebu / Metropolis Subdivision', 
    created_at: new Date('2005-09-18T11:49:36'), 
    is_active: true,
    developer_name: 'Ayala'
  }
}

// I swear there's a better way to do these two functions below using maps and stuff, sayang I aint smart enough for that (yet)
function getCondoType () {
  if (details.is_studio_type)
    return 'Studio'
  else if (details.is_BR_unit)
    return 'BR Unit'
  else if (details.is_villa)
    return 'Villa'
  else if (details.is_garden_villa)
    return 'Garden Villa'
  else if (details.is_penthouse)
    return 'Penthouse'
  else
    return 'N/A'
}

function getMemorialType () {
  if (details.is_urn)
    return 'Urn'
  else if (details.is_vault)
    return 'Vault'
  else if (details.is_garden)
    return 'Garden'
  else if (details.is_estate)
    return 'Estate'
  else if (details.is_family_estate)
    return 'Family Estate'
  else if (details.is_pet_memorial)
    return 'Pet Memorial'
  else
    return 'N/A'
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