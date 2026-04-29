<template>
  <div class="w-full h-screen bg-background-gray flex flex-col overflow-hidden p-10">
    <main class="custom-scrollbar size-full bg-white border border-maurealty-blue/25 rounded-2xl shadow-lg py-7 px-10 overflow-y-scroll">
      <header class="relative">
          <h1 class="text-4xl max-w-19/20 font-extrabold text-maurealty-blue mb-4 ml-5">
            PROPERTY MANAGEMENT
          </h1>

          <hr width="100%" class="mb-4 text-maurealty-blue/30">
      </header>

      <div>
        <form @submit.prevent="saveProperty" class="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-bold text-maurealty-blue mb-1">Title</label>
              <input type="text" v-model="form.listing_title" placeholder="e.g. Luxurious Home" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-maurealty-blue outline-none">
            </div>

            <div class="border-2 border-dashed border-maurealty-blue/20 rounded-2xl p-6 bg-gray-50">
              <div class="flex flex-wrap gap-4 mb-4">
                <div v-for="i in 2" :key="i" class="w-32 h-32 bg-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <img src="https://via.placeholder.com/150" alt="Property Preview" class="object-cover size-full">
                </div>
                <button type="button" class="w-32 h-32 border-2 border-maurealty-blue flex flex-col items-center justify-center rounded-xl text-maurealty-blue hover:bg-maurealty-blue/5 transition">
                  <span class="text-3xl">+</span>
                  <span class="text-xs font-bold">Add Photo</span>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-bold text-maurealty-blue mb-1">Description</label>
              <textarea type="text" v-model="form.description" placeholder="e.g. This house has amazing features!" class="custom-scrollbar w-full h-auto min-h-40 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-maurealty-blue outline-none"/>
            </div>
          </div>

          <div class="bg-blue-50/30 border border-maurealty-blue/10 rounded-2xl p-8">
            <div class="grid grid-cols-2 gap-4">
    
              <div class="col-span-1">
                <label class="block text-sm font-bold text-maurealty-blue mb-1">Price (₱)</label>
                <input type="number" v-model="form.price" class="w-full border border-gray-300 bg-white rounded-lg p-3">
              </div>
              <div class="col-span-1">
                <label class="block text-sm font-bold text-maurealty-blue mb-1">Commission (%)</label>
                <input type="number" v-model="form.commission" class="w-full border border-gray-300 bg-white rounded-lg p-3">
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-bold text-maurealty-blue mb-1">Location</label>
                <input type="text" v-model="form.location" placeholder="Street, City, Province" class="w-full border border-gray-300 bg-white rounded-lg p-3">
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-bold text-maurealty-blue mb-1">Developer</label>
                <input type="text" v-model="form.developer_name" placeholder="e.g. Building Construction Co."  class="w-full border border-gray-300 bg-white rounded-lg p-3">
              </div>

              <!-- Dropdown -->
              <div class="col-span-2">
                <label class="block text-sm font-bold text-maurealty-blue mb-1">Property Type</label>
                
                <Listbox v-model="form.property_type">
                  <div class="relative">

                    <ListboxButton class="relative w-full cursor-default rounded-lg border border-gray-300 bg-white p-3 text-left focus:outline-none focus:ring-2 focus:ring-maurealty-blue sm:text-sm transition-all">
                      <span class="block truncate text-gray-700">{{ form.property_type }}</span>
                      <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                      </span>
                    </ListboxButton>

                    <transition
                      leave-active-class="transition duration-100 ease-in"
                      leave-from-class="opacity-100"
                      leave-to-class="opacity-0"
                    >
                      <ListboxOptions class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                        <ListboxOption
                          v-slot="{ active, selected }"
                          v-for="choice in types"
                          :key="choice"
                          :value="choice"
                          as="template"
                        >
                          <li
                            :class="[
                              active ? 'bg-maurealty-blue/10 text-maurealty-blue' : 'text-gray-900',
                              'relative cursor-default select-none py-2 pl-4 pr-4 transition-colors',
                            ]"
                          >
                            <span :class="[selected ? 'font-bold' : 'font-normal', 'block truncate']">
                              {{ choice }}
                            </span>
                          </li>
                        </ListboxOption>
                      </ListboxOptions>
                    </transition>

                  </div>
                </Listbox>
              </div>


              <template v-if="form.property_type === 'House And Lot'">
                <div class="col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-maurealty-blue/10 pt-4 mt-2">
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Lot Area</label>
                    <input type="number" v-model="form.lot_area" placeholder="sqm" class="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Floor Area</label>
                    <input type="number" v-model="form.floor_area" placeholder="sqm" class="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Rooms</label>
                    <input type="number" v-model="form.room_count" class="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Toilets</label>
                    <input type="number" v-model="form.toilet_count" class="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Helper Rms</label>
                    <input type="number" v-model="form.helper_room_count" class="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Driver Rms</label>
                    <input type="number" v-model="form.driver_room_count" class="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm">
                  </div>
                  <div class="col-span-2">
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Carpark Spaces</label>
                    <input type="number" v-model="form.carpark_count" class="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm">
                  </div>
                </div>

                <div class="col-span-2 bg-white border border-gray-200 rounded-xl p-4 mt-2">
                  <p class="text-xs font-bold text-maurealty-blue mb-3 uppercase opacity-70">Property Features</p>
                  <div class="flex flex-wrap gap-x-6 gap-y-3">
                    <label class="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" v-model="form.one_storey" class="w-4 h-4 accent-maurealty-blue rounded">
                      <span class="text-sm text-gray-700 group-hover:text-maurealty-blue transition">One Storey</span>
                    </label>
                    
                    <label class="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" v-model="form.two_storey" class="w-4 h-4 accent-maurealty-blue rounded">
                      <span class="text-sm text-gray-700 group-hover:text-maurealty-blue transition">Two Storey</span>
                    </label>

                    <label class="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" v-model="form.with_loft" class="w-4 h-4 accent-maurealty-blue rounded">
                      <span class="text-sm text-gray-700 group-hover:text-maurealty-blue transition">With Loft</span>
                    </label>

                    <label class="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" v-model="form.townhome" class="w-4 h-4 accent-maurealty-blue rounded">
                      <span class="text-sm text-gray-700 group-hover:text-maurealty-blue transition">Townhome</span>
                    </label>

                    <label class="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" v-model="form.rowhouse" class="w-4 h-4 accent-maurealty-blue rounded">
                      <span class="text-sm text-gray-700 group-hover:text-maurealty-blue transition">Rowhouse</span>
                    </label>
                  </div>
                </div>
              </template>


              <template v-if="form.property_type === 'Lot Only'">
                <div class="col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-maurealty-blue/10 pt-4 mt-2">
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Block No.</label>
                    <input type="number" v-model="form.block_number" class="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Lot No.</label>
                    <input type="number" v-model="form.lot_number" class="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Phase No.</label>
                    <input type="number" v-model="form.phase_number" class="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Area</label>
                    <input type="number" v-model="form.area" placeholder="sqm" class="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm">
                  </div>
                
                  <div class="cols-2 md:col-span-4">
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Lot Class</label>
                    
                    <Listbox v-model="form.class">
                      <div class="relative">

                        <ListboxButton class="relative w-full cursor-default rounded-lg border border-gray-300 bg-white p-3 text-left focus:outline-none focus:ring-2 focus:ring-maurealty-blue sm:text-sm transition-all">
                          <span class="block truncate text-gray-700">{{ form.class }}</span>
                          <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                          </span>
                        </ListboxButton>

                        <transition
                          leave-active-class="transition duration-100 ease-in"
                          leave-from-class="opacity-100"
                          leave-to-class="opacity-0"
                        >
                          <ListboxOptions class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                            <ListboxOption
                              v-slot="{ active, selected }"
                              v-for="lotclass in lotClasses"
                              :key="lotclass"
                              :value="lotclass"
                              as="template"
                            >
                              <li
                                :class="[
                                  active ? 'bg-maurealty-blue/10 text-maurealty-blue' : 'text-gray-900',
                                  'relative cursor-default select-none py-2 pl-4 pr-4 transition-colors',
                                ]"
                              >
                                <span :class="[selected ? 'font-bold' : 'font-normal', 'block truncate']">
                                  {{ lotclass }}
                                </span>
                              </li>
                            </ListboxOption>
                          </ListboxOptions>
                        </transition>
                        
                      </div>
                    </Listbox>

                  </div>
                
                </div>
              </template>


              <template v-if="form.property_type === 'Condominium'">
                <div class="col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-maurealty-blue/10 pt-4 mt-2">
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Unit No.</label>
                    <input type="number" v-model="form.unit_number" class="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Bedroom Count</label>
                    <input type="number" v-model="form.bedroom_count" class="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Balcony Count</label>
                    <input type="number" v-model="form.balcony_count" class="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Carpark Count</label>
                    <input type="number" v-model="form.carpark_count" class="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm">
                  </div>

                  <div class="cols-2 md:col-span-4">
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Condominium Class</label>
                    
                    <Listbox v-model="form.class">
                      <div class="relative">

                        <ListboxButton class="relative w-full cursor-default rounded-lg border border-gray-300 bg-white p-3 text-left focus:outline-none focus:ring-2 focus:ring-maurealty-blue sm:text-sm transition-all">
                          <span class="block truncate text-gray-700">{{ form.class }}</span>
                          <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                          </span>
                        </ListboxButton>

                        <transition
                          leave-active-class="transition duration-100 ease-in"
                          leave-from-class="opacity-100"
                          leave-to-class="opacity-0"
                        >
                          <ListboxOptions class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                            <ListboxOption
                              v-slot="{ active, selected }"
                              v-for="condoclass in condoClasses"
                              :key="condoclass"
                              :value="condoclass"
                              as="template"
                            >
                              <li
                                :class="[
                                  active ? 'bg-maurealty-blue/10 text-maurealty-blue' : 'text-gray-900',
                                  'relative cursor-default select-none py-2 pl-4 pr-4 transition-colors',
                                ]"
                              >
                                <span :class="[selected ? 'font-bold' : 'font-normal', 'block truncate']">
                                  {{ condoclass }}
                                </span>
                              </li>
                            </ListboxOption>
                          </ListboxOptions>
                        </transition>
                      
                      </div>
                    </Listbox>
                  </div>

                  <div class="cols-2 md:col-span-4 bg-white border border-gray-200 rounded-xl p-4 mt-2">
                      <p class="text-xs font-bold text-maurealty-blue mb-3 uppercase opacity-70">Condominium Type</p>
                      
                      <div class="flex flex-wrap gap-x-6 gap-y-3">
                        <label v-for="cType in ([
                          { label: 'Studio', field: 'is_studio_type' },
                          { label: 'BR Unit', field: 'is_BR_unit' },
                          { label: 'Villa', field: 'is_villa' },
                          { label: 'Garden Villa', field: 'is_garden_villa' },
                          { label: 'Penthouse', field: 'is_penthouse' }
                        ] as const)" 
                          :key="cType.field" 
                          class="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            :checked="!!form[cType.field as keyof PropertyForm]" 
                            @change="setExclusively(['is_studio_type', 'is_BR_unit', 'is_villa', 'is_garden_villa', 'is_penthouse'], cType.field as keyof PropertyForm)"
                            class="w-4 h-4 accent-maurealty-blue"
                          >
                          <span class="text-sm text-gray-700">{{ cType.label }}</span>
                        </label>
                      </div>
                  </div>
                </div>
              </template>


              <template v-if="form.property_type === 'Memorial'">
                <div class="col-span-2 border-t border-maurealty-blue/10 pt-4 mt-2">
                  <div class="cols-6 bg-white border border-gray-200 rounded-xl p-4 mt-2">
                      <p class="text-xs font-bold text-maurealty-blue mb-3 uppercase opacity-70">Memorial Type</p>

                      <div class="flex flex-wrap gap-x-6 gap-y-3">
                        <label v-for="mType in ([
                          { label: 'Urn', field: 'is_urn' },
                          { label: 'Vault', field: 'is_vault' },
                          { label: 'Garden', field: 'is_garden' },
                          { label: 'Estate', field: 'is_estate' },
                          { label: 'Family Estate', field: 'is_family_estate' },
                          { label: 'Pet Memorial', field: 'is_pet_memorial' }
                        ] as const)" 
                          :key="mType.field" 
                          class="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            :checked="!!form[mType.field as keyof PropertyForm]" 
                            @change="setExclusively(['is_urn', 'is_vault', 'is_garden', 'is_estate', 'is_family_estate', 'is_pet_memorial'], mType.field as keyof PropertyForm)"
                            class="w-4 h-4 accent-maurealty-blue"
                          >
                          <span class="text-sm text-gray-700">{{ mType.label }}</span>
                        </label>
                    </div>
                  </div>
                </div>

                
              </template>

            </div>
          </div>
          
          <div class="flex col-span-2 justify-end gap-4 mt-8">
              <button type="button" class="px-8 py-3 border border-maurealty-blue text-maurealty-blue font-bold rounded-full hover:bg-gray-100 transition">
                CANCEL
              </button>
              <button type="submit" class="px-8 py-3 bg-maurealty-blue text-white font-bold rounded-full shadow-md hover:bg-opacity-90 transition flex items-center gap-2">
                <span>★</span> SAVE PROPERTY
              </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import {useRoute} from 'vue-router';
import { ref, watch, onMounted } from 'vue';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'
import type { HouseAndLot, Lot, Condominium, Memorial } from '@/assets/classes/listings';
import { listingsService } from '@/services/listingsServices'; 


// Combine all interfaces for the form state
type PropertyForm = HouseAndLot & Lot & Condominium & Memorial & { listing_title?: string };
const route = useRoute();

const propertyId = Number(route.query.id) || -1;
const propertyType = Number(route.query.type) || -1;

const loadProperties = async () => {
  if (route.query.edit === '0') return; 

  try {
    const data = await listingsService.getListingById(propertyId, propertyType) as any;
    
    if (data) {
      const subTableName: Record<number, string> = {
        1: 'house_and_lot',
        2: 'lot_only',
        3: 'condominium',
        4: 'memorial'
      };
      
      const propTypeString = subTableName[propertyType];
      if (!propTypeString) return;

      const rawSubData = data[propTypeString];
      const subTableData = Array.isArray(rawSubData) ? rawSubData[0] : (rawSubData || {});

      const typeReverseMap: Record<number, string> = {
        1: 'House And Lot', 2: 'Lot Only', 3: 'Condominium', 4: 'Memorial'
      };

      
      form.value.listing_title = data.listing_title;
      form.value.property_type = typeReverseMap[propertyType] || typeReverseMap[1];
      form.value.price = data.price;
      form.value.commission = data.commission;
      form.value.location = data.location;
      form.value.description = data.description;
      form.value.is_active = data.is_active;
      form.value.developer_name = data.developers?.name || '';

     
      if (propertyType === 1) { // House and Lot
        form.value.one_storey = subTableData['1_storey'];
        form.value.two_storey = subTableData['2_storey'];
        form.value.with_loft = subTableData.with_loft;
        form.value.townhome = subTableData.townhomes; // UI: townhome, DB: townhomes
        form.value.rowhouse = subTableData.rowhouse;
        form.value.lot_area = subTableData.lot_area;
        form.value.floor_area = subTableData.floor_area;
        form.value.room_count = subTableData.rooms_count; // UI: room_count, DB: rooms_count
        form.value.toilet_count = subTableData.toilets_count;
        form.value.helper_room_count = subTableData.helper_rooms_count;
        form.value.driver_room_count = subTableData.driver_rooms_count;
        form.value.carpark_count = subTableData.carpark_count;

      } else if (propertyType === 2) { // Lot Only
        const lotClassReverseMap: Record<number, string> = { 1: 'Residential', 2: 'Commercial', 3: 'Industrial', 4: 'Farm Lot' };
        
        form.value.block_number = Number(subTableData.block_number);
        form.value.lot_number = Number(subTableData.lot_number);
        form.value.phase_number = Number(subTableData.phase_number);
        form.value.area = subTableData.lot_area; // UI: area, DB: lot_area
        form.value.class = lotClassReverseMap[subTableData.lot_class_ID] || 'Residential';

      } else if (propertyType === 3) { // Condominium
        const condoClassReverseMap: Record<number, string> = { 1: 'Residential', 2: 'Commercial', 3: 'Industrial', 4: 'Condotel', 5: 'Timeshare' };
        
        form.value.class = condoClassReverseMap[subTableData.condo_class_ID] || 'Residential';
        form.value.unit_number = subTableData.unit_number;
        form.value.carpark_count = subTableData.carpark_count;
        form.value.balcony_count = subTableData.balcony_count;
        form.value.bedroom_count = subTableData.bedroom_count;
        
        // Radio buttons
        form.value.is_studio_type = subTableData.is_studio_type;
        form.value.is_BR_unit = subTableData.is_BR_unit;
        form.value.is_villa = subTableData.is_villa;
        form.value.is_garden_villa = subTableData.is_garden_villa;
        form.value.is_penthouse = subTableData.is_penthouse;

      } else if (propertyType === 4) { // Memorial
        form.value.is_urn = subTableData.is_urn;
        form.value.is_vault = subTableData.is_vault;
        form.value.is_garden = subTableData.is_garden;
        form.value.is_estate = subTableData.is_estate;
        form.value.is_family_estate = subTableData.is_family_estate;
        form.value.is_pet_memorial = subTableData.is_pet_memorial;
      }
    }
  } catch (error) {
    console.error("Failed to load property data:", error);
  }
}

onMounted(() => {
  loadProperties();
});

const form = ref<Partial<PropertyForm>>({
  // Base Property Fields
  listing_title: '', // <-- Added this to track the title!
  property_type: 'House And Lot',
  price: 0,
  commission: 0,
  location: '',
  description: '',
  is_active: true,

  // House and Lot Defaults
  one_storey: true,
  two_storey: false,
  with_loft: false,
  townhome: false,
  rowhouse: false,

  // Lot Only Defaults
  class: 'Residential',

  // Condominium Defaults
  is_studio_type: true,
  is_BR_unit: false,
  is_villa: false,
  is_garden_villa: false,
  is_penthouse: false,

  // Memorial Defaults
  is_urn: true,
  is_vault: false,
  is_garden: false,
  is_estate: false,
  is_family_estate: false,
  is_pet_memorial: false
});

const setExclusively = (group: (keyof PropertyForm)[], selectedField: keyof PropertyForm) => {
  group.forEach(field => {
    (form.value as any)[field] = (field === selectedField);
  });
};

const types: string[] = ['House And Lot', 'Lot Only', 'Condominium', 'Memorial', 'Clubshare', 'Golfshare']
const lotClasses: string[] = ['Residential', 'Commercial', 'Industrial', 'Farm Lot']
const condoClasses: string[] = ['Residential', 'Commercial', 'Industrial', 'Condotel', 'Timeshare']

watch(() => form.value.property_type, (newType) => {
  console.log(`Switching layout to: ${newType}`);
});
const saveProperty = async () => {
  if(route.query.edit === '0') {
    try {
      // 1. Map Property Type String to DB ID
      const typeMap: Record<string, number> = {
        'House And Lot': 1, 'Lot Only': 2, 'Condominium': 3, 'Memorial': 4
      };
      const propertyTypeId = typeMap[form.value.property_type || 'House And Lot'] || 1;

      // 2. Prepare Main Listing Data (Maps to main_listings table)
      const mainData = {
        agent_ID: 1, // WARNING: Hardcoded for now. Update this once user login/auth is built!
        listing_title: form.value.listing_title,
        property_type_ID: propertyTypeId,
        price: form.value.price,
        commission: form.value.commission,
        location: form.value.location,
        description: form.value.description || 'No description provided.',
        is_active: form.value.is_active
      };

      // 3. Prepare Specific Sub-table Data (Translating frontend variables to exact Supabase column names)
      let specificData = {};

      if (propertyTypeId === 1) { // House and Lot
        specificData = {
          "1_storey": form.value.one_storey, 
          with_loft: form.value.with_loft,
          "2_storey": form.value.two_storey, 
          townhomes: form.value.townhome,
          rowhouse: form.value.rowhouse,
          lot_area: form.value.lot_area,
          floor_area: form.value.floor_area,
          rooms_count: form.value.room_count, 
          toilets_count: form.value.toilet_count, 
          helper_rooms_count: form.value.helper_room_count,
          driver_rooms_count: form.value.driver_room_count,
          carpark_count: form.value.carpark_count
        };
      } else if (propertyTypeId === 2) { // Lot Only
        // Map class string to class ID
        const lotClassMap: Record<string, number> = { 'Residential': 1, 'Commercial': 2, 'Industrial': 3, 'Farm Lot': 4 };
        specificData = {
          block_number: String(form.value.block_number), 
          lot_number: String(form.value.lot_number),
          phase_number: String(form.value.phase_number),
          lot_area: form.value.area, 
          lot_class_ID: lotClassMap[form.value.class || 'Residential'] || 1
        };
      } else if (propertyTypeId === 3) { // Condominium
        const condoClassMap: Record<string, number> = { 'Residential': 1, 'Commercial': 2, 'Industrial': 3, 'Condotel': 4, 'Timeshare': 5 };
        specificData = {
          condo_class_ID: condoClassMap[form.value.class || 'Residential'] || 1,
          unit_number: form.value.unit_number,
          carpark_count: form.value.carpark_count,
          is_studio_type: form.value.is_studio_type,
          is_BR_unit: form.value.is_BR_unit,
          is_villa: form.value.is_villa,
          is_garden_villa: form.value.is_garden_villa,
          is_penthouse: form.value.is_penthouse,
          balcony_count: form.value.balcony_count,
          bedroom_count: form.value.bedroom_count
        };
      } else if (propertyTypeId === 4) { // Memorial
        specificData = {
          is_urn: form.value.is_urn,
          is_vault: form.value.is_vault,
          is_garden: form.value.is_garden,
          is_estate: form.value.is_estate,
          is_family_estate: form.value.is_family_estate,
          is_pet_memorial: form.value.is_pet_memorial
        };
      }

      // 4. Send to Supabase via our Service
      console.log("Sending payload to Supabase...");
      const response = await listingsService.createListing(mainData, specificData, propertyTypeId);
      
      if (response.success) {
        alert('Property listing created successfully! (Check Supabase Dashboard)');
        // Optional: Reset form here
      }

    } catch (error) {
      console.error('Failed to save property:', error);
      alert('Error saving property. Check the console for details.');
    }
  }
  else{
    try {
      const typeMap: Record<string, number> = {
        'House And Lot': 1, 'Lot Only': 2, 'Condominium': 3, 'Memorial': 4
      };
      const propertyTypeId = typeMap[form.value.property_type || 'House And Lot'] || 1;
      const mainData = {
        listing_title: form.value.listing_title,
        property_type_ID: propertyTypeId,
        price: form.value.price,
        commission: form.value.commission,
        location: form.value.location,
        description: form.value.description || 'No description provided.',
        is_active: form.value.is_active
      };
      let specificData = {};

      if (propertyTypeId === 1) { // House and Lot
        specificData = {
          "1_storey": form.value.one_storey, 
          with_loft: form.value.with_loft,
          "2_storey": form.value.two_storey, 
          townhomes: form.value.townhome,
          rowhouse: form.value.rowhouse,
          lot_area: form.value.lot_area,
          floor_area: form.value.floor_area,
          rooms_count: form.value.room_count, 
          toilets_count: form.value.toilet_count, 
          helper_rooms_count: form.value.helper_room_count,
          driver_rooms_count: form.value.driver_room_count,
          carpark_count: form.value.carpark_count
        };
      } else if (propertyTypeId === 2) { // Lot Only
        // Map class string to class ID
        const lotClassMap: Record<string, number> = { 'Residential': 1, 'Commercial': 2, 'Industrial': 3, 'Farm Lot': 4 };
        specificData = {
          block_number: String(form.value.block_number), 
          lot_number: String(form.value.lot_number),
          phase_number: String(form.value.phase_number),
          lot_area: form.value.area, 
          lot_class_ID: lotClassMap[form.value.class || 'Residential'] || 1
        };
      } else if (propertyTypeId === 3) { // Condominium
        const condoClassMap: Record<string, number> = { 'Residential': 1, 'Commercial': 2, 'Industrial': 3, 'Condotel': 4, 'Timeshare': 5 };
        specificData = {
          condo_class_ID: condoClassMap[form.value.class || 'Residential'] || 1,
          unit_number: form.value.unit_number,
          carpark_count: form.value.carpark_count,
          is_studio_type: form.value.is_studio_type,
          is_BR_unit: form.value.is_BR_unit,
          is_villa: form.value.is_villa,
          is_garden_villa: form.value.is_garden_villa,
          is_penthouse: form.value.is_penthouse,
          balcony_count: form.value.balcony_count,
          bedroom_count: form.value.bedroom_count
        };
      } else if (propertyTypeId === 4) { // Memorial
        specificData = {
          is_urn: form.value.is_urn,
          is_vault: form.value.is_vault,
          is_garden: form.value.is_garden,
          is_estate: form.value.is_estate,
          is_family_estate: form.value.is_family_estate,
          is_pet_memorial: form.value.is_pet_memorial
        };
      }
      const response = await listingsService.updateListing(propertyId, mainData, specificData, propertyTypeId);
    }catch (error) {
    console.error('Failed to save property:', error);
    alert('Error saving property. Check the console for details.');
  } 
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

/* Style the draggable thumb */
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #1E3A8A; 
  border-radius: 9999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #172b66; 
}

/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  appearance: textfield;
  -moz-appearance: textfield;
}
</style>