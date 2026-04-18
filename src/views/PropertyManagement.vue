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
              <input type="text" placeholder="e.g. Luxurious Home" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-maurealty-blue outline-none">
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
          </div>

          <div class="bg-blue-50/30 border border-maurealty-blue/10 rounded-2xl p-8">
            <div class="grid grid-cols-2 gap-4">
    
              <div class="col-span-1">
                <label class="block text-sm font-bold text-maurealty-blue mb-1">Price (₱)</label>
                <input type="number" v-model="form.price" class="w-full border border-gray-300 rounded-lg p-3">
              </div>
              <div class="col-span-1">
                <label class="block text-sm font-bold text-maurealty-blue mb-1">Commission (%)</label>
                <input type="number" v-model="form.commission" class="w-full border border-gray-300 rounded-lg p-3">
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-bold text-maurealty-blue mb-1">Location</label>
                <input type="text" v-model="form.location" placeholder="Street, City, Province" class="w-full border border-gray-300 rounded-lg p-3">
              </div>

              <!-- Dropdown -->
              <div class="col-span-2">
                <label class="block text-sm font-bold text-maurealty-blue mb-1">Property Type</label>
                
                <Listbox v-model="form.property_type">
                  <div class="relative">

                    <ListboxButton class="relative w-full cursor-default rounded-lg border border-gray-300 p-3 text-left focus:outline-none focus:ring-2 focus:ring-maurealty-blue sm:text-sm transition-all">
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
                    <input type="number" v-model="form.lot_area" placeholder="sqm" class="w-full border border-gray-300 rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Floor Area</label>
                    <input type="number" v-model="form.floor_area" placeholder="sqm" class="w-full border border-gray-300 rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Rooms</label>
                    <input type="number" v-model="form.room_count" class="w-full border border-gray-300 rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Toilets</label>
                    <input type="number" v-model="form.toilet_count" class="w-full border border-gray-300 rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Helper Rms</label>
                    <input type="number" v-model="form.helper_room_count" class="w-full border border-gray-300 rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Driver Rms</label>
                    <input type="number" v-model="form.driver_room_count" class="w-full border border-gray-300 rounded-lg p-2 text-sm">
                  </div>
                  <div class="col-span-2">
                    <label class="block text-xs font-bold text-maurealty-blue mb-1 uppercase opacity-70">Carpark Spaces</label>
                    <input type="number" v-model="form.carpark_count" class="w-full border border-gray-300 rounded-lg p-2 text-sm">
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
import { ref } from 'vue';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'
import type { Property } from '@/assets/classes/listings';

const form = ref<Partial<Property>>({
  property_type: 'House And Lot',
  price: 0,
  commission: 0,
  location: '',
  description: '',
  is_active: true
});

const types: string[] = ['House And Lot', 'Lot Only', 'Condominium', 'Memorial']
let currentType = ref(types[0])

const saveProperty = () => {
  console.log("Saving property data:", form.value);
  // Implementation for API call
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
  -moz-appearance: textfield;
}
</style>