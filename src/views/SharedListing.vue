<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-10">
    
    <div v-if="loading" class="text-xl font-semibold text-maurealty-blue">
      Loading property details...
    </div>

    <div v-else-if="error" class="text-xl font-bold text-red-600 bg-white p-8 rounded-xl shadow-md">
      {{ error }}
    </div>

    <div v-else-if="details" class="bg-white w-10/12 max-w-6xl rounded-3xl shadow-2xl border border-gray-100 px-10 py-7">
      <header class="relative mb-4">
        <h1 class="text-3xl max-w-19/20 font-extrabold text-maurealty-blue">
          {{ details.listing_title }}
        </h1>
      </header>

      <hr width="100%" class="mb-4 text-maurealty-blue/30">

      <main class="flex gap-12 mx-4 flex-col lg:flex-row">
        
        <div class="grow lg:w-3/5 flex flex-col gap-6">
          
          <div class="relative flex gap-4 items-center">
              <div class="relative grow aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                <img 
                  :src="thumbnails[currentImageIndex]"
                  alt="Property Main View" 
                  class="absolute inset-0 w-full h-full object-contain"
                />  
              </div>

              <button 
                class="absolute left-2 w-8 h-18 bg-slate-500/30 backdrop-blur-xs self-center rounded flex items-center justify-center text-black text-4xl hover:bg-slate-500/60 hover:text-maurealty-blue cursor-pointer"
                @click="updateImage(currentImageIndex - 1)">
                <ChevronLeft stroke-width=2.75 />
              </button>

              <button 
                class="absolute right-2 w-8 h-18 bg-slate-500/30 backdrop-blur-xs self-center rounded flex items-center justify-center text-black text-4xl hover:bg-slate-500/60 hover:text-maurealty-blue cursor-pointer"
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
                class="w-32 h-24 rounded-lg object-cover cursor-pointer hover:ring-2 hover:ring-maurealty-blue"
                :class="[index == currentImageIndex ? 'opacity-50' : '']"
              />
            </div>
          </div>

        <div class="lg:w-2/5 flex flex-col gap-2 text-gray-800 text-lg">
          <span class="inline-block bg-maurealty-green w-fit text-2xl text-white px-4 py-0.5 rounded-full tracking-wider mt-0.5">
            ₱ {{ Number(details.price).toLocaleString() }}
          </span>

          <span class="flex items-center gap-1.5 font-semibold">
            <Building2Icon class="size-6" color="#000000" />
            {{ formattedPropertyType(details.property_type) }}
          </span>

          <span class="flex items-center gap-1.5 font-semibold">
            <MapPinIcon class="size-6" color="#000000" />
            {{ details.location }}
          </span>

          <span class="flex items-center gap-1.5">
            <UserStarIcon class="size-6" color="#000000" />
            <p>{{ details.agent_name }}</p>
          </span>
          
          <p class="text-sm text-gray-500">Listed on: {{ new Date(details.created_at).toLocaleDateString() }}</p>

          <span class="flex items-center-safe mt-2 text-xl" v-if="details.developer_name">
            <p class="font-semibold">Developed by:</p>
            <p class="ml-2.5">{{ details.developer_name }}</p>
          </span>
          
          <template v-if="details.property_type === 'house_and_lot' && details.house_and_lot">
            <fieldset class="border border-maurealty-blue/20 rounded-xl px-4 py-2 w-full mt-2">
              <legend class="px-2 font-semibold text-maurealty-blue">House and Lot Features</legend>
              <main class="text-sm px-2 flex flex-col">
                <div class="grid grid-cols-2 gap-y-0.5">
                  <span class="flex items-center-safe gap-1"><LandPlot /> <b> Lot Area: </b> {{ details.house_and_lot[0]?.lot_area }} sqm</span>
                  <span class="flex items-center-safe gap-1"><SquareDashed /> <b> Floor Area: </b> {{ details.house_and_lot[0]?.floor_area }} sqm</span>
                  <span class="flex items-center-safe gap-1"><Sofa /> {{ details.house_and_lot[0]?.rooms_count }} room(s)</span>
                  <span class="flex items-center-safe gap-1"><Toilet /> {{ details.house_and_lot[0]?.toilets_count }} toilet(s)</span>
                </div>
              </main>
            </fieldset>
          </template>

          <template v-if="details.property_type === 'lot_only' && details.lot_only">
            <fieldset class="border border-maurealty-blue/20 rounded-xl px-4 py-2 w-full mt-2">
              <legend class="px-2 font-semibold text-maurealty-blue">Lot Features</legend>
              <main class="text-sm px-2 flex flex-col">
                <div class="grid grid-cols-2">
                  <div>
                    <span class="flex items-center-safe gap-1"><CircleSmall class="size-3.5" /> Block No. <b>{{ details.lot_only[0]?.block_number }}</b></span>
                    <span class="flex items-center-safe gap-1"><CircleSmall class="size-3.5" /> Lot No. <b>{{ details.lot_only[0]?.lot_number }}</b></span>
                    <span class="flex items-center-safe gap-1"><CircleSmall class="size-3.5" /> Phase No. <b>{{ details.lot_only[0]?.phase_number }}</b></span>  
                  </div>
                  <div>
                    <span class="flex items-center-safe gap-1"><SquareDashed /> {{ details.lot_only[0]?.lot_area }} sqm</span>
                  </div>
                </div>
                
                <div class="mt-2 pb-2 flex gap-2">
                  <p class="font-bold text-xl text-maurealty-blue">Class:</p>
                  <p class="text-xl">{{ lotClassesMap[details.lot_only[0]?.lot_class_ID] || 'N/A' }}</p>
                </div>
              </main>
            </fieldset>
          </template>

          <template v-if="details.property_type === 'condominium' && details.condominium">
            <fieldset class="border border-maurealty-blue/20 rounded-xl px-4 py-2 w-full mt-2">
              <legend class="px-2 font-semibold text-maurealty-blue">Condominium Features</legend>
              <main class="text-sm px-2 flex flex-col">
                <div class="grid grid-cols-2">
                  <span class="flex items-center-safe gap-1"><Hash /> Unit No. <b>{{ details.condominium[0]?.unit_number }}</b></span>
                  <span class="flex items-center-safe gap-1"><BedDouble /> {{ details.condominium[0]?.bedroom_count }} bedroom(s)</span>
                  <span class="flex items-center-safe gap-1"><BookImage /> {{ details.condominium[0]?.balcony_count }} balcony(s)</span>
                  <span class="flex items-center-safe gap-1"><Car /> {{ details.condominium[0]?.carpark_count }} carpark(s)</span>
                </div>
                
                <div class="mt-2 flex gap-2">
                  <p class="font-bold text-xl text-maurealty-blue">Class:</p>
                  <p class="text-xl">{{ condoClassesMap[details.condominium[0]?.condo_class_ID] || 'N/A' }}</p>
                </div>
                <div class="pb-2 flex gap-2">
                  <p class="font-bold text-xl text-maurealty-blue">Type:</p>
                  <p class="text-xl">{{ getCondoType(details.condominium[0]) }}</p>
                </div>
              </main>
            </fieldset>
          </template>

          <template v-if="details.property_type === 'memorial' && details.memorial">
            <fieldset class="border border-maurealty-blue/20 rounded-xl px-4 py-2 w-full mt-2">
              <legend class="px-2 font-semibold text-maurealty-blue">Memorial Features</legend>
              <main class="text-sm px-2 flex flex-col">
                <div class="pb-2 flex gap-2">
                  <p class="font-bold text-xl text-maurealty-blue">Type:</p>
                  <p class="text-xl">{{ getMemorialType(details.memorial[0]) }}</p>
                </div>
              </main>
            </fieldset>
          </template>

          <section class="mt-4 text-base bg-gray-50 p-4 rounded-xl border border-gray-100">
            {{ details.description }}
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getSharedListing } from '@/services/shareService';
import { formattedPropertyType } from '@/assets/classes/listings';

import { 
  Building2Icon, MapPinIcon, UserStarIcon, ChevronLeft, ChevronRight, 
  LandPlot, SquareDashed, Sofa, Toilet, Car, CircleSmall, BedDouble, 
  BookImage, Hash 
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

    details.value = {
      ...mainListing,
      property_type: mainListing.property_type_ID === 1 ? 'house_and_lot' : 
                     mainListing.property_type_ID === 2 ? 'lot_only' :
                     mainListing.property_type_ID === 3 ? 'condominium' : 'memorial',
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
</script>