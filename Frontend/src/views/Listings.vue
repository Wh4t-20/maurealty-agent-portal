<template>
  <div class="w-full bg-[#ECF1F5]">
    <header class="flex flex-col py-5 px-10 w-full bg-white text-maurealty-blue shadow-md sticky top-0 z-10">
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

    <!-- Listings-->
    <section class="p-10 city-section" v-for="(group, city) in groupedProperties" :key="city">
        <div class="city-header">
          <h2>{{ city.toUpperCase() }}</h2>
          <a href="#" class="view-all">View all</a>
        </div>

        <div class="grid grid-cols-3 gap-3">
            <PropertyCard v-for="property in group" :key="property.id" :details="property" class="flex flex-col items-center"/>
        </div>
      </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from '@headlessui/vue'

// Property instance
import { type Property }  from '@/assets/classes/listings'
import PropertyCard from '@/components/PropertyCard.vue'
import ListingsFilter from '@/components/ListingsFilter.vue'

const properties = ref<Property[]>([])

const Amenities: string[] = ["None", "Pool", "Garage"]
const Cities: string[] = ["None", "Cebu City", "Lapu-Lapu"]

// Simulate backend data
const loadProperties = () => {
  properties.value = [
    { id: 1, location: 'Cebu City', description: 'Concise house description', price: 123456, status: 'active' },
    { id: 2, location: 'Cebu City', description: 'Ooga booga description', price: 123456, status: 'active' },
    { id: 3, location: 'Cebu City', description: 'Concise house description', price: 123456, status: 'active' },
    { id: 4, location: 'Lapu-Lapu City', description: 'Concise house description', price: 123456, status: 'active' },
    { id: 5, location: 'Lapu-Lapu City', description: 'Concise house description', price: 123456, status: 'active' },
  ]
}

// Group properties by city for display
const groupedProperties = computed(() => {
  const groups: Record<string, Property[]> = {}
  properties.value.forEach((prop) => {
    const list = groups[prop.location] || (groups[prop.location] = [])
    list.push(prop)
  })
  return groups
})

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
