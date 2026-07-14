<template>
  <div class="w-full h-screen bg-background-gray dark:bg-background-dark-gray flex flex-col items-center overflow-hidden">
    <Transition name="toast">
      <div v-if="savedNotice" class="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-lg bg-white dark:bg-black border border-maurealty-green/40 dark:border-maurealty-green/60 shadow-lg px-5 py-3">
        <span class="flex items-center justify-center size-6 rounded-full bg-maurealty-green text-white text-sm font-bold">✓</span>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ savedNotice }}</p>
      </div>
    </Transition>

    <header class="flex flex-col py-5 px-4 sm:px-10 pb-0 w-full bg-linear-to-r from-[#A9D6FF70] dark:from-[#041d3070] to-[#FFFFFF] dark:to-black text-maurealty-blue dark:text-white shadow-md sticky z-20">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full pb-3 mb-3 gap-2">
        <h1 class="text-xl sm:text-3xl font-bold">PROJECT LISTINGS</h1>
        <div class="flex gap-3 sm:gap-5 h-full w-full sm:w-auto">
          <button class="flex items-center gap-1 bg-maurealty-blue text-md text-white h-full px-4 rounded-full cursor-pointer hover:opacity-70 transition-opacity" @click="addListing">
            <Plus class="size-4" /> Add Listing
          </button>
          <input id="search" type="text" name="search" placeholder="Search" v-model="searchQuery"
            class="block min-w-0 py-1.5 pr-3 pl-2 text-base placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-blue-950 dark:border-blue-50 rounded-sm focus:outline-none sm:text-sm/6" />
        </div>
      </div>

      <Transition name="expand">
        <!-- Filters wrap into extra rows on small screens instead of overflowing -->
        <div v-if="isFilterVisible" class="flex flex-wrap items-start gap-4 sm:gap-8 pb-5 w-full">
            
            <section class="listings-filter-section">
              <label for="Type-input" class="text-base">Type</label>
              <ListingsFilter :choices="Type" v-model="selectedType" />
            </section>
            
            <section class="listings-filter-section">
              <label for="price-range-input" class="text-base">Price Range</label>
              <div class="flex gap-4 items-center">
                <input type="number" :placeholder="`${currencySymbols[currentCurrency]} Min`" v-model="priceMin" class="text-sm w-27 py-0.5 pl-3.5 pr-1 rounded-md bg-background-gray dark:bg-background-dark-gray shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
                <span class="font-bold -mx-2"> - </span>
                <input type="number" :placeholder="`${currencySymbols[currentCurrency]} Max`" v-model="priceMax" class="text-sm w-27 py-0.5 pl-3.5 pr-1 rounded-md bg-background-gray dark:bg-background-dark-gray shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
              </div>
            </section>

            <section class="listings-filter-section">
              <label for="developer-input" class="text-base">Developer</label>
              <ListingsFilter :choices="developerChoices" v-model="selectedDeveloper" />
            </section>

            <section class="listings-filter-section" v-if="selectedType === 'House And Lot'">
              <label for="room-input" class="text-base">Rooms</label>
              <input id="room-input" type="number" placeholder="0" class="text-sm w-15 py-0.5 pl-3.5 pr-1 rounded-md bg-background-gray dark:bg-background-dark-gray shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
            </section>

            <section class="listings-filter-section" v-if="selectedType === 'Condominium'">
              <label for="bedroom-input" class="text-base">Bedrooms</label>
              <input id="bedroom-input" type="number" placeholder="0" class="text-sm w-15 py-0.5 pl-3.5 pr-1 rounded-md bg-background-gray dark:bg-background-dark-gray shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
            </section>

            <section class="listings-filter-section" v-if="selectedType === 'House And Lot' || selectedType === 'Condominium'">
              <label for="bathroom-input" class="text-base">Bathrooms</label>
              <input id="bathroom-input" type="number" placeholder="0" class="text-sm w-15 py-0.5 pl-3.5 pr-1 rounded-md bg-background-gray dark:bg-background-dark-gray shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
            </section>

            <section class="listings-filter-section" v-if="selectedType === 'House And Lot' || selectedType === 'Lot Only'">
              <label for="area-input" class="text-base">Lot Area</label>
              <input id="area-input" type="number" placeholder="sqm" class="text-sm w-15 py-0.5 pl-3.5 pr-1 rounded-md bg-background-gray dark:bg-background-dark-gray shadow-md/30 focus:outline-2 focus:outline-maurealty-blue" />
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

            <div class = "grow"></div>

            <section class="listings-filter-section">
              <label class="text-base text-gray-500 dark:text-gray-300 font-medium">Currency</label>
              <ListingsFilter :choices="currencies" v-model="currentCurrency" />
            </section>
            
            <section class="listings-filter-section">
              <label class="text-base text-gray-500 dark:text-gray-300 font-medium">Units</label>
              <ListingsFilter :choices="units" v-model="currentUnit" />
            </section>

        </div>
      </Transition>
      
      <button 
        @click="toggleFilter"
        class="absolute -bottom-7.5 right-20 px-5 pb-1.5 pt-0 w-fit text-sm font-medium bg-white dark:bg-black hover:bg-maurealty-blue hover:text-white rounded-b-full transition-colors cursor-pointer"
      >
        <ChevronDown :class="{'rotate-180': isFilterVisible}" class="size-6 transition-transform duration-300" />
      </button>
      
    </header>

  <main class="relative flex-1 overflow-hidden flex flex-col w-full">
      <transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform translate-y-4 scale-95 opacity-0"
            enter-to-class="transform translate-y-0 scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-out"
            leave-from-class="transform translate-y-0 scale-100 opacity-100"
            leave-to-class="transform -translate-y-4 scale-95 opacity-0"
      >
        <PropertyDetails 
          v-if="showDetails"
          :prop_id="prop_id" 
          :prop_type="prop_type"
          @close-details="showDetails = false"
          @edit="handleEdit"
          @delete="processDelete"
          @sold="markSold"
        />
      </transition>

      <section class="custom-scrollbar flex-1 overflow-y-auto">
        <div class="p-4 sm:p-10 flex flex-col min-h-full">
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <PropertyCard 
              v-for="property in paginatedProperties" 
              :key="property.listing_id" 
              :details="property" 
              class="flex flex-col items-center hover:-translate-y-2 hover:scale-105 hover:z-5 transition-all cursor-pointer"
              @click="displayDetails(property)"
              @edit="handleEdit"
              @delete="processDelete"
            />
          </div>

          <footer class="bg-transparent pt-5 pb--12 flex justify-center items-center gap-4 w-full mt-auto">
            <button 
              @click="currentPage--" 
              :disabled="currentPage === 1"
              class="px-4 py-1 border border-maurealty-blue dark:border-maurealty-light-blue text-maurealty-blue dark:text-maurealty-light-blue rounded hover:bg-maurealty-blue dark:hover:bg-maurealty-light-blue hover:text-white dark:hover:text-maurealty-blue transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-maurealty-blue dark:disabled:hover:text-maurealty-light-blue cursor-pointer disabled:cursor-not-allowed"
            >
              <
            </button>
            <span class="text-sm font-medium text-maurealty-blue dark:text-maurealty-light-blue">Page {{ currentPage }} of {{ totalPages }}</span>
            <button 
              @click="currentPage++" 
              :disabled="currentPage >= totalPages || totalPages === 0"
              class="px-4 py-1 border border-maurealty-blue dark:border-maurealty-light-blue text-maurealty-blue dark:text-maurealty-light-blue rounded hover:bg-maurealty-blue dark:hover:bg-maurealty-light-blue hover:text-white dark:hover:text-maurealty-blue transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-maurealty-blue dark:disabled:hover:text-maurealty-light-blue cursor-pointer disabled:cursor-not-allowed"
            >
              >
            </button>
          </footer>

        </div>
      </section>
    </main>

    <!-- Sold flow: pre-filled sale form. On save, the listing is marked sold. -->
    <SalesUploadModal
      v-if="soldListing"
      :locked-listing="{ id: soldListing.listing_id, title: soldListing.listing_title, price: soldListing.price }"
      @close="soldListing = null"
      @saved="onSaleSaved"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Property instance
import { type Property }  from '@/assets/classes/listings'
import PropertyCard from '@/components/listings/PropertyCard.vue'
import ListingsFilter from '@/components/listings/ListingsFilter.vue'
import PropertyDetails from '@/components/listings/PropertyDetails.vue'

// Supabase service import
import { listingsService } from '@/services/listingsServices'
import { developerService } from '@/services/developerService'

// utiities
import { currentCurrency, currentUnit, convertPriceToPHP, currencySymbols } from '@/utils/conversion.ts'

import { ChevronDown, Plus } from 'lucide-vue-next'

const properties = shallowRef<Property[]>([])
const router = useRouter()
const route = useRoute()

const selectedType = ref("None")
const searchQuery = ref("")
const priceMin = ref("")
const priceMax = ref("")

const selectedDeveloper = ref("None")
const developerChoices = ref<string[]>(["None"])

const currencies = ['PHP', 'USD', 'CAD', 'CNY', 'JPY'];
const units = ['Metric', 'English'];

const filteredProperties = computed(() => {
  let result = properties.value

  if (selectedType.value !== "None") {
    const dbFormatType = selectedType.value.toLowerCase().replace(/ /g, '_')
    result = result.filter(p => p.property_type === dbFormatType)
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter(p =>
      p.listing_title?.toLowerCase().includes(query) ||
      p.location?.toLowerCase().includes(query) ||
      p.developer_name?.toLowerCase().includes(query)
    )
  }

  if (selectedDeveloper.value !== "None") {
      result = result.filter(p => p.developer_name === selectedDeveloper.value)
    }

  const min = Number(priceMin.value)
  if (priceMin.value !== "" && !Number.isNaN(min)) {
    const dbMin = convertPriceToPHP(min);
    result = result.filter(p => p.price >= dbMin)
  }

  const max = Number(priceMax.value)
  if (priceMax.value !== "" && !Number.isNaN(max)) {
    const dbMax = convertPriceToPHP(max);
    result = result.filter(p => p.price <= dbMax)
  }

  return result
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

// Reset to page 1 when any filter or search changes
watch([selectedType, searchQuery, selectedDeveloper, priceMin, priceMax], () => {
  currentPage.value = 1
})

// for Condo and Lot classes + Memorial Types
const selectedCondoClass = ref("None")
const selectedLotClass = ref("None")
const selectedMemorialType = ref("None")

const Type: string[] = ["None", "House And Lot", "Lot Only", "Condominium", "Memorial", "Clubshare", "Golfshare"]
const lotClasses: string[] = ['None', 'Residential', 'Commercial', 'Industrial', 'Farm Lot']
const condoClasses: string[] = ['None', 'Residential', 'Commercial', 'Industrial', 'Condotel', 'Timeshare']
const memorialTypes: string[] = ['None', 'Urn', 'Vault', 'Garden', 'Estate', 'Family Estate', 'Pet Memorial']

// Connect to backend and fetch properties
const loadProperties = async () => {
  console.log('Attempt to get listings imnida');
  try {
    const data = await listingsService.getListings();
    console.log('Naa na ang data bai:', data);
    properties.value = data;
    currentPage.value = 1;
  } catch (error) { 
    console.error('Fetch error yah:', error);
  }
}

const savedNotice = ref<string | null>(null)

const showSavedNotice = () => {
  const messages: Record<string, string> = {
    created: 'Listing saved successfully.',
    updated: 'Listing updated successfully.'
  }
  const message = messages[String(route.query.saved)]
  if (!message) return

  savedNotice.value = message
  router.replace({ query: {} })
  setTimeout(() => { savedNotice.value = null }, 4000)
}

const loadDeveloperChoices = async () => {
  const names = await developerService.getDeveloperNames()
  developerChoices.value = ["None", ...names]
}

onMounted(() => {
  loadProperties();
  loadDeveloperChoices();
  showSavedNotice();
})

// for the collapsible filter bar
const isFilterVisible = ref(true)

const toggleFilter = () => {
  isFilterVisible.value = !isFilterVisible.value
}

// for the Add Listing button goes to property management, wala pay logic and such though
const addListing = () => {
  router.push({ 
    path: '/propertymanagement',
    query:{
      edit: 0 // indicates edit mode, 1 if true, 0 if not
    } 
  })
}


const showDetails = ref(false)
const prop_id = ref(0)
const prop_type = ref('') 

// displays the details 
const displayDetails = (property: Property) => {
  showDetails.value = true
  prop_id.value = property.listing_id
  prop_type.value = property.property_type 
}

//  edit
const propertyTypesMap: Record<string, number> = {
  'house_and_lot': 1,
  'lot_only': 2,
  'condominium': 3,
  'memorial': 4,
  'clubshare': 5,
  'golfshare': 6
};
const handleEdit = (property: Property) => {
  const typeId = propertyTypesMap[property.property_type] || 1;
  router.push({
    path: '/propertymanagement',
    query: { 
      edit: 1, // indicates edit mode, 1 if true, 0 if not
      id: property.listing_id,
      type: typeId 
    }
  });
};

const processDelete = async (id: number) => {

  try {
    const result = await listingsService.deleteListing(id)
    
    if (result.success) {
      showDetails.value = false 
      
      properties.value = properties.value.filter(p => p.listing_id !== id)
      
      console.log("Deleted successfully from DB and UI")
    }
  } catch (err) {
    alert("Could not delete listing. Check console for details.")
    console.error(err)
  }
}
// Marking sold opens the sale form pre-filled with this listing. The agent
// confirms buyer + date there; the listing is only flipped to 'sold' AFTER the
// sale row is saved (see onSaleSaved) so we never hide a listing with no record.
const markSold = async (listingId: number) => {
  if (!confirm('Are you sure you want to mark this bulk listing as sold?')) return;
  
  try {
    await listingsService.updateListingStatus(listingId, 'sold');
    properties.value = properties.value.filter(p => p.listing_id !== listingId);
    showDetails.value = false;
    alert("Success! The bulk property has been marked as sold.");
  } catch (error) {
    console.error("Error marking property as sold:", error);
    alert("Failed to update the listing status. Please retry.");
  }
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
  /* Tall enough to fit the filters even when they wrap into several rows on phones */
  max-height: 400px;
  opacity: 1;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>