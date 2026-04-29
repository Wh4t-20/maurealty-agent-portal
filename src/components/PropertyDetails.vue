<template>
<div v-if="details && details.listing_title" class="absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-sm">
  <div class="custom-scrollbar bg-white w-10/12 h-11/12 rounded-3xl shadow-2xl border border-gray-100 px-10 py-7 overflow-y-auto">
        <header class="relative mb-4">
          <h1 class="text-3xl max-w-19/20 font-extrabold text-maurealty-blue">
            {{ details.listing_title }}
          </h1>

          <button class="absolute top-0 right-0 p-3 rounded-full hover:bg-gray-200/40 transition-colors cursor-pointer" @click="$emit('closeDetails')">
            <XIcon class="size-5" stroke-width="3"/>
          </button>
        </header>

        <hr width="100%" class="mb-4 text-maurealty-blue/30">

        <main class="flex gap-12 mx-4">
          
          <div class="grow w-3/5 flex flex-col gap-6">
            
            <div class="relative flex gap-4 items-center">
              <div class="relative grow aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                <img 
                  :src="activeImage || house2"
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

          <div class="w-2/5 flex flex-col gap-2 text-gray-800 text-lg">
            <span class="inline-block bg-maurealty-green w-fit text-2xl text-white px-4 py-0.5 rounded-full tracking-wider mt-0.5">
              ₱ {{ details.price.toLocaleString() }}
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
              <p>{{ details.agent_name || 'N/A' }}</p>
              <p class="italic text-gray-700">- {{ details.commission }}% Commision</p>
            </span>
            
            <p class="text-sm text-gray-500">Created on: {{ details.created_at.toLocaleDateString() }}</p>

            <span class="flex items-center-safe mt-2 text-xl">
              <p class="font-semibold">Developed by:</p>
              <p class="ml-2.5">{{ details.developer_name }}</p>
            </span>
            
            <template v-if="details.property_type === 'house_and_lot'">
              <fieldset class="border border-maurealty-blue/20 rounded-xl px-4 py-2 w-full">
                <legend class="px-2 font-semibold text-maurealty-blue">House and Lot Features</legend>
                <main class="text-sm px-2 flex flex-col">
                  <div class="grid grid-cols-2 gap-y-0.5">
                    <span class="flex items-center-safe gap-1"><LandPlot /> <b> Lot Area: </b> {{ details.lot_area }} sqm</span>
                    <span class="flex items-center-safe gap-1"><SquareDashed /> <b> Floor Area: </b> {{ details.floor_area }} sqm</span>
                    <span class="flex items-center-safe gap-1"><Sofa /> {{ details.rooms_count }} room{{ details.rooms_count != 1 ? 's' : '' }}</span>
                    <span class="flex items-center-safe gap-1"><Toilet /> {{ details.toilets_count }} toilet{{ details.s_count != 1 ? 's' : '' }}</span>
                  </div>
    
                  <span class="flex items-center-safe justify-around pr-2 mt-3">
                    <p class="flex items-center-safe gap-1" v-if="details.helper_rooms_count > 0">
                      <BrushCleaning class="size-4" /> {{ details.helper_rooms_count }} helper room{{ details.helper_rooms_count != 1 ? 's' : '' }}
                    </p>
                    <p v-if="details.driver_room_count > 0 || details.carpark_count > 0">|</p>
                    <p class="flex items-center-safe gap-1" v-if="details.driver_rooms_count > 0">
                      <LifeBuoy class="size-3" /> {{ details.driver_rooms_count }} driver room{{ details.driver_rooms_count != 1 ? 's' : '' }}
                    </p> 
                    <p v-if="details.carpark_count > 0">|</p>
                    <p class="flex items-center-safe gap-1" v-if="details.carpark_count > 0">
                      <Car class="size-4" /> {{ details.carpark_count }} carpark{{ details.carpark_count != 1 ? 's' : '' }}
                    </p>
                   </span> 

                  <div class="mt-3">
                    <ul class="grid grid-cols-3">
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

            <template v-if="details.property_type === 'lot_only'">
              <fieldset class="border border-maurealty-blue/20 rounded-xl px-4 py-2 w-full">
                <legend class="px-2 font-semibold text-maurealty-blue">Lot Features</legend>
                <main class="text-sm px-2 flex flex-col">
                  <div class="grid grid-cols-2">
                    <div>
                      <span class="flex items-center-safe gap-1"><CircleSmall class="size-3.5" /> Block No. <b>{{ details.block_number }}</b></span>
                      <span class="flex items-center-safe gap-1"><CircleSmall class="size-3.5" /> Lot No. <b>{{ details.lot_number }}</b></span>
                      <span class="flex items-center-safe gap-1"><CircleSmall class="size-3.5" /> Phase No. <b>{{ details.phase_number }}</b></span>  
                    </div>
                    <div>
                      <span class="flex items-center-safe gap-1"><SquareDashed /> {{ details.lot_area }} sqm</span>
                    </div>
                  </div>
                  
                  <div class="mt-2 pb-2 flex gap-2">
                    <p class="font-bold text-xl text-maurealty-blue">Class:</p>
                    <p class="text-xl">{{ lotClassesMap[details.lot_class_ID] || 'N/A' }}</p>
                  </div>
                </main>
              </fieldset>
            </template>

            <template v-if="details.property_type === 'condominium'">
              <fieldset class="border border-maurealty-blue/20 rounded-xl px-4 py-2 w-full">
                <legend class="px-2 font-semibold text-maurealty-blue">Condominium Features</legend>
                <main class="text-sm px-2 flex flex-col">
                  <div class="grid grid-cols-2">
                    <span class="flex items-center-safe gap-1"><Hash /> Unit No. <b>{{ details.unit_number }}</b></span>
                    <span class="flex items-center-safe gap-1"><BedDouble /> {{ details.bedroom_count }} bedroom{{ details.carpark_count != 1 ? 's' : '' }}</span>
                    <span class="flex items-center-safe gap-1"><BookImage /> {{ details.balcony_count }} balcon{{ details.carpark_count != 1 ? 'ies' : 'y' }}</span>
                    <span class="flex items-center-safe gap-1"><Car /> {{ details.carpark_count }} carpark{{ details.carpark_count != 1 ? 's' : '' }}</span>
                  </div>
                  
                  <div class="mt-2 flex gap-2">
                    <p class="font-bold text-xl text-maurealty-blue">Class:</p>
                    <p class="text-xl">{{ condoClassesMap[details.condo_class_ID] || 'N/A' }}</p>
                  </div>
                  <div class="pb-2 flex gap-2">
                    <p class="font-bold text-xl text-maurealty-blue">Type:</p>
                    <p class="text-xl">{{ getCondoType() }}</p>
                  </div>
                </main>
              </fieldset>
            </template>

            <template v-if="details.property_type === 'memorial'">
              <fieldset class="border border-maurealty-blue/20 rounded-xl px-4 py-2 w-full">
                <legend class="px-2 font-semibold text-maurealty-blue">Memorial Features</legend>
                <main class="text-sm px-2 flex flex-col">
                  <div class="pb-2 flex gap-2">
                    <p class="font-bold text-xl text-maurealty-blue">Type:</p>
                    <p class="text-xl">{{ getMemorialType() }}</p>
                  </div>
                </main>
              </fieldset>
            </template>

            <section class="mt-2 text-base">
              {{ details.description }}
            </section>
          </div>
        </main>

        <section class="w-full flex mt-4 px-3 gap-4">
          <button @click="$emit('edit', details)" class="flex flex-col items-center py-2 px-5 w-32 rounded-full border-2 border-maurealty-blue text-maurealty-blue font-bold hover:bg-maurealty-blue hover:text-white hover:shadow-md hover:-translate-y-0.75 transition cursor-pointer">
            <span class="flex items-center-safe gap-1"><SquarePen class="size-4" /> EDIT</span>
          </button>

          <button @click="$emit('delete', details.listing_id)" class="flex flex-col items-center py-2 px-5 w-32 rounded-full border-2 border-red-600 text-red-600 font-bold hover:bg-red-600 hover:text-white hover:shadow-md hover:-translate-y-0.75 transition cursor-pointer">
            <span class="flex items-center-safe gap-1"><Trash2 class="size-4" /> DELETE</span>
          </button>

          <button @click="$emit('share')" class="flex flex-col items-center py-2 px-5 w-32 rounded-full border-2 border-maurealty-blue text-maurealty-blue font-bold hover:bg-maurealty-blue hover:text-white hover:shadow-md hover:-translate-y-0.75 transition cursor-pointer">
            <span class="flex items-center-safe gap-1"><ExternalLink class="size-4" /> SHARE</span>
          </button>
        </section>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { type Property, formattedPropertyType } from '@/assets/classes/listings'
import { listingsService } from '@/services/listingsServices' 

import house1 from '@/assets/images/sample-house.jpg'
import house2 from '@/assets/images/house2.webp'

import { XIcon, Building2Icon, MapPinIcon, UserStarIcon, ChevronLeft, ChevronRight, LandPlot, SquareDashed, Sofa, Toilet, BrushCleaning, Car, LifeBuoy, Check, CircleSmall, BedDouble, BookImage, Hash, Trash2, SquarePen, ExternalLink } from "lucide-vue-next";

const props = defineProps<{ 
  prop_id: number,
  prop_type: string
 }>()


const emit = defineEmits(['closeDetails', 'edit', 'delete', 'share'])

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
//gikapoi naq sig map
const lotClassesMap: Record<number, string> = {
  1: 'Residential',
  2: 'Commercial',
  3: 'Industrial',
  4: 'Farm Lot'
};

const details = ref<any>(null)
const thumbnails = ref<string[]>([]);
//i image
const activeImage = ref<string>(''); 
const currentImageIndex = ref(0);

const updateImage = (i: number) => {
  if (i >= thumbnails.value.length) {
    i = 0;
  }
  else if (i < 0) {
    i = thumbnails.value.length - 1
  }

  // so that it aint gonna have any errors with being undefined
  const thumbValue = thumbnails.value[i];

  if (typeof thumbValue === 'string') {
    activeImage.value = thumbValue;
    currentImageIndex.value = i;
  }
}

const loadProperties = async () => {
  try {
    const typeId = propertyTypesMap[props.prop_type] || 1;
    
    // Fetch data from database
    const data = await listingsService.getListingById(props.prop_id, typeId) as any;
    
    if (data) {
      const rawSubData = data[props.prop_type];
      const subTableData = Array.isArray(rawSubData) ? rawSubData[0] : (rawSubData || {});

      details.value = {
        listing_id: data.listing_ID,
        listing_title: data.listing_title,
        price: data.price,
        commission: data.commission,
        location: data.location,
        description: data.description,
        created_at: new Date(data.created_at),
        is_active: data.is_active,
        
        agent_name: `${data.agents?.first_name || ''} ${data.agents?.last_name || ''}`.trim(),
        developer_name: data.developers?.name || 'None',
        property_type: data.property_type?.property_type || props.prop_type,
        
        ...subTableData
      };

      // Handle Image array from database di pa guro ni magamit if di pa ma insertan og img ang createListibng
      if (data.listing_images && data.listing_images.length > 0) {
        const sortedImages = data.listing_images.sort((a: any, b: any) => a.display_order - b.display_order);
        thumbnails.value = sortedImages.map((img: any) => img.image_url);
        activeImage.value = thumbnails.value[0]!; 
      } else {
        thumbnails.value = [house1, house2];
        activeImage.value = house1;
      }
    }
  } catch (error) {
    console.error("Error fetching full listing details:", error);
  }
}


function getCondoType () {
  if (!details.value) 
    return 'N/A'
  if (details.value.is_studio_type) 
    return 'Studio'
  else if (details.value.is_BR_unit) 
    return 'BR Unit'
  else if (details.value.is_villa) 
    return 'Villa'
  else if (details.value.is_garden_villa) 
    return 'Garden Villa'
  else if (details.value.is_penthouse) 
    return 'Penthouse'
  else return 'N/A'
}

function getMemorialType () {
  if (!details.value) 
    return 'N/A';
  if (details.value.is_urn) 
    return 'Urn'
  else if (details.value.is_vault) 
    return 'Vault'
  else if (details.value.is_garden) 
    return 'Garden'
  else if (details.value.is_estate) 
    return 'Estate'
  else if (details.value.is_family_estate) 
    return 'Family Estate'
  else if (details.value.is_pet_memorial) 
    return 'Pet Memorial'
  else return 'N/A'
}

// load the deets 
watch(() => props.prop_id, (newId) => {
  if (newId) {
    details.value = null;
    loadProperties()
  }
}, { immediate: true })

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