<template>
  <div class="w-full h-screen bg-background-gray flex flex-col overflow-hidden p-10">
    <main class="relative custom-scrollbar size-full bg-white border border-maurealty-blue/25 rounded-2xl shadow-lg py-7 px-10 overflow-y-scroll">
      <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
      >
        <div v-if="displayMaps" class="absolute inset-0 z-50 bg-white overflow-hidden rounded-2xl">
          
          <button 
            @click="toggleMaps" 
            type="button" 
            class="absolute top-4 right-4 z-60 bg-red-500 text-white p-3 rounded-full font-bold shadow-md hover:bg-red-600 transition-colors cursor-pointer"
          >
            <XIcon />
          </button>

          <MapInteractive 
            :target-location="{ lng: form.lng ?? 123.89313980, lat: form.lat ?? 10.30995455, loc: form.location ?? '' }" 
            @update:targetLocation="(loc) => { form.lng = loc.lng; form.lat = loc.lat, form.location = loc.name; }"
          />
        </div>
      </transition>
      
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

                <div v-for="(img, index) in existingImages" :key="`existing-${index}`" class="relative w-32 h-32 bg-gray-200 rounded-xl overflow-hidden shadow-sm group">
                  <img :src="img.url" alt="Current property photo" class="object-cover size-full">
                  <span class="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">Current</span>
                  <button type="button" @click="removeExistingImage(index)" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                    ✕
                  </button>
                </div>

                <div v-for="(img, index) in imageFiles" :key="index" class="relative w-32 h-32 bg-gray-200 rounded-xl overflow-hidden shadow-sm group">
                  <img :src="img.preview" alt="Property Preview" class="object-cover size-full">
                  <button type="button" @click="removeImage(index)" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                    ✕
                  </button>
                </div>
                
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  ref="fileInput" 
                  class="hidden" 
                  @change="handleFileUpload"
                >
                
                <button type="button" @click="triggerFileInput" class="w-32 h-32 border-2 border-maurealty-blue flex flex-col items-center justify-center rounded-xl text-maurealty-blue hover:bg-maurealty-blue/5 transition">
                  <span class="text-3xl">+</span>
                  <span class="text-xs font-bold">Add Photo</span>
                </button>
              </div>
            </div>

            <div>
              <section class="flex items-baseline justify-between text-sm font-bold text-maurealty-blue mb-2">
                <label class="block">Description</label>
                <button type="button" class="py-1 px-2.5 border border-maurealty-blue rounded-xl hover:bg-maurealty-blue hover:text-white transition-colors" @click="toggleDescriptionMarkdown">
                    {{ (displayDescriptionMarkdown) ? "Edit" : "Preview" }}
                </button>
              </section>
              
              <textarea type="text" v-if="!displayDescriptionMarkdown" v-model="form.description" placeholder="e.g. This house has amazing features!" 
                        class="custom-scrollbar w-full h-auto min-h-40 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-maurealty-blue outline-none"></textarea>
              
              <div v-if="displayDescriptionMarkdown" class="prose max-w-none w-full h-auto min-h-40 border border-gray-300 rounded-lg p-3" v-html="compiledDescriptionMarkdown"></div>
              
              <p class="text-sm text-gray-500 italic">Note: description follows the Markdown format, read 
                <a target="_blank" rel="noopener noreferrer" class="text-blue-400 underline" href="https://www.markdownguide.org/basic-syntax/">this</a> 
              for formatting options</p>
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
                <span class="w-full flex gap-2">
                  <input type="text" v-model="form.location" placeholder="Street, City, Province" class="w-full border border-gray-300 bg-white rounded-lg p-3">
                  <button type="button" class="border border-gray-300 bg-white hover:bg-gray-100 cursor-pointer rounded-lg p-3" @click="toggleMaps"><MapIcon /></button>
                </span>
              </div>

              <div class="col-span-2">
              <label class="block text-sm font-bold text-maurealty-blue mb-1">Developer</label>
              
              <Listbox v-model="form.dev_ID">
                <div class="relative">
                  <ListboxButton class="relative w-full cursor-default rounded-lg border border-gray-300 bg-white p-3 text-left focus:outline-none focus:ring-2 focus:ring-maurealty-blue sm:text-sm transition-all">
                    <span class="block truncate text-gray-700">
                      {{ developersList.find(d => d.dev_ID === form.dev_ID)?.name || 'None' }}
                    </span>
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
                        v-for="dev in developersList"
                        :key="dev.dev_ID ?? 'none'"
                        :value="dev.dev_ID"
                        as="template"
                      >
                        <li
                          :class="[
                            active ? 'bg-maurealty-blue/10 text-maurealty-blue' : 'text-gray-900',
                            'relative cursor-default select-none py-2 pl-4 pr-4 transition-colors',
                          ]"
                        >
                          <span :class="[selected ? 'font-bold' : 'font-normal', 'block truncate']">
                            {{ dev.name }}
                          </span>
                        </li>
                      </ListboxOption>
                    </ListboxOptions>
                  </transition>
                </div>
              </Listbox>
            </div>

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

          <div class="col-span-full">
              <section class="flex items-baseline justify-between text-sm font-bold text-maurealty-blue mb-2">
                <label class="block">Frequently Asked Questions</label>
                <button type="button" class="py-1 px-2.5 border border-maurealty-blue rounded-xl hover:bg-maurealty-blue hover:text-white transition-colors" @click="toggleFAQMarkdown">
                    {{ (displayFAQMarkdown) ? "Edit" : "Preview" }}
                </button>
              </section>
              
              <textarea type="text" v-if="!displayFAQMarkdown" v-model="form.faq" placeholder="e.g. This house has amazing features!" 
                        class="custom-scrollbar w-full h-auto min-h-40 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-maurealty-blue outline-none"></textarea>
              
              <div v-if="displayFAQMarkdown" class="prose max-w-none w-full h-auto min-h-40 border border-gray-300 rounded-lg p-3" v-html="compiledFAQMarkdown"></div>
              
              <p class="text-sm text-gray-500 italic">Note: description follows the Markdown format, read 
                <a target="_blank" rel="noopener noreferrer" class="text-blue-400 underline" href="https://www.markdownguide.org/basic-syntax/">this</a> 
              for formatting options</p>
            </div>
          
          <div class="flex col-span-2 justify-end gap-4 mt-8">
              <button type="button" @click="goBack" class="px-8 py-3 border border-maurealty-blue text-maurealty-blue font-bold rounded-full hover:bg-gray-100 transition">
                CANCEL
              </button>
              <button type="submit" class="px-8 py-3 bg-maurealty-blue text-white font-bold rounded-full shadow-md hover:bg-opacity-90 hover:bg-[#045fa3] active:bg-white active:text-maurealty-blue border border-maurealty-blue transition flex items-center gap-2 cursor-pointer">
                <span>★</span> SAVE PROPERTY
              </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, watch, onMounted, computed } from 'vue';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'
import type { HouseAndLot, Lot, Condominium, Memorial } from '@/assets/classes/listings';
import { listingsService } from '@/services/listingsServices';
import { authService } from '@/services/authService'; // just for getting agent_ID

// maps stuff
import { MapIcon, XIcon } from 'lucide-vue-next';
import MapInteractive from '@/components/listings/MapInteractive.vue';
const displayMaps = ref(false);

function toggleMaps() {
  displayMaps.value = !displayMaps.value;
  console.log("Map display status: " + displayMaps.value);
}

import { developerService } from '@/services/developerService'

// for the description stuff
import { compileMarkdown } from '@/services/listingsServices';
const displayDescriptionMarkdown = ref(false);
const currentAgentId = ref<number | null>(null); // store agent ID of current user

function toggleDescriptionMarkdown() {
  displayDescriptionMarkdown.value = !displayDescriptionMarkdown.value;
  console.log("Description Markdown display status: " + displayDescriptionMarkdown.value);
}

// for the FAQ stuff
const displayFAQMarkdown = ref(false);

function toggleFAQMarkdown() {
  displayFAQMarkdown.value = !displayFAQMarkdown.value;
  console.log("FAQ Markdown display status: " + displayFAQMarkdown.value);
}

// Combine all interfaces for the form state
type PropertyForm = HouseAndLot & Lot & Condominium & Memorial & {
  listing_title?: string;
  dev_ID: number | null  
};

// Store fetched developers (for dropdown)
const developersList = ref<{ dev_ID: number | null; name: string }[]>([]);

const route = useRoute();
const router = useRouter();

const propertyId = Number(route.query.id) || -1;
const propertyType = Number(route.query.type) || -1;

const loadProperties = async () => {
  if(route.query.edit === '0') return;

  try {
    const data = await listingsService.getListingById(propertyId, propertyType) as any;
    
    if (data) {
      const typeReverseMap: Record<number, string> = {
        1: 'House And Lot', 2: 'Lot Only', 3: 'Condominium', 4: 'Memorial', 5: 'Clubshare', 6: 'Golfshare'
      };

      form.value.listing_title = data.listing_title;
      form.value.property_type = typeReverseMap[propertyType] || typeReverseMap[1];
      form.value.price = data.price;
      form.value.commission = data.commission;
      form.value.location = data.location;
      form.value.lng = data.longitude;
      form.value.lat = data.latitude;
      form.value.description = data.description;
      form.value.status = data.status;
      form.value.dev_ID = data.dev_ID;
      form.value.faq = data.faq;

      console.log(data.longitude, data.latitude);
      console.log("^Data | vForm\n");
      console.log(form.value.lng, form.value.lat);

      const images = Array.isArray(data.listing_images) ? data.listing_images : [];
      existingImages.value = [...images]
        .sort((a, b) => a.display_order - b.display_order)
        .map((img) => ({ url: img.image_url }));

      const subTableName: Record<number, string> = {
        1: 'house_and_lot', 2: 'lot_only', 3: 'condominium', 4: 'memorial'
      };
      const propTypeString = subTableName[propertyType];
      if (!propTypeString) return;

      const rawSubData = data[propTypeString];
      const subTableData = Array.isArray(rawSubData) ? rawSubData[0] : (rawSubData || {});

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

onMounted(async () => {
  loadProperties();

// Fetch developers from Supabase and populate the dropdown list
// might need to redo because this is dirty code yucky yuck
  const devs = await developerService.getDevelopers();
  developersList.value = [
    { dev_ID: null, name: 'None' }, 
    ...devs.map(d => ({ dev_ID: Number(d.dev_ID), name: String(d.name) }))
  ];

// Fetch currently authenticated user
  const agentProfile = await authService.getCurrentAgent();

  if(agentProfile){
    currentAgentId.value = agentProfile.agent_ID;
  }else {
    console.error('No authenticated agent profile found');
  }
});

const form = ref<Partial<PropertyForm>>({
  // Base Property Fields
  listing_title: '', 
  property_type: 'House And Lot',
  price: 0,
  commission: 0,
  location: '',
  lng: 123.89315517066801,
  lat: 10.309933165401256,
  description: '',
  status: 'active',
  dev_ID: null,
  faq: '# FREQUENTLY ASKED QUESTIONS\n\n',

  // House and Lot Defaults
  one_storey: true,
  two_storey: false,
  with_loft: false,
  townhome: false,
  rowhouse: false,
  lot_area: 0,
  floor_area: 0,
  room_count: 0,
  toilet_count: 0,
  helper_room_count: 0,
  driver_room_count: 0,
  carpark_count: 0,

  // Lot Only Defaults
  block_number: 0,
  lot_number: 0,
  phase_number: 0,
  area: 0,
  class: 'Residential',

  // Condominium Defaults
  unit_number: 0,
  bedroom_count: 0,
  balcony_count: 0,
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

// Image Handling Logic
const imageFiles = ref<{ file: File; preview: string }[]>([]);
const existingImages = ref<{ url: string }[]>([]);
const removedImageUrls = ref<string[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  if (fileInput.value) fileInput.value.click();
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    Array.from(target.files).forEach(file => {
      imageFiles.value.push({
        file: file,
        preview: URL.createObjectURL(file) 
      });
    });
  }
  if (fileInput.value) fileInput.value.value = '';
};

const removeImage = (index: number) => {
  const image = imageFiles.value[index];
  if (image) {
    URL.revokeObjectURL(image.preview);
    imageFiles.value.splice(index, 1);
  }
};

// Defer deletion until save so cancelling leaves the stored images untouched
const removeExistingImage = (index: number) => {
  const image = existingImages.value[index];
  if (!image) return;
  removedImageUrls.value.push(image.url);
  existingImages.value.splice(index, 1);
};

const setExclusively = (group: (keyof PropertyForm)[], selectedField: keyof PropertyForm) => {
  group.forEach(field => {
    (form.value as any)[field] = (field === selectedField);
  });
};

const types: string[] = ['House And Lot', 'Lot Only', 'Condominium', 'Memorial', 'Clubshare', 'Golfshare'];
const lotClasses: string[] = ['Residential', 'Commercial', 'Industrial', 'Farm Lot'];
const condoClasses: string[] = ['Residential', 'Commercial', 'Industrial', 'Condotel', 'Timeshare'];

watch(() => form.value.property_type, (newType) => {
  console.log(`Switching layout to: ${newType}`);
});

const saveProperty = async () => {
  if(route.query.edit === '0')  {
      try {
      // 1. Map Property Type String to DB ID
      const typeMap: Record<string, number> = {
        'House And Lot': 1, 'Lot Only': 2, 'Condominium': 3, 'Memorial': 4, 'Clubshare': 5, 'Golfshare': 6
      };
      const propertyTypeId = typeMap[form.value.property_type || 'House And Lot'] || 1;
      // 2. Prepare Main Listing Data (Maps to main_listings table)
      const mainData = {
        agent_ID: currentAgentId.value,
        listing_title: form.value.listing_title,
        property_type_ID: propertyTypeId,
        price: form.value.price,
        commission: form.value.commission,
        location: form.value.location,
        longitude: form.value.lng,
        latitude: form.value.lat,
        description: form.value.description || 'No description provided.',
        status: form.value.status,
        dev_ID: form.value.dev_ID,
        faq: form.value.faq
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
      } else if (propertyTypeId === 2) { // Lot only
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
// 4. Send to supabase via our service
      console.log("Sending payload to Supabase...");
      const response = await listingsService.createListing(mainData, specificData, propertyTypeId);
      if (response.success) {
        if (imageFiles.value.length > 0) {
          const filesToUpload = imageFiles.value.map(img => img.file);
          await listingsService.uploadPropertyImages(response.data.listing_ID, filesToUpload);
        }

        router.push({ path: '/listings', query: { saved: 'created' } });
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
        longitude: form.value.lng,
        latitude: form.value.lat,
        description: form.value.description || 'No description provided.',
        status: form.value.status,
        dev_ID: form.value.dev_ID
      };
      let specificData = {};

      if (propertyTypeId === 1) { 
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
      } else if (propertyTypeId === 2) { 
        const lotClassMap: Record<string, number> = { 'Residential': 1, 'Commercial': 2, 'Industrial': 3, 'Farm Lot': 4 };
        specificData = {
          block_number: String(form.value.block_number), 
          lot_number: String(form.value.lot_number),
          phase_number: String(form.value.phase_number),
          lot_area: form.value.area, 
          lot_class_ID: lotClassMap[form.value.class || 'Residential'] || 1
        };
      } else if (propertyTypeId === 3) { 
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
      } else if (propertyTypeId === 4) { 
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
      if (response.success) {
        if (removedImageUrls.value.length > 0) {
          await listingsService.deleteListingImages(removedImageUrls.value);
        }

        if (imageFiles.value.length > 0) {
          const filesToUpload = imageFiles.value.map(img => img.file);
          await listingsService.uploadPropertyImages(propertyId, filesToUpload);
        }

        router.push({ path: '/listings', query: { saved: 'updated' } });
      }

    } catch (error) {
      console.error('Failed to save property:', error);
      alert('Error saving property. Check the console for details.');
    } 
  }
};

// description markdown conversion and input
const compiledDescriptionMarkdown = computed(() => {
  return compileMarkdown(form.value.description)
});

// FAQ markdown conversion and input
const compiledFAQMarkdown = computed(() => {
  return compileMarkdown(form.value.faq)
});

// goes back to previous page
function goBack() {
  window.history.back()
}

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
  background-color: #044677; 
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