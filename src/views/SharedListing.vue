<template>
  <div class="min-h-screen bg-background-gray flex flex-col">

    <!-- PUBLIC BRAND HEADER -->
    <header class="w-full bg-linear-to-r from-[#A9D6FF70] to-[#FFFFFF] shadow-md px-6 md:px-10 py-4 flex items-center gap-3">
      <img src="@/assets/images/Maurealty.png" alt="MauRealty" class="h-9 w-auto" />
      <span class="text-maurealty-blue font-extrabold text-lg md:text-xl tracking-tight">MauRealty &amp; Brokerage</span>
    </header>

    <div class="flex-1 flex items-start justify-center py-8 px-4">

      <div v-if="loading" class="text-xl font-semibold text-maurealty-blue mt-20">
        Loading property details...
      </div>

      <div v-else-if="error" class="text-xl font-bold text-red-600 bg-white p-8 rounded-xl shadow-md mt-20">
        {{ error }}
      </div>

      <div v-else-if="details" class="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-gray-100 px-6 md:px-10 py-7">
        <header class="relative mb-4">
          <h1 class="text-2xl sm:text-3xl max-w-19/20 font-extrabold text-maurealty-blue">
            {{ details.listing_title || 'Untitled Listing' }}
          </h1>
        </header>

        <hr class="mb-6 border-maurealty-blue/20">

        <main class="flex gap-6 lg:gap-12 mx-1 md:mx-4 flex-col lg:flex-row">

          <!-- LEFT: gallery -->
          <div class="grow lg:w-3/5 flex flex-col gap-6">
            <div class="relative flex gap-4 items-center">
              <div class="relative grow aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                <img
                  :src="thumbnails[currentImageIndex] || placeholder"
                  alt="Property Main View"
                  class="absolute inset-0 w-full h-full object-contain"
                />
              </div>

              <button v-if="thumbnails.length > 1"
                class="absolute left-2 w-8 h-18 bg-slate-500/30 backdrop-blur-xs self-center rounded flex items-center justify-center text-black text-4xl hover:bg-slate-500/60 hover:text-maurealty-blue cursor-pointer"
                @click="updateImage(currentImageIndex - 1)">
                <ChevronLeft stroke-width="2.75" />
              </button>

              <button v-if="thumbnails.length > 1"
                class="absolute right-2 w-8 h-18 bg-slate-500/30 backdrop-blur-xs self-center rounded flex items-center justify-center text-black text-4xl hover:bg-slate-500/60 hover:text-maurealty-blue cursor-pointer"
                @click="updateImage(currentImageIndex + 1)">
                <ChevronRight stroke-width="2.75" />
              </button>
            </div>

            <div v-if="thumbnails.length > 1" class="flex gap-4 flex-wrap">
              <img
                v-for="(thumb, index) in thumbnails"
                :key="index"
                :src="thumb"
                @click="updateImage(index)"
                alt="Property thumbnail"
                class="w-20 h-14 sm:w-32 sm:h-24 rounded-lg object-cover cursor-pointer hover:ring-2 hover:ring-maurealty-blue"
                :class="[index == currentImageIndex ? 'opacity-50' : '']"
              />
            </div>
          </div>

          <!-- RIGHT: details -->
          <div class="lg:w-2/5 flex flex-col gap-2 text-gray-800 text-lg">
            <span class="inline-block bg-maurealty-green w-fit text-2xl text-white px-4 py-0.5 rounded-full tracking-wider mt-0.5">
              {{ formatPrice(details.price ?? 0) }}
            </span>

            <span class="flex items-center gap-1.5 font-semibold">
              <Building2Icon class="size-6" color="#000000" />
              {{ formattedPropertyType(details.property_type) }}
            </span>

            <span class="flex items-center gap-1.5 font-semibold">
              <MapPinIcon class="size-6" color="#000000" />
              {{ details.location }}
            </span>

            <section class="w-full h-64 rounded-xl overflow-hidden border border-gray-200">
              <MapHolder :target-location="{ lng: details.longitude, lat: details.latitude }" :listing-id="details.listing_ID" />
            </section>

            <span class="flex items-center gap-1.5">
              <UserStarIcon class="size-6" color="#000000" />
              <p>{{ details.agent_name }}</p>
            </span>

            <p class="text-sm text-gray-500">Listed on: {{ new Date(details.created_at).toLocaleDateString() }}</p>

            <span class="flex items-center-safe mt-2 text-xl" v-if="details.developer_name">
              <p class="font-semibold">Developed by:</p>
              <p class="ml-2.5">{{ details.developer_name }}</p>
            </span>

            <!-- HOUSE AND LOT -->
            <template v-if="details.property_type === 'house_and_lot' && details.house_and_lot">
              <fieldset class="border border-maurealty-blue/20 rounded-xl px-4 py-2 w-full mt-2">
                <legend class="px-2 font-semibold text-maurealty-blue">House and Lot Features</legend>
                <main class="text-sm px-2 flex flex-col">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-0.5">
                    <span class="flex items-center-safe gap-1"><LandPlot /> <b> Lot Area: </b> {{ formatArea(details.house_and_lot.lot_area) }}</span>
                    <span class="flex items-center-safe gap-1"><SquareDashed /> <b> Floor Area: </b> {{ formatArea(details.house_and_lot.floor_area) }}</span>
                    <span class="flex items-center-safe gap-1"><Sofa /> {{ details.house_and_lot.rooms_count }} room{{ details.house_and_lot.rooms_count != 1 ? 's' : '' }}</span>
                    <span class="flex items-center-safe gap-1"><Toilet /> {{ details.house_and_lot.toilets_count }} toilet{{ details.house_and_lot.toilets_count != 1 ? 's' : '' }}</span>
                    <span class="flex items-center-safe gap-1 sm:col-span-2" v-if="details.house_and_lot.master_bedroom_area"><BedDouble /> <b> Master Bedroom Area: </b> {{ formatArea(details.house_and_lot.master_bedroom_area) }}</span>
                  </div>

                  <span class="flex items-center-safe justify-around pr-2 mt-3">
                    <p class="flex items-center-safe gap-1" v-if="details.house_and_lot.helper_rooms_count > 0">
                      <BrushCleaning class="size-4" /> {{ details.house_and_lot.helper_rooms_count }} helper room{{ details.house_and_lot.helper_rooms_count != 1 ? 's' : '' }}
                    </p>
                    <p v-if="details.house_and_lot.driver_rooms_count > 0 && details.house_and_lot.helper_rooms_count > 0">|</p>
                    <p class="flex items-center-safe gap-1" v-if="details.house_and_lot.driver_rooms_count > 0">
                      <LifeBuoy class="size-3" /> {{ details.house_and_lot.driver_rooms_count }} driver room{{ details.house_and_lot.driver_rooms_count != 1 ? 's' : '' }}
                    </p>
                    <p v-if="(details.house_and_lot.helper_rooms_count > 0 || details.house_and_lot.driver_rooms_count > 0) && details.house_and_lot.carpark_count > 0">|</p>
                    <p class="flex items-center-safe gap-1" v-if="details.house_and_lot.carpark_count > 0">
                      <Car class="size-4" /> {{ details.house_and_lot.carpark_count }} carpark{{ details.house_and_lot.carpark_count != 1 ? 's' : '' }}
                    </p>
                  </span>

                  <div class="mt-3">
                    <ul class="grid grid-cols-2 sm:grid-cols-3">
                      <li v-if="details.house_and_lot['1_storey']" class="flex items-center-safe gap-1"><Check class="size-5" /> One Storey</li>
                      <li v-if="details.house_and_lot['2_storey']" class="flex items-center-safe gap-1"><Check class="size-5" /> Two Storey</li>
                      <li v-if="details.house_and_lot.with_loft" class="flex items-center-safe gap-1"><Check class="size-5" /> With Loft</li>
                      <li v-if="details.house_and_lot.townhomes" class="flex items-center-safe gap-1"><Check class="size-5" /> Townhome</li>
                      <li v-if="details.house_and_lot.rowhouse" class="flex items-center-safe gap-1"><Check class="size-5" /> Rowhouse</li>
                    </ul>
                  </div>
                </main>
              </fieldset>
            </template>

            <!-- LOT ONLY -->
            <template v-if="details.property_type === 'lot_only' && details.lot_only">
              <fieldset class="border border-maurealty-blue/20 rounded-xl px-4 py-2 w-full mt-2">
                <legend class="px-2 font-semibold text-maurealty-blue">Lot Features</legend>
                <main class="text-sm px-2 flex flex-col">
                  <div class="grid grid-cols-1 sm:grid-cols-2">
                    <div>
                      <span class="flex items-center-safe gap-1"><CircleSmall class="size-3.5" /> Block No. <b>{{ details.lot_only.block_number }}</b></span>
                      <span class="flex items-center-safe gap-1"><CircleSmall class="size-3.5" /> Lot No. <b>{{ details.lot_only.lot_number }}</b></span>
                      <span class="flex items-center-safe gap-1"><CircleSmall class="size-3.5" /> Phase No. <b>{{ details.lot_only.phase_number }}</b></span>
                    </div>
                    <div>
                      <span class="flex items-center-safe gap-1"><SquareDashed /> {{ formatArea(details.lot_only.lot_area) }}</span>
                    </div>
                  </div>

                  <div class="mt-2 pb-2 flex gap-2">
                    <p class="font-bold text-xl text-maurealty-blue">Class:</p>
                    <p class="text-xl">{{ lotClassesMap[details.lot_only.lot_class_ID] || 'N/A' }}</p>
                  </div>
                </main>
              </fieldset>
            </template>

            <!-- CONDOMINIUM -->
            <template v-if="details.property_type === 'condominium' && details.condominium">
              <fieldset class="border border-maurealty-blue/20 rounded-xl px-4 py-2 w-full mt-2">
                <legend class="px-2 font-semibold text-maurealty-blue">Condominium Features</legend>
                <main class="text-sm px-2 flex flex-col">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-0.5">
                    <span class="flex items-center-safe gap-1"><Hash /> Unit No. <b>{{ details.condominium.unit_number }}</b></span>
                    <span class="flex items-center-safe gap-1"><BedDouble /> {{ details.condominium.bedroom_count }} bedroom{{ details.condominium.bedroom_count != 1 ? 's' : '' }}</span>
                    <span class="flex items-center-safe gap-1"><BookImage /> {{ details.condominium.balcony_count }} balcon{{ details.condominium.balcony_count != 1 ? 'ies' : 'y' }}</span>
                    <span class="flex items-center-safe gap-1"><Car /> {{ details.condominium.carpark_count }} carpark{{ details.condominium.carpark_count != 1 ? 's' : '' }}</span>
                    <span class="flex items-center-safe gap-1 sm:col-span-2" v-if="details.condominium.master_bedroom_area"><BedDouble /> <b> Master Bedroom Area: </b> {{ formatArea(details.condominium.master_bedroom_area) }}</span>
                  </div>

                  <div class="mt-4 flex gap-2">
                    <p class="font-bold text-xl text-maurealty-blue">Class:</p>
                    <p class="text-xl">{{ condoClassesMap[details.condominium.condo_class_ID] || 'N/A' }}</p>
                  </div>
                  <div class="pb-2 flex gap-2">
                    <p class="font-bold text-xl text-maurealty-blue">Type:</p>
                    <p class="text-xl">{{ getCondoType(details.condominium) }}</p>
                  </div>
                </main>
              </fieldset>
            </template>

            <!-- MEMORIAL -->
            <template v-if="details.property_type === 'memorial' && details.memorial">
              <fieldset class="border border-maurealty-blue/20 rounded-xl px-4 py-2 w-full mt-2">
                <legend class="px-2 font-semibold text-maurealty-blue">Memorial Features</legend>
                <main class="text-sm px-2 flex flex-col">
                  <div class="pb-2 flex gap-2">
                    <p class="font-bold text-xl text-maurealty-blue">Type:</p>
                    <p class="text-xl">{{ getMemorialType(details.memorial) }}</p>
                  </div>
                </main>
              </fieldset>
            </template>

            <!-- Description -->
            <section class="mt-2 markdownTypography max-w-none" v-html="compiledMarkdown" />
          </div>
        </main>

        <!-- FAQs -->
        <section v-if="compiledFAQMarkdown" class="p-5 border border-maurealty-blue/20 rounded-3xl w-full mt-10">
          <section class="markdownTypography max-w-none" v-html="compiledFAQMarkdown" />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getSharedListing } from '@/services/shareService';
import { formattedPropertyType } from '@/assets/classes/listings';
import { compileMarkdown } from '@/services/listingsServices';
import { formatPrice, formatArea } from '@/utils/conversion.ts';
import placeholder from '@/assets/images/default_placeholder.png';

import MapHolder from '@/components/listings/MapHolder.vue';

import {
  Building2Icon, MapPinIcon, UserStarIcon, ChevronLeft, ChevronRight,
  LandPlot, SquareDashed, Sofa, Toilet, Car, CircleSmall, BedDouble,
  BookImage, Hash, BrushCleaning, LifeBuoy, Check
} from "lucide-vue-next";

const route = useRoute();
const loading = ref(true);
const error = ref<string | null>(null);
const details = ref<any>(null);
const thumbnails = ref<string[]>([]);
const currentImageIndex = ref(0);

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

const updateImage = (i: number) => {
  if (i >= thumbnails.value.length) {
    i = 0;
  }
  else if (i < 0) {
    i = thumbnails.value.length - 1
  }

  const thumbValue = thumbnails.value[i];

  if (typeof thumbValue === 'string') {
    currentImageIndex.value = i;
  }
}

const loadListing = async () => {
  const token = route.params.token as string;
  try {
    const data = await getSharedListing(token);
    const mainListing = data.main_listings;

    // map for all property types
    const typeMap: Record<number, string> ={
      1: 'house_and_lot',
      2: 'lot_only',
      3: 'condominium',
      4: 'memorial',
      5: 'clubshare',
      6: 'golfshare'
    };

    details.value = {
      ...mainListing,
      house_and_lot: Array.isArray(mainListing.house_and_lot) ? mainListing.house_and_lot[0] : mainListing.house_and_lot,
      lot_only: Array.isArray(mainListing.lot_only) ? mainListing.lot_only[0] : mainListing.lot_only,
      condominium: Array.isArray(mainListing.condominium) ? mainListing.condominium[0] : mainListing.condominium,
      memorial: Array.isArray(mainListing.memorial) ? mainListing.memorial[0] : mainListing.memorial,

      property_type: typeMap[mainListing.property_type_ID] || 'unknown',

      agent_name: mainListing.agents ? `${mainListing.agents.first_name} ${mainListing.agents.last_name}` : 'Unknown Agent',
      developer_name: mainListing.developers ? mainListing.developers.name : null,
    };

    if (mainListing.listing_images && mainListing.listing_images.length > 0) {
      thumbnails.value = mainListing.listing_images.map((img: any) => img.image_url);
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load listing or the link is invalid.';
  } finally {
    loading.value = false;
  }
};

function getCondoType(condoData: any) {
  if (!condoData) return 'N/A';
  if (condoData.is_studio_type) return 'Studio';
  if (condoData.is_BR_unit) return 'BR Unit';
  if (condoData.is_villa) return 'Villa';
  if (condoData.is_garden_villa) return 'Garden Villa';
  if (condoData.is_penthouse) return 'Penthouse';
  return 'N/A';
}

function getMemorialType(memorialData: any) {
  if (!memorialData) return 'N/A';
  if (memorialData.is_urn) return 'Urn';
  if (memorialData.is_vault) return 'Vault';
  if (memorialData.is_garden) return 'Garden';
  if (memorialData.is_estate) return 'Estate';
  if (memorialData.is_family_estate) return 'Family Estate';
  if (memorialData.is_pet_memorial) return 'Pet Memorial';
  return 'N/A';
}

onMounted(() => {
  loadListing();
});

// description markdown conversion
const compiledMarkdown = computed(() => {
  return compileMarkdown(details.value?.description)
});

// FAQ markdown conversion (commission is intentionally never shown on shared links)
const compiledFAQMarkdown = computed(() => {
  if (details.value?.faq) {
    return compileMarkdown("# FREQUENTLY ASKED QUESTIONS\n\n" + details.value.faq)
  }
  return ''
});
</script>
