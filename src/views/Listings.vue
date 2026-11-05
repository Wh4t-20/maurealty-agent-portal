<template>
  <!-- On phones, App.vue adds bottom padding (pb-16 = 4rem) so the bottom nav
       doesn't cover this page. That padding sits OUTSIDE this h-screen box, so
       without the calc() below this page would be exactly one phone-screen tall
       PLUS 4rem, taller than the visible screen — which is what let the whole
       page scroll instead of just the listings. Subtracting 4rem here cancels
       that extra padding back out, so this box is exactly one screen tall again. -->
    
  <div class="w-full h-[calc(100vh-4rem)] md:h-screen bg-background-gray dark:bg-background-dark-gray flex flex-col items-center overflow-hidden">
    <!-- SAVED NOTICE: "Listing saved / updated / submitted" after Property Management (?saved=...) -->
    <Transition name="toast">
      <div v-if="savedNotice" class="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-lg bg-white dark:bg-black border border-maurealty-green/40 dark:border-maurealty-green/60 shadow-lg px-5 py-3">
        <span class="flex items-center justify-center size-6 rounded-full bg-maurealty-green text-white text-sm font-bold">✓</span>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ savedNotice }}</p>
      </div>
    </Transition>

    <!-- HEADER: title, Add Listing, search, and the filter bar (collapsed with the chevron button) -->
    <header class="flex flex-col py-5 px-4 sm:px-10 pb-0 w-full bg-linear-to-r from-[#A9D6FF70] dark:from-[#041d3070] to-[#FFFFFF] dark:to-black text-maurealty-blue dark:text-white shadow-md sticky z-20">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full pb-3 mb-3 gap-2">
        <h1 class="text-xl sm:text-3xl font-bold">PROJECT LISTINGS</h1>
        <div class="flex gap-3 sm:gap-5 h-full w-full sm:w-auto">
          <button class="flex items-center gap-1 bg-maurealty-blue text-md text-white h-full px-4 rounded-full cursor-pointer hover:opacity-70 transition-opacity" @click="addListing">
            <Plus class="size-4" /> Add Listing
          </button>
          <input id="search" type="text" name="search" maxlength="100" placeholder="Search" v-model="searchQuery"
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

            <!-- Admin-only: isolate listings still awaiting approval -->
            <section v-if="isAdmin" class="listings-filter-section">
              <label class="text-base text-gray-500 dark:text-gray-300 font-medium flex items-center gap-1.5">
                Pending Only
                <span
                  v-if="pendingCount > 0"
                  class="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-orange-500 text-white text-[11px] font-bold leading-none"
                >{{ pendingCount }}</span>
              </label>
              <button
                type="button"
                role="switch"
                :aria-checked="showPendingOnly"
                @click="showPendingOnly = !showPendingOnly"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-2 focus:outline-maurealty-blue"
                :class="showPendingOnly ? 'bg-maurealty-blue' : 'bg-gray-300 dark:bg-gray-700'"
              >
                <span
                  class="inline-block size-4 transform rounded-full bg-white shadow-md transition-transform duration-200"
                  :class="showPendingOnly ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </section>

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

      <!-- LISTING DETAILS OVERLAY (components/listings/PropertyDetails.vue, downloaded on first open) -->
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
          :is-admin="isAdmin"
          :current-agent-id="currentAgentId"
          @close-details="showDetails = false"
          @edit="handleEdit"
          @delete="triggerConfirm($event, 'delete')"
          @sold="triggerConfirm($event, 'sold')"
          @approve="handleApprove"
        />
      </transition>
      
      <!-- GRID: listing cards (skeleton cards while loading), then the pagination footer -->
      <section class="custom-scrollbar flex-1 overflow-y-auto">
        <div class="p-4 sm:p-10 flex flex-col min-h-full">
          
          <!-- Column count here must match the gridColumns breakpoints in the script,
               so the "cards per page" math lines up with what's actually on screen -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            <!-- 1. Render Skeleton Cards when fetching data-->
             <template v-if="isFetchingData">

              <PropertyCard 
                v-for="n in itemsPerPage" 
                :key="'skeleton-' + n" 
                :isLoading="true" 
                class="flex flex-col items-center hover:-translate-y-2 hover:scale-105 hover:z-5 transition-transform duration-300 will-change-transform cursor-pointer"
              />
            </template>
            <!-- 2. Render actual cards when data is ready -->
              <template v-else>
                <PropertyCard 
                  v-for="property in paginatedProperties" 
                  :key="property.listing_id" 
                  :details="property"
                  class="flex flex-col items-center hover:-translate-y-2 hover:scale-105 hover:z-5 transition-transform duration-300 will-change-transform cursor-pointer" 
                  @click="displayDetails(property)"
                  @edit="handleEdit"
                  @delete="processDelete"
                />
              </template>

          </div>

          <!-- PAGINATION -->
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
      :locked-listing="{ id: soldListing.listing_id, title: soldListing.listing_title, price: soldListing.price, commission: soldListing.commission }"
      @close="soldListing = null"
      @saved="onSaleSaved"
    />
    <!-- CONFIRM TOAST: Delete and Mark as Sold ask here first (confirmToastAction runs the action) -->
    <Transition name="toast">
      <div v-if="toastConfirm.visible" class="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg bg-white dark:bg-black border border-red-500 shadow-2xl px-5 py-3">
        <span class="flex items-center justify-center size-6 rounded-full bg-red-600 text-white text-sm font-bold">!</span>
        <div class="flex flex-col">
          <p class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ toastConfirm.title }}</p>
          <p class="text-xs text-gray-600 dark:text-gray-400">{{ toastConfirm.message }}</p>
        </div>
        <div class="flex gap-2 ml-4">
          <button @click="toastConfirm.visible = false" class="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">Cancel</button>
          <button @click="confirmToastAction" class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 cursor-pointer">Confirm</button>
        </div>
      </div>
    </Transition> <!-- BROAST -->
    <!-- Result toast: green for success, red when the action failed -->
    <Transition name="toast">
      <div v-if="confirmedMessage.visible" :role="confirmedMessage.tone === 'error' ? 'alert' : 'status'"
           class="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-lg bg-white dark:bg-black border shadow-2xl px-5 py-3"
           :class="confirmedMessage.tone === 'error' ? 'border-red-500' : 'border-maurealty-green'">
        <span class="flex items-center justify-center size-6 rounded-full text-white text-sm font-bold"
              :class="confirmedMessage.tone === 'error' ? 'bg-red-600' : 'bg-maurealty-green'">{{ confirmedMessage.tone === 'error' ? '!' : '✓' }}</span>
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ confirmedMessage.text }}</p>

      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
// Project Listings (/listings): the listing grid with filters and search (in the browser), skeleton
// cards while loading, the details overlay, and the delete / sold / approve actions it emits.
import { ref, shallowRef, computed, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Property instance
import { type Property }  from '@/assets/classes/listings'
import PropertyCard from '@/components/listings/PropertyCard.vue'
import ListingsFilter from '@/components/listings/ListingsFilter.vue'
import SalesUploadModal from '@/components/sales/SalesUploadModal.vue'

// The details overlay brings the map (Mapbox) and calculator (jsPDF) libraries, so it downloads
// the first time a card is opened instead of holding up the grid (the router also prefetches it
// in the background, see src/router/index.ts).
const PropertyDetails = defineAsyncComponent(() => import('@/components/listings/PropertyDetails.vue'))

// Supabase service import
import { listingsService } from '@/services/listingsServices'
import { developerService } from '@/services/developerService'
import { agentService } from '@/services/agentService'
import { authService } from '@/services/authService'

// utiities
import { currentCurrency, currentUnit, convertPriceToPHP, currencySymbols } from '@/utils/conversion.ts'

import { ChevronDown, Plus } from 'lucide-vue-next'

const properties = shallowRef<Property[]>([])
const router = useRouter()
const route = useRoute()

const isFetchingData = ref(true) // for tracking fetching state of property cards

const selectedType = ref("None")
const searchQuery = ref("")
const priceMin = ref("")
const priceMax = ref("")

const selectedDeveloper = ref("None")
const developerChoices = ref<string[]>(["None"])

const currencies = ['PHP', 'USD', 'CAD', 'CNY', 'JPY'];
const units = ['Metric', 'English'];

// Admin-only approval queue. Admins fetch active+pending together (see
// loadProperties); this toggle isolates the pending ones. Agents never fetch
// pending listings at all, so this is a no-op for them either way.
const isAdmin = ref(false)
const currentAgentId = ref<number | null>(null)
const showPendingOnly = ref(false)
const pendingCount = computed(() => properties.value.filter(p => p.status === 'pending').length)

const filteredProperties = computed(() => {
  let result = properties.value

  if (showPendingOnly.value) {
    result = result.filter(p => p.status === 'pending')
  }

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

  // Pending listings float to top so agents and admins spot them immediately
  result = result.slice().sort((a, b) => {
    const aPending = a.status === 'pending' ? 0 : 1;
    const bPending = b.status === 'pending' ? 0 : 1;
    if (aPending !== bPending) return aPending - bPending;
    return (b.created_at?.getTime() ?? 0) - (a.created_at?.getTime() ?? 0);
  });

  return result
})

// page setup
const currentPage = ref(1)

// Watches the browser width so we know how many columns the grid is
// currently showing (must match the grid-cols-* breakpoints in the template).
const windowWidth = ref(window.innerWidth)
const updateWindowWidth = () => { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', updateWindowWidth))
onUnmounted(() => window.removeEventListener('resize', updateWindowWidth))

const gridColumns = computed(() => {
  if (windowWidth.value < 768) return 2   // phones
  if (windowWidth.value < 1024) return 3  // tablets
  return 4                                 // laptops and up
})

// Aim for about 3 rows of cards per page, however many columns currently fit.
// On phones that's 2 columns x 3 rows = 6 listings, like the goal was.
const itemsPerPage = computed(() => gridColumns.value * 3)

// calculate total pages
const totalPages = computed(() => Math.ceil(filteredProperties.value.length / itemsPerPage.value))

const paginatedProperties = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredProperties.value.slice(start, end)
})

// Reset to page 1 when any filter, search, or the items-per-page count changes
watch([selectedType, searchQuery, selectedDeveloper, priceMin, priceMax, itemsPerPage], () => {
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

  isFetchingData.value = true;

  try {
    // Admins see active + pending together (pending isolated via the toggle);
    // non-admins see active listings + their own pending ones.
    let data: Property[];
    if (isAdmin.value) {
      data = await listingsService.getListings(20, ['active', 'pending']);
    } else {
      data = await listingsService.getListings(20, ['active'], currentAgentId.value ?? undefined);
    }
    properties.value = data;
    currentPage.value = 1;
  } catch (error) { 
    console.error('Fetch error yah:', error);
  } finally {
    // stop loading state regardless of success or failure
    isFetchingData.value = false;
  }
}

const savedNotice = ref<string | null>(null)

const showSavedNotice = () => {
  const messages: Record<string, string> = {
    created: 'Listing saved successfully.',
    updated: 'Listing updated successfully.',
    pending: 'Listing submitted for admin approval.'
  }
  const message = messages[String(route.query.saved)]
  if (!message) return

  savedNotice.value = message
  router.replace({ query: {} })
  setTimeout(() => { savedNotice.value = null }, 4000)
}
const toastConfirm = ref({
  visible: false, // set to true for testing          
  type: '',  
  title: '',                    
  message: '',
  targetListingId: null as number | null               
})
const confirmedMessage = ref({
  visible: false,
  text: '',
  tone: 'success' as 'success' | 'error'
})

// Shows the result toast for 3 seconds.
let confirmedTimer: ReturnType<typeof setTimeout> | undefined
const showConfirmedMessage = (text: string, tone: 'success' | 'error' = 'success') => {
  confirmedMessage.value = { visible: true, text, tone }
  clearTimeout(confirmedTimer)
  confirmedTimer = setTimeout(() => {
    confirmedMessage.value = { visible: false, text: '', tone: 'success' }
  }, 3000)
}
const triggerConfirm = (listingId: number, actionType: string) => {
   // grak
  toastConfirm.value = {
    visible: true,
    type: actionType,
    title: actionType === 'delete' ? 'Delete Listing?' : 'Mark as Sold?',
    message: actionType === 'delete' 
      ? 'This action is permanent and cannot be undone.' 
      : 'This will mark all bulk properties in this listing as completely sold.',
    targetListingId: listingId
  }
}
const confirmToastAction = async () => {
  
  if (!toastConfirm.value.targetListingId || !toastConfirm.value.type) return

  if (toastConfirm.value.type === 'delete') {
    await processDelete(toastConfirm.value.targetListingId)
  } else if (toastConfirm.value.type === 'sold') {
    await markSold(toastConfirm.value.targetListingId)
  }
  toastConfirm.value.visible = false
  
}
const loadDeveloperChoices = async () => {
  const names = await developerService.getDeveloperNames()
  developerChoices.value = ["None", ...names]
}

onMounted(async () => {
  // Admin check must resolve before the first fetch, since it decides
  // whether pending listings are included in that fetch.
  const [agent, agentId] = await Promise.all([
    authService.getCurrentAgent(),
    agentService.getCurrentAgentID()
  ]);
  isAdmin.value = !!agent?.admin_access;
  currentAgentId.value = agentId;

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
async function handleEdit(property: Property) {
  const currentAgentID = await agentService.getCurrentAgentID();
  const listingAgentId = await listingsService.getAgentFromListing(property.listing_id);
  if(currentAgentID !== listingAgentId) {
    alert("You are not authorized to edit this listing.");
    return;
  }
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
      showConfirmedMessage("Success! The listing has been deleted.")
      properties.value = properties.value.filter(p => p.listing_id !== id)


    } else {
      // 0 rows deleted: only the listing's owner or an admin can delete it.
      showConfirmedMessage("The listing was not deleted. Only its agent or an admin can delete it.", 'error')
    }
  } catch (err: any) {
    // e.g. a listing that still has a sale on record can't be deleted
    console.error(err)
    showConfirmedMessage(
      err?.code === '23503'
        ? "This listing can't be deleted because a sale or share link still uses it."
        : "Failed to delete the listing. Please retry.",
      'error'
    )
  }
}
// Marking sold opens the sale form pre-filled with this listing. The agent
// confirms buyer + date there; the listing is only flipped to 'sold' AFTER the
// sale row is saved (see onSaleSaved) so we never hide a listing with no record.
const soldListing = ref<Property | null>(null)

const markSold = (listingId: number) => {
  const listing = properties.value.find(p => p.listing_id === listingId)
  if (!listing) return
  soldListing.value = listing
  showDetails.value = false
}

// Called after the pre-filled sale is saved: now it's safe to flip the listing
// to 'sold' and drop it from the grid.
const onSaleSaved = async () => {
  const listingId = soldListing.value?.listing_id
  soldListing.value = null
  if (!listingId) return
  try {
    const result = await listingsService.updateListingStatus(listingId, 'sold');
    // The sale is saved either way; say so if the listing itself didn't change.
    if (!result.success) {
      showConfirmedMessage("The sale was saved, but the listing could not be marked as sold.", 'error');
      return;
    }
    properties.value = properties.value.filter(p => p.listing_id !== listingId);
    showDetails.value = false;
    showConfirmedMessage("Success! The bulk property has been marked as sold.");
  } catch (error) {
    console.error("Error marking property as sold:", error);
    showConfirmedMessage("Failed to update the listing status. Please retry.", 'error');
  }
}

// Admin approves a pending listing: flips it to 'active' so it shows up in
// the public/agent view. Rejecting reuses the existing Delete flow instead
// of a separate action (same destructive result, one confirm dialog).
const handleApprove = async (listingId: number) => {
  try {
    const result = await listingsService.updateListingStatus(listingId, 'active');
    // 0 rows changed: RLS refused (not an admin) or the listing is gone.
    if (!result.success) {
      showConfirmedMessage("The listing was not approved. Only admins can approve listings.", 'error');
      return;
    }
    // properties is a shallowRef, so mutating an item in place wouldn't
    // trigger reactivity — reassign the array instead (same as processDelete).
    properties.value = properties.value.map(p =>
      p.listing_id === listingId ? { ...p, status: 'active' } : p
    );
    showDetails.value = false;
    showConfirmedMessage("Listing approved and is now live.");
  } catch (error) {
    console.error("Error approving listing:", error);
    showConfirmedMessage("Failed to approve the listing. Please retry.", 'error');
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