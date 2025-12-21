<template>
  <div class="listings-container">

    <!-- MAIN CONTENT -->
    <div class="main-content">
      <!-- HEADER -->
      <header class="project-header">
        <h1 class="project-title">PROJECT LISTINGS</h1>

        <!-- Filter Controls -->
        <div class="filter-bar">
          <input type="number" placeholder="Bedrooms" />
          <input type="number" placeholder="Bathrooms" />
          <select>
            <option>Property Type</option>
            <option>House</option>
            <option>Condo</option>
          </select>
          <select>
            <option>Amenities</option>
            <option>Pool</option>
            <option>Garage</option>
          </select>
          <select>
            <option>City</option>
            <option>Cebu City</option>
            <option>Lapu-Lapu City</option>
          </select>

          <div class="price-range">
            <input type="number" placeholder="₱ Min" />
            <span>-</span>
            <input type="number" placeholder="₱ Max" />
          </div>

          <input type="text" class="search-bar" placeholder="Search" />
        </div>
      </header>

      <!-- PROPERTY LISTINGS -->
      <section class="city-section" v-for="(group, city) in groupedProperties" :key="city">
        <div class="city-header">
          <h2>{{ city.toUpperCase() }}</h2>
          <a href="#" class="view-all">View all</a>
        </div>

        <div class="property-grid">
          <div v-for="property in group" :key="property.id" class="property-card">
            <img src="@/assets/images/sample-house.jpg" alt="House" class="property-img" />
            <div class="property-info">
              <p class="property-desc">{{ property.description }}</p>
              <p class="property-price">Php {{ property.price.toLocaleString() }}</p>
              <p class="broker">Brokerage firm</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Property {
  id: number
  city: string
  description: string
  price: number
}

const properties = ref<Property[]>([])

// Simulate backend data
const loadProperties = () => {
  properties.value = [
    { id: 1, city: 'Cebu City', description: 'Concise house description', price: 123456 },
    { id: 2, city: 'Cebu City', description: 'Concise house description', price: 123456 },
    { id: 3, city: 'Cebu City', description: 'Concise house description', price: 123456 },
    { id: 4, city: 'Lapu-Lapu City', description: 'Concise house description', price: 123456 },
    { id: 5, city: 'Lapu-Lapu City', description: 'Concise house description', price: 123456 },
  ]
}

// Group properties by city for display
const groupedProperties = computed(() => {
  const groups: Record<string, Property[]> = {}
  properties.value.forEach((prop) => {
    const list = groups[prop.city] || (groups[prop.city] = [])
    list.push(prop)
  })
  return groups
})

onMounted(() => loadProperties())
</script>

<style scoped>
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

.property-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
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
