<template>
  <div class="w-full h-screen bg-background-gray flex flex-col items-center overflow-hidden">
    <header class="flex flex-col py-5 px-10 pb-0 w-full bg-linear-to-r from-[#A9D6FF70] to-[#FFFFFF] text-maurealty-blue shadow-md sticky z-20">
      <div class="flex justify-between items-center w-full pb-3 mb-3">
        <h1 class="text-3xl font-bold">PROJECT LISTINGS</h1>
        <div class="flex gap-5 h-full">
          <button class="flex items-center gap-1 bg-maurealty-blue text-md text-white h-full px-4 rounded-full cursor-pointer" @click="addListing">
            <Plus class="size-4" /> Add Listing
          </button>
          <input id="search" type="text" name="search" placeholder="Search"
            class="block min-w-0 py-1.5 pr-3 pl-2 text-base placeholder:text-gray-500 border border-blue-950 rounded-sm focus:outline-none sm:text-sm/6" />
        </div>
      </div>

      <Transition name="expand">
        <div v-if="isFilterVisible" class="flex items-center gap-10 pb-5">
            
            <section class="listings-filter-section">
              <label for="Type-input" class="text-base">Type</label>
              <ListingsFilter :choices="Type" v-model="selectedType" />
            </section>
            
            <section class="listings-filter-section">
              <label for="city-input" class="text-base">City</label>
              <ListingsFilter :choices="Cities" v-model="selectedCity" />
            </section>
            
            <section class="listings-filter-section">
              <label for="price-range-input" class="text-base">Price Range</label>
              <div class="flex gap-4 items-center">
                <input type="number" placeholder="₱ Min" class="text-sm w-27 py-0.5 pl-3.5 pr-1 rounded-md bg-background-gray shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
                <span class="w-8 border-2 border-[#d7dde3] self-center -mx-4 -z-1"></span>
                <input type="number" placeholder="₱ Max" class="text-sm w-27 py-0.5 pl-3.5 pr-1 rounded-md bg-background-gray shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
              </div>
            </section>

            <section class="listings-filter-section">
              <label for="developer-input" class="text-base">Developer</label>
              <input id="developer-input" type="text" class="text-sm w-40 py-0.5 pl-3.5 pr-1 rounded-md bg-background-gray shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
            </section>

            <section class="listings-filter-section" v-if="selectedType === 'House And Lot'">
              <label for="room-input" class="text-base">Rooms</label>
              <input id="room-input" type="number" placeholder="0" class="text-sm w-15 py-0.5 pl-3.5 pr-1 rounded-md bg-background-gray shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
            </section>

            <section class="listings-filter-section" v-if="selectedType === 'Condominium'">
              <label for="bedroom-input" class="text-base">Bedrooms</label>
              <input id="bedroom-input" type="number" placeholder="0" class="text-sm w-15 py-0.5 pl-3.5 pr-1 rounded-md bg-background-gray shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
            </section>

            <section class="listings-filter-section" v-if="selectedType === 'House And Lot' || selectedType === 'Condominium'">
              <label for="bathroom-input" class="text-base">Bathrooms</label>
              <input id="bathroom-input" type="number" placeholder="0" class="text-sm w-15 py-0.5 pl-3.5 pr-1 rounded-md bg-background-gray shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
            </section>

            <section class="listings-filter-section" v-if="selectedType === 'House And Lot' || selectedType === 'Lot Only'">
              <label for="area-input" class="text-base">Lot Area</label>
              <input id="area-input" type="number" placeholder="sqm" class="text-sm w-15 py-0.5 pl-3.5 pr-1 rounded-md bg-background-gray shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
            </section>

            <section class="listings-filter-section" v-if="selectedType === 'Condominium'">
              <label for="condo-class-input" class="text-base">Class</label>
              <ListingsFilter :choices="condoClasses" v-model="selectedCondoClass" />
            </section>

            <section class="listings-filter-section" v-if="selectedType === 'Lot Only'">
              <label for="lot-class-input" class="text-base">Class</label>
              <ListingsFilter :choices="lotClasses" v-model="selectedLotClass" />
            </section>

            <section class="listings-filter-section" v-if="selectedType === 'Memorial'">
              <label for="memorial-type-input" class="text-base">Type</label>
              <ListingsFilter :choices="memorialTypes" v-model="selectedMemorialType" />
            </section>
        </div>
      </Transition>
      
      <button 
        @click="toggleFilter"
        class="absolute -bottom-7.5 right-20 px-5 pb-1.5 pt-0 w-fit text-sm font-medium bg-white hover:bg-maurealty-blue hover:text-white rounded-b-full transition-colors cursor-pointer"
      >
        <ChevronDown :class="{'rotate-180': isFilterVisible}" class="size-6 transition-transform duration-300" />
      </button>
      
    </header>

  <main class="relative flex-1 overflow-hidden flex flex-col w-full">
      <section class="custom-scrollbar flex-1 overflow-y-auto">
        <div class="p-10 flex flex-col min-h-full">
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <PropertyCard 
              v-for="property in paginatedProperties" 
              :key="property.listing_id" 
              :details="property" 
              class="flex flex-col items-center"
            />
          </div>

          <footer class="bg-transparent pt-5 pb--12 flex justify-center items-center gap-4 w-full mt-auto">
            <button 
              @click="currentPage--" 
              :disabled="currentPage === 1"
              class="px-4 py-1 border border-maurealty-blue text-maurealty-blue rounded hover:bg-maurealty-blue hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-maurealty-blue cursor-pointer disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span class="text-sm font-medium text-maurealty-blue">Page {{ currentPage }} of {{ totalPages }}</span>
            <button 
              @click="currentPage++" 
              :disabled="currentPage >= totalPages || totalPages === 0"
              class="px-4 py-1 border border-maurealty-blue text-maurealty-blue rounded hover:bg-maurealty-blue hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-maurealty-blue cursor-pointer disabled:cursor-not-allowed"
            >
              Next
            </button>
          </footer>

        </div>
      </section>
    </main>
    
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, watch } from 'vue' 
import { useRouter } from 'vue-router'

// Property instance
import { type Property }  from '@/assets/classes/listings'
import PropertyCard from '@/components/PropertyCard.vue'
import ListingsFilter from '@/components/ListingsFilter.vue'

// Supabase service import
import { listingsService } from '@/services/listingsServices'

import { ChevronDown, Plus } from 'lucide-vue-next'

const properties = shallowRef<Property[]>([])
const router = useRouter()




const selectedType = ref("None")
const selectedCity = ref("None")

// Filter properties based on the selected Type
const filteredProperties = computed(() => {
  if (selectedType.value === "None") {
    return properties.value;
  }
  
  // Convert string to match teh db 
  const dbFormatType = selectedType.value.toLowerCase().replace(/ /g, '_');

  // Filter 
  return properties.value.filter(p => p.property_type === dbFormatType); 
})

// page setup
const currentPage = ref(1)
const itemsPerPage = 8

// calculate total pages
const totalPages = computed(() => Math.ceil(filteredProperties.value.length / itemsPerPage))

//  shows 8 pages 
const paginatedProperties = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredProperties.value.slice(start, end)
})

// Reset to page 1 when the filter changes
watch(selectedType, () => {
  currentPage.value = 1
})



// for Condo and Lot classes + Memorial Types
const selectedCondoClass = ref("None")
const selectedLotClass = ref("None")
const selectedMemorialType = ref("None")

const Type: string[] = ["None", "House And Lot", "Lot Only", "Condominium", "Memorial", "Clubshare", "Golfshare"]
const Cities: string[] = ["None", "Cebu City", "Lapu-Lapu"]
const lotClasses: string[] = ['None', 'Residential', 'Commercial', 'Industrial', 'Farm Lot']
const condoClasses: string[] = ['None', 'Residential', 'Commercial', 'Industrial', 'Condotel', 'Timeshare']
const memorialTypes: string[] = ['None', 'Urn', 'Vault', 'Garden', 'Estate', 'Family Estate', 'Pet Memorial']

// Connect to backend and fetch properties
const loadProperties = async () => {
  console.log('1. Attempting to fetch listings...');
  try {
    const data = await listingsService.getListings();
    console.log('2. Successfully fetched data:', data);
    properties.value = data;
    // Reset page to 1 after new data loads
    currentPage.value = 1;
  } catch (error) {
    console.error('2. Fetch failed:', error);
  }
}

onMounted(() => {
  loadProperties();
})

// for the collapsible filter bar
const isFilterVisible = ref(true)

const toggleFilter = () => {
  isFilterVisible.value = !isFilterVisible.value
}

// for the Add Listing button (goes to property management)
const addListing = () => {
  router.push('/propertymanagement')
}
</script>

<style scoped>
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 100px; /* Adjust based on your filter height */
  opacity: 1;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}
</style>