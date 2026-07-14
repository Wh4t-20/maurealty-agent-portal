<template>
<div class="absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-sm">
  <!-- Full screen on phones, floating card on bigger screens -->
  <div v-if="details" class="custom-scrollbar bg-white dark:bg-black w-full h-full sm:w-10/12 sm:h-11/12 rounded-none sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-900 px-4 sm:px-10 py-4 sm:py-7 overflow-y-auto">
        <header class="relative mb-4">
          <h1 class="text-2xl sm:text-3xl max-w-19/20 font-extrabold text-maurealty-blue dark:text-maurealty-light-blue">
            {{ details.listing_title || 'Untitled Listing' }}
          </h1>

          <button class="absolute top-0 right-0 p-3 rounded-full text-black dark:text-white hover:bg-gray-200/40 dark:hover:bg-gray-200/20 transition-colors cursor-pointer" @click="$emit('closeDetails')">
            <XIcon class="size-5" stroke-width="3"/>
          </button>
        </header>

        <hr width="100%" class="mb-4 text-maurealty-blue dark:text-maurealty-light-blue/30 dark:text-maurealty-light-blue/30">

        <!-- Photos stack above the details on phones, side by side on bigger screens -->
        <main class="flex flex-col md:flex-row gap-6 md:gap-12 mx-0 md:mx-4">

          <div class="grow w-full md:w-3/5 flex flex-col gap-6">
            
            <div class="relative flex gap-4 items-center">
              <div class="relative grow aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-mist-800 shadow-sm">
                <img 
                  :src="activeImage || placeholder"
                  alt="Property Main View" 
                  class="absolute inset-0 w-full h-full object-contain"
                />  
              </div>

              <button 
                class="absolute left-2 w-8 h-18 bg-slate-500/30 backdrop-blur-xs self-center rounded flex items-center justify-center text-black dark:text-white text-4xl hover:bg-slate-500/60 hover:text-maurealty-blue dark:text-maurealty-light-blue cursor-pointer"
                @click="updateImage(currentImageIndex - 1)">
                <ChevronLeft stroke-width=2.75 />
              </button>

              <button 
                class="absolute right-2 w-8 h-18 bg-slate-500/30 backdrop-blur-xs self-center rounded flex items-center justify-center text-black dark:text-white text-4xl hover:bg-slate-500/60 hover:text-maurealty-blue dark:text-maurealty-light-blue cursor-pointer"
                @click="updateImage(currentImageIndex + 1)">
                <ChevronRight stroke-width=2.75 />
              </button>
            </div>

            <div class="flex gap-4">
              <img 
                v-for="(thumb, index) in thumbnails" 
                :key="index"
                :src="thumb" 
                @click="updateImage(index)"
                alt="Property thumbnail" 
                class="w-20 h-14 sm:w-32 sm:h-24 rounded-lg object-cover cursor-pointer hover:ring-2 hover:ring-maurealty-blue dark:hover:ring-maurealty-light-blue"
                :class="[index == currentImageIndex ? 'opacity-50' : '']"
              />
            </div>
          </div>

          <div class="w-full md:w-2/5 flex flex-col gap-2 text-gray-800 dark:text-gray-200 text-lg">
            
            <span class="inline-block bg-maurealty-green w-fit text-2xl text-white px-4 py-0.5 rounded-full tracking-wider mt-0.5">
               <template v-if="details.is_bulk && details.max_price">
                 {{ formatPrice(details.price ?? 0) }} - {{ formatPrice(details.max_price) }}
               </template>
               <template v-else>
                 {{ formatPrice(details.price ?? 0) }}
               </template>
            </span>

            <span class="flex items-center gap-1.5 font-semibold">
              <Building2Icon class="size-6 text-black dark:text-white" />
              {{ formattedPropertyType(details.property_type) }}
            </span>

            <span class="flex items-center gap-1.5 font-semibold">
              <MapPinIcon class="size-6 text-black dark:text-white" />
              {{ details.location }}
            </span>

            <section class="w-full h-64 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
              <MapHolder :target-location="{ lng: details.lng, lat: details.lat }" :listing-id="details.listing_id" />
            </section>

            <span class="flex items-center gap-1.5">
              <UserStarIcon class="size-6 text-black dark:text-white" />
              <p>{{ details.agent_name || 'N/A' }}</p>
            </span>
            
            <p class="text-sm text-gray-500 dark:text-gray-400">Created on: {{ details.created_at.toLocaleDateString() }}</p>

            <span class="flex items-center-safe mt-2 text-xl">
              <p class="font-semibold">Developed by:</p>
              <p class="ml-2.5">{{ details.developer_name }}</p>
            </span>
            
            <template v-if=" !details.is_bulk && details.property_type === 'house_and_lot'">
              <fieldset class="border border-maurealty-blue/20 dark:border-maurealty-light-blue/40 rounded-xl px-4 py-2 w-full">
                <legend class="px-2 font-semibold text-maurealty-blue dark:text-maurealty-light-blue">House and Lot Features</legend>
                <main class="text-sm px-2 flex flex-col">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-0.5" >
                    <span class="flex items-center-safe gap-1"><LandPlot /> <b> Lot Area: </b> {{ formatArea(details.lot_area) }}</span>
                    <span class="flex items-center-safe gap-1"><SquareDashed /> <b> Floor Area: </b> {{ formatArea(details.floor_area) }}</span>
                    <span class="flex items-center-safe gap-1"><Sofa /> {{ details.rooms_count }} room{{ details.rooms_count != 1 ? 's' : '' }}</span>
                    <span class="flex items-center-safe gap-1"><Toilet /> {{ details.toilets_count }} toilet{{ details.toilets_count != 1 ? 's' : '' }}</span>
                    <span class="flex items-center-safe gap-1 sm:col-span-2"><BedDouble /> <b> Master Bedroom Area: </b> {{ formatArea(details.master_bedroom_area) }}</span>
                  </div>
    
                  <span class="flex items-center-safe justify-around pr-2 mt-3">
                    <p class="flex items-center-safe gap-1" v-if="details.helper_rooms_count >= 0">
                      <BrushCleaning class="size-4" /> {{ details.helper_rooms_count }} helper room{{ details.helper_rooms_count != 1 ? 's' : '' }}
                    </p>
                    <p v-if="(details.driver_rooms_count >= 0 && details.helper_rooms_count >= 0)">|</p>
                    <p class="flex items-center-safe gap-1" v-if="details.driver_rooms_count >= 0">
                      <LifeBuoy class="size-3" /> {{ details.driver_rooms_count }} driver room{{ details.driver_rooms_count != 1 ? 's' : '' }}
                    </p> 
                    <p v-if="(details.helper_rooms_count >= 0  || details.driver_rooms_count >= 0) && details.carpark_count >= 0">|</p>
                    <p class="flex items-center-safe gap-1" v-if="details.carpark_count >= 0">
                      <Car class="size-4" /> {{ details.carpark_count }} carpark{{ details.carpark_count != 1 ? 's' : '' }}
                    </p>
                   </span> 

                  <div class="mt-3">
                    <ul class="grid grid-cols-2 sm:grid-cols-3">
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

            <template v-if=" !details.is_bulk && details.property_type === 'lot_only'">
              <fieldset class="border border-maurealty-blue/20 dark:border-maurealty-light-blue/40 rounded-xl px-4 py-2 w-full">
                <legend class="px-2 font-semibold text-maurealty-blue dark:text-maurealty-light-blue">Lot Features</legend>
                <main class="text-sm px-2 flex flex-col">
                  <div class="grid grid-cols-1 sm:grid-cols-2">
                    <div>
                      <span class="flex items-center-safe gap-1"><CircleSmall class="size-3.5" /> Block No. <b>{{ details.block_number }}</b></span>
                      <span class="flex items-center-safe gap-1"><CircleSmall class="size-3.5" /> Lot No. <b>{{ details.lot_number }}</b></span>
                      <span class="flex items-center-safe gap-1"><CircleSmall class="size-3.5" /> Phase No. <b>{{ details.phase_number }}</b></span>  
                    </div>
                    <div>
                      <span class="flex items-center-safe gap-1"><SquareDashed /> {{ formatArea(details.lot_area) }} </span>
                    </div>
                  </div>
                  
                  <div class="mt-2 pb-2 flex gap-2">
                    <p class="font-bold text-xl text-maurealty-blue dark:text-maurealty-light-blue">Class:</p>
                    <p class="text-xl">{{ lotClassesMap[details.lot_class_ID] || 'N/A' }}</p>
                  </div>
                </main>
              </fieldset>
            </template>

            <template v-if=" !details.is_bulk && details.property_type === 'condominium'">
              <fieldset class="border border-maurealty-blue/20 dark:border-maurealty-light-blue/40 rounded-xl px-4 py-2 w-full">
                <legend class="px-2 font-semibold text-maurealty-blue dark:text-maurealty-light-blue">Condominium Features</legend>
                <main class="text-sm px-2 flex flex-col">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-0.5">
                    <span class="flex items-center-safe gap-1"><Hash /> Unit No. <b>{{ details.unit_number }}</b></span>
                    <span class="flex items-center-safe gap-1"><Bed /> {{ details.bedroom_count }} bedroom{{ details.carpark_count != 1 ? 's' : '' }}</span>
                    <span class="flex items-center-safe gap-1"><BookImage /> {{ details.balcony_count }} balcon{{ details.carpark_count != 1 ? 'ies' : 'y' }}</span>
                    <span class="flex items-center-safe gap-1"><Car /> {{ details.carpark_count }} carpark{{ details.carpark_count != 1 ? 's' : '' }}</span>
                    <span class="flex items-center-safe gap-1 sm:col-span-2"><BedDouble /> <b> Master Bedroom Area: </b> {{ formatArea(details.master_bedroom_area) }}</span>
                  </div>
                  
                  <div class="mt-4 flex gap-2">
                    <p class="font-bold text-xl text-maurealty-blue dark:text-maurealty-light-blue">Class:</p>
                    <p class="text-xl">{{ condoClassesMap[details.condo_class_ID] || 'N/A' }}</p>
                  </div>
                  <div class="pb-2 flex gap-2">
                    <p class="font-bold text-xl text-maurealty-blue dark:text-maurealty-light-blue">Type:</p>
                    <p class="text-xl">{{ getCondoType() }}</p>
                  </div>
                </main>
              </fieldset>
            </template>

            <template v-if=" !details.is_bulk && details.property_type === 'memorial'">
              <fieldset class="border border-maurealty-blue/20 dark:border-maurealty-light-blue/40 rounded-xl px-4 py-2 w-full">
                <legend class="px-2 font-semibold text-maurealty-blue dark:text-maurealty-light-blue">Memorial Features</legend>
                <main class="text-sm px-2 flex flex-col">
                  <div class="pb-2 flex gap-2">
                    <p class="font-bold text-xl text-maurealty-blue dark:text-maurealty-light-blue">Type:</p>
                    <p class="text-xl">{{ getMemorialType() }}</p>
                  </div>
                </main>
              </fieldset>
            </template>

            <!-- Description section -->
            <section class="mt-2 markdownTypography text-black dark:text-white" v-html="compiledDescriptionMarkdown" />
          </div>
        </main>

        <!-- FAQs -->
        <section v-if="compiledFAQMarkdown" class="p-5 border border-maurealty-blue/20 dark:border-maurealty-light-blue/40 rounded-3xl w-full mt-10">
          <section class="markdownTypography text-black dark:text-white" v-html="compiledFAQMarkdown" />
        </section>
        
        <!-- Action buttons wrap to the next line when the screen is narrow -->
        <section class="w-full flex flex-wrap mt-4 px-3 gap-3">
          <button @click="$emit('edit', details)" class="flex flex-col items-center py-2 px-5 w-32 rounded-full border-2 border-maurealty-blue text-maurealty-blue dark:text-maurealty-light-blue font-bold hover:bg-maurealty-blue hover:text-white hover:shadow-md hover:-translate-y-0.75 transition cursor-pointer">
            <span class="flex items-center-safe gap-1"><SquarePen class="size-4" /> EDIT</span>
          </button>

          <button @click="$emit('delete', details.listing_id)" class="flex flex-col items-center py-2 px-5 w-32 rounded-full border-2 border-red-600 text-red-600 font-bold hover:bg-red-600 hover:text-white hover:shadow-md hover:-translate-y-0.75 transition cursor-pointer">
            <span class="flex items-center-safe gap-1"><Trash2 class="size-4" /> DELETE</span>
          </button>

          <button 
            @click="handleShare" 
            :disabled="isShareCooldown"
            class="flex flex-col items-center py-2 px-5 w-32 rounded-full border-2 border-maurealty-blue text-maurealty-blue dark:text-maurealty-light-blue font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            :class="!isShareCooldown ? 'hover:bg-maurealty-blue hover:text-white hover:shadow-md hover:-translate-y-0.75' : ''"
          >
            <span class="flex items-center-safe gap-1"><ExternalLink class="size-4" /> SHARE</span>
          </button>

          <button
            @click="showCalc = true"
            class="flex flex-col items-center justify-center py-2 px-6 rounded-full border-2 border-maurealty-blue text-maurealty-blue dark:text-maurealty-light-blue font-bold whitespace-nowrap hover:bg-maurealty-blue hover:text-white hover:shadow-md hover:-translate-y-0.75 transition cursor-pointer"
          >
            <span class="flex items-center gap-1.5"><CalculatorIcon class="size-4 shrink-0" /> CALCULATOR</span>
          </button>

          <button
            v-if="details.status !== 'sold' && details.is_bulk"
            @click="$emit('sold', details.listing_id)"
            class="flex flex-col items-center py-2 px-5 w-32 rounded-full border-2 border-maurealty-green text-maurealty-green font-bold hover:bg-maurealty-green hover:text-white hover:shadow-md hover:-translate-y-0.75 transition cursor-pointer"
          >
            <span class="flex items-center-safe gap-1"><BadgeCheck class="size-4" /> SOLD</span>
          </button>

          <button
            v-if="details.fact_sheet"
            @click="downloadFactSheet"
            class="flex flex-col items-center py-2 px-5 w-45 rounded-full border-2 border-maurealty-blue text-maurealty-blue dark:text-maurealty-light-blue font-bold hover:bg-maurealty-blue hover:text-white hover:shadow-md hover:-translate-y-0.75 transition cursor-pointer">
            <span class="flex items-center-safe gap-1"><DownloadIcon class="size-4" /> FACT SHEET</span>
          </button>
          
        </section>
      </div>

      <div v-else class="bg-white dark:bg-black w-10/12 h-11/12 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-900 flex flex-col items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-3 border-maurealty-blue dark:border-maurealty-light-blue mb-4"></div>
        <p class="text-maurealty-blue dark:text-maurealty-light-blue font-semibold">Loading property...</p>
      </div>

      <!-- CALCULATOR POPUP: reuses the accounting calculator, prefilled with this listing's price -->
      <div
        v-if="showCalc"
        class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,61,98,0.7)] backdrop-blur-sm p-4"
        @click.self="showCalc = false"
      >
        <div class="w-full max-w-md relative">
          <button class="absolute -top-3 -right-3 z-10 size-8 rounded-full bg-white dark:bg-black shadow-md text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer" @click="showCalc = false">✕</button>
          <CalculatorPanel :prefill-price="details?.price ?? undefined" />
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { formattedPropertyType } from '@/assets/classes/listings'
import { listingsService, compileMarkdown } from '@/services/listingsServices' 
import { generateShareLink } from '@/services/shareService'
import MapHolder from './MapHolder.vue'
import CalculatorPanel from '@/components/calculator/CalculatorPanel.vue'

import placeholder from '@/assets/images/default_placeholder.png'

import { formatPrice, formatArea } from '@/utils/conversion.ts';

import { XIcon, Building2Icon, MapPinIcon, UserStarIcon, ChevronLeft, ChevronRight, LandPlot, SquareDashed, Sofa, Toilet, BrushCleaning, Car, LifeBuoy, Check, CircleSmall, BedDouble, BookImage, Hash, Trash2, SquarePen, ExternalLink, BadgeCheck, DownloadIcon, Bed, Calculator as CalculatorIcon} from "lucide-vue-next";

// Toggles the calculator popup for this listing.
const showCalc = ref(false)

const props = defineProps<{ 
  prop_id: number,
  prop_type: string
 }>()

const emit = defineEmits(['closeDetails', 'edit', 'delete', 'share', 'sold'])

const propertyTypesMap: Record<string, number> = {
  'house_and_lot': 1,
  'lot_only': 2,
  'condominium': 3,
  'memorial': 4,
  'clubshare': 5,
  'golfshare': 6
};

const condoClassesMap: Record<number, string> = {
  1: 'Residential',
  2: 'Commercial',
  3: 'Industrial',
  4: 'Condotel',
  5: 'Timeshare'
};

const lotClassesMap: Record<number, string> = {
  1: 'Residential',
  2: 'Commercial',
  3: 'Industrial',
  4: 'Farm Lot'
};

const details = ref<any>(null)
const thumbnails = ref<string[]>([]);
const activeImage = ref<string>(''); 
const currentImageIndex = ref(0);

const updateImage = (i: number) => {
  if (i >= thumbnails.value.length) {
    i = 0;
  }
  else if (i < 0) {
    i = thumbnails.value.length - 1
  }

  const thumbValue = thumbnails.value[i];

  if (typeof thumbValue === 'string') {
    activeImage.value = thumbValue;
    currentImageIndex.value = i;
  }
}

const loadProperties = async () => {
  try {
    const typeId = propertyTypesMap[props.prop_type] || 1;
    const data = await listingsService.getListingById(props.prop_id, typeId) as any;
    
    if (data) {
      const rawSubData = data[props.prop_type];
      const subTableData = Array.isArray(rawSubData) ? rawSubData[0] : (rawSubData || {});

      details.value = {
        listing_id: data.listing_ID,
        agent_ID: data.agent_ID,
        listing_title: data.listing_title,
        price: data.price,
        max_price: data.max_price,
        location: data.location,
        lng: data.longitude,
        lat: data.latitude,
        description: data.description,
        created_at: new Date(data.created_at),
        status: data.status,
        faq: data.faq,
        fact_sheet: data.fact_sheet,
        
        agent_name: `${data.agents?.first_name || ''} ${data.agents?.last_name || ''}`.trim(),
        developer_name: data.developers?.name || 'None',
        property_type: data.property_type?.property_type || props.prop_type,
        is_bulk: data.is_bulk,
        
        ...subTableData
      };

      console.log(data.longitude, data.latitude);
      console.log("^Data | vForm\n");
      console.log(details.value.lng, details.value.lat);

      if (data.listing_images && data.listing_images.length > 0) {
        const sortedImages = data.listing_images.sort((a: any, b: any) => a.display_order - b.display_order);
        thumbnails.value = sortedImages.map((img: any) => img.image_url);
        activeImage.value = thumbnails.value[0]!; 
      } else {
        thumbnails.value = [placeholder];
        activeImage.value = placeholder;
      }
    }
  } catch (error) {
    console.error("Error fetching full listing details:", error);
  }
}

// to prevent duplicate share links from being created 
const isShareCooldown = ref(false);

const handleShare = async () => {
  if (isShareCooldown.value) return;

  if (!details.value || !details.value.listing_id || !details.value.agent_ID) {
    alert('Listing details are incomplete. Cannot generate link.');
    return;
  }

  try {
    isShareCooldown.value = true;
    const shareData = await generateShareLink(details.value.listing_id, details.value.agent_ID, 1);
    const shareUrl = `${window.location.origin}/shared/listing/${shareData.share_id}`;
    
    await navigator.clipboard.writeText(shareUrl);
    alert('Temporary link copied to clipboard!');
    emit('share');
  } catch (error) {
    console.error('Error generating link:', error);
    alert('Failed to generate link.');
  } finally {
    setTimeout(() => {
      isShareCooldown.value = false;
    }, 5000);
  }
};

function getCondoType () {
  if (!details.value) return 'N/A'
  if (details.value.is_studio_type) return 'Studio'
  else if (details.value.is_BR_unit) return 'BR Unit'
  else if (details.value.is_villa) return 'Villa'
  else if (details.value.is_garden_villa) return 'Garden Villa'
  else if (details.value.is_penthouse) return 'Penthouse'
  else return 'N/A'
}

function getMemorialType () {
  if (!details.value) return 'N/A';
  if (details.value.is_urn) return 'Urn'
  else if (details.value.is_vault) return 'Vault'
  else if (details.value.is_garden) return 'Garden'
  else if (details.value.is_estate) return 'Estate'
  else if (details.value.is_family_estate) return 'Family Estate'
  else if (details.value.is_pet_memorial) return 'Pet Memorial'
  else return 'N/A'
}

watch(() => props.prop_id, (newId) => {
  if (newId) {
    details.value = null;
    loadProperties()
  }
}, { immediate: true })


// description markdown conversion and input
const compiledDescriptionMarkdown = computed(() => {
  return compileMarkdown(details.value?.description)
});

// FAQ markdown conversion and input
const compiledFAQMarkdown = computed(() => {
  if (details.value.faq)
    return compileMarkdown("# FREQUENTLY ASKED QUESTIONS\n\n" + details.value.faq);
  else
    return '';
});

// thank you Gemini
const downloadFactSheet = async () => {
  if (!details.value || !details.value.fact_sheet) return;

  try {
    // 1. Fetch the file data as a blob to bypass cross-origin browser view behaviors
    const response = await fetch(details.value.fact_sheet);
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();

    // 2. Extract a filename from the end of the Supabase storage URL
    const fileUrl = details.value.fact_sheet;
    let fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1) || 'fact_sheet.pdf';

    // Regex to strip out "listingID-Timestamp-" prefix if present
    const prefixRegex = /^\d+-\d+-/;
    if (prefixRegex.test(fileName)) {
      fileName = fileName.replace(prefixRegex, ''); 
    }

    // 3. Create a local object URL from the blob
    const blobUrl = window.URL.createObjectURL(blob);
    
    // 4. Trigger the programatic download anchor click
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName; // Safely assign the string name here
    document.body.appendChild(link);
    link.click();
    
    // 5. Cleanup DOM elements and memory objects
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err: any) {
    console.error('Error downloading file:', err.message);
    alert('Failed to download file. Opening directly instead.');
    
    // Fallback: If fetch fails due to strict CORS settings, attempt a direct open
    window.open(details.value.fact_sheet, '_blank');
  } 
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background-color: transparent;
  margin-block: 25px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #1E3A8A; 
  border-radius: 9999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #172b66; 
}
</style>