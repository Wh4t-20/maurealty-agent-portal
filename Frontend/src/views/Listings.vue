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

.listings-container {
  display: flex;
  min-height: 100vh;
  background: #f6f7fb;
  font-family: 'Poppins', sans-serif;
}

.company-brand {
  display: flex;
  flex-direction: column;
  align-items: center;   /* centers horizontally */
  text-align: center;
}

.company-brand h1 {
  font-size: 1.8rem;
  margin: 0;
  color: #e74c3c;
}

.company-brand h2 {
  font-size: 1.4rem;
  margin: 0;
  margin-bottom: 1rem;
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

/* ---------------- HEADER ---------------- */
.project-header {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.project-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e2a5a;
  margin-bottom: 1.5rem;
}

/* ---------------- FILTER BAR ---------------- */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.filter-bar input,
.filter-bar select {
  background: #f2f4f7;
  border: none;
  border-radius: 25px;
  padding: 0.6rem 1rem;
  font-size: 0.95rem;
  color: #333;
  min-width: 120px;
}

.filter-bar .price-range {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.filter-bar .search-bar {
  flex: 1;
  min-width: 200px;
  border-radius: 25px;
  background: #f2f4f7;
  border: none;
  padding: 0.6rem 1rem;
}

/* ---------------- CITY SECTIONS ---------------- */
.city-section {
  margin-bottom: 2rem;
}

.city-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.city-header h2 {
  color: #1e2a5a;
  font-size: 1.2rem;
  font-weight: 700;
}

.view-all {
  font-size: 0.9rem;
  color: #0a3d62;
  text-decoration: none;
}

/* ---------------- PROPERTY GRID ---------------- */
.property-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.property-card:hover {
  transform: translateY(-5px);
}

.property-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.property-info {
  padding: 1rem;
}

.status-pill {
  width: 30px;
  height: 8px;
  background: #007bff;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.property-desc {
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 0.3rem;
}

.property-price {
  font-weight: 600;
  color: #1e2a5a;
  margin-bottom: 0.3rem;
}

.broker {
  font-size: 0.8rem;
  color: #888;
}
</style>
