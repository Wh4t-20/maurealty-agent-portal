<template>
  <div 
    class="property-card"
    :class="locationClass"
  >
    <div v-if="showLocation" class="property-header">
      {{ property.location }}
    </div>
    <div class="property-content">
      <div class="property-description">{{ property.description }}</div>
      <div class="property-price">{{ formatPrice(property.price) }}</div>
      <div class="property-status">
        <span 
          v-for="status in property.status" 
          :key="status"
          :class="['status-tag', `status-${status.toLowerCase()}`]"
        >
          {{ status }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Property {
  id: number
  location: string
  description: string
  price: number
  status: string[]
}

interface Props {
  property: Property
  showLocation: boolean
}

const props = defineProps<Props>()

const locationClass = computed(() => {
  const location = props.property.location.toLowerCase().replace(/\s+/g, '-')
  return `location-${location}`
})

const formatPrice = (price: number): string => {
  return `Php ${price.toLocaleString()}`
}
</script>

<style scoped>
.property-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
  cursor: pointer;
}

.property-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.property-header {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  padding: 1rem 1.5rem;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.property-content {
  padding: 1.5rem;
}

.property-description {
  font-size: 1rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.property-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #27ae60;
  margin-bottom: 1rem;
}

.property-status {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status-tag {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-reserved {
  background: #ffeaa7;
  color: #e17055;
}

.status-free {
  background: #55efc4;
  color: #00b894;
}

/* Location-specific colors */
.location-lapu-lapu-city .property-header {
  background: linear-gradient(135deg, #0984e3 0%, #074b8f 100%);
}

.location-cebu-city .property-header {
  background: linear-gradient(135deg, #00b894 0%, #008066 100%);
}

.location-camera .property-header {
  background: linear-gradient(135deg, #6c5ce7 0%, #4834d4 100%);
}

.location-pricewaterhousecoopers .property-header {
  background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%);
}

.location-pinkwood .property-header {
  background: linear-gradient(135deg, #fdcb6e 0%, #f39c12 100%);
}
</style>