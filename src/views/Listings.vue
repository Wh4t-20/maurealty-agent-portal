<template>
  <div class="w-full h-screen bg-[#ECF1F5] flex flex-col overflow-hidden">
    <header class="flex flex-col py-5 px-10 w-full bg-white text-maurealty-blue shadow-md sticky top-0 z-20">
      <!-- Header and search -->
      <div class="flex justify-between items-center w-full pb-3">
        <h1 class="text-3xl font-bold">PROJECT LISTINGS</h1>
        <input id="search" type="text" name="search" placeholder="Search"
          class="block min-w-0 py-1.5 pr-3 pl-2 text-base placeholder:text-gray-500 border border-blue-950 rounded-sm focus:outline-none sm:text-sm/6" />
      </div>

      <!-- Filter -->
       <div class="flex items-center gap-10">

          <section class="listings-filter-section">
            <label for="bedroom-input" class="text-base">Bedrooms</label>
            <input id="bedroom-input" type="number" placeholder="0" class="text-sm w-25 py-0.5 pl-3.5 pr-1 rounded-xl bg-[#ECF1F5] shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
          </section>

          <section class="listings-filter-section">
            <label for="bathroom-input" class="text-base">Bathrooms</label>
            <input id="bathroom-input" type="number" placeholder="0" class="text-sm w-25 py-0.5 pl-3.5 pr-1 rounded-xl bg-[#ECF1F5] shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
          </section>
          
          <section class="listings-filter-section">
            <label for="amenities-input" class="text-base">Amenities</label>
            <ListingsFilter :choices="Amenities" />
          </section>
          
          <section class="listings-filter-section">
            <label for="city-input" class="text-base">City</label>
            <ListingsFilter :choices="Cities" />
          </section>
          
          <section class="listings-filter-section">
            <label for="price-range-input" class="text-base">Price Range</label>
            <div class="flex gap-4 items-center">
              <input type="number" placeholder="₱ Min" class="text-sm w-30 py-0.5 pl-3.5 pr-1 rounded-xl bg-[#ECF1F5] shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
              <span class="w-8 border-2 border-[#d7dde3] self-center -mx-4 -z-1"></span>
              <input type="number" placeholder="₱ Max" class="text-sm w-30 py-0.5 pl-3.5 pr-1 rounded-xl bg-[#ECF1F5] shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
            </div>
          </section>
       </div>
    </header>

    

    <main class="relative overflow-hidden">
      <PropertyDetails v-if="true" />

      <!-- Listings-->
      <section class="h-full overflow-y-auto">
        <div class="p-10">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <PropertyCard 
              v-for="property in properties" 
              :key="property.listing_id" 
              :details="property" 
              class="flex flex-col items-center"
            />
          </div>
      </div>
      </section>
      
    </main>
    
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Property instance
import { type Property }  from '@/assets/classes/listings'
import PropertyCard from '@/components/PropertyCard.vue'
import ListingsFilter from '@/components/ListingsFilter.vue'

// remember to delete:
import PropertyDetails from '@/components/PropertyDetails.vue'

const properties = ref<Property[]>([])

const Amenities: string[] = ["None", "Pool", "Garage"]
const Cities: string[] = ["None", "Cebu City", "Lapu-Lapu"]

// Simulate backend data
const loadProperties = () => {
  properties.value = [
  /* 
    listing_id: number;
    agent_id: number;
    property_type: string;
    price: number;
    commission: number;
    location: string;
    description: string;
    created_at: Date;
    is_active: boolean;
    developer_name: string;
  */  
    { listing_id: 1, agent_id: 1, property_type: 'House And Lot', price: 10000, commission: 2000, location: 'Cebu City', description: 'Concise house description', created_at: new Date('2016-11-10T11:49:36'), is_active: true, developer_name: 'Ayala' },
    { listing_id: 2, agent_id: 1, property_type: 'Condominion', price: 100000, commission: 2000, location: 'Cebu City', description: 'This is a really cool house', created_at: new Date('2016-11-10T11:49:36'), is_active: true, developer_name: 'Ayala' },
    { listing_id: 3, agent_id: 2, property_type: 'Shawrty', price: 123456, commission: 2000, location: 'Cebu City', description: 'sdakjsdajldsjajsdlajdlkajdlksajdlkajlkdsajlkdjalkdjalkdsj', created_at: new Date('2016-11-10T11:49:36'), is_active: true, developer_name: 'Manlangit Houses' },
    { listing_id: 4, agent_id: 2, property_type: 'Memorial', price: 67697697, commission: 2000, location: 'Lapu-Lapu City', description: 'Concise house description', created_at: new Date('2016-11-10T11:49:36'), is_active: true, developer_name: 'Ayala' },
    { listing_id: 5, agent_id: 3, property_type: 'Lot', price: 10, commission: 2000, location: 'Lapu-Lapu City', description: 'I really like this house aw yeah', created_at: new Date('2016-11-10T11:49:36'), is_active: true, developer_name: 'Ayala' },
  ]
}

onMounted(() => loadProperties())
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
</style>
