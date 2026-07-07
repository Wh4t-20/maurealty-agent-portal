<template>
  <div class="w-full h-screen bg-background-gray dark:bg-background-dark-gray flex flex-col overflow-hidden p-10">
    <main class="relative custom-scrollbar size-full bg-white dark:bg-black dark:bg-black border border-maurealty-blue/25 rounded-2xl shadow-lg py-7 px-10 overflow-y-scroll">
      <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
      >
        <div v-if="displayMaps" class="absolute inset-0 z-50 bg-white dark:bg-black dark:bg-black overflow-hidden rounded-2xl">
          
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
          <h1 class="text-4xl max-w-19/20 font-extrabold text-maurealty-blue dark:text-white mb-4 ml-5">
            PROPERTY MANAGEMENT
          </h1>

          <hr width="100%" class="mb-4 text-maurealty-blue/30 dark:text-maurealty-light-blue/30">
      </header>

      <div>
        <form @submit.prevent="saveProperty" class="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-bold text-maurealty-blue dark:text-white mb-1">Title</label>
              <input type="text" v-model="form.listing_title" placeholder="e.g. Luxurious Home" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-maurealty-blue dark:focus:ring-maurealty-light-blue outline-none">
            </div>

            <div class="border-2 border-dashed border-maurealty-blue/20 dark:border-maurealty-light-blue/20 rounded-2xl p-6 bg-gray-50 dark:bg-gray-950">
              <div class="flex flex-wrap gap-4 mb-4">

                <div v-for="(img, index) in existingImages" :key="`existing-${index}`" class="relative w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden shadow-sm group">
                  <img :src="img.url" alt="Current property photo" class="object-cover size-full">
                  <span class="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">Current</span>
                  <button type="button" @click="removeExistingImage(index)" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold cursor-pointer">
                    ✕
                  </button>
                </div>

                <div v-for="(img, index) in imageFiles" :key="index" class="relative w-32 h-32 bg-gray-200 rounded-xl overflow-hidden shadow-sm group">
                  <img :src="img.preview" alt="Property Preview" class="object-cover size-full">
                  <button type="button" @click="removeImage(index)" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold cursor-pointer">
                    ✕
                  </button>
                </div>
                
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  ref="imageInput" 
                  class="hidden" 
                  @change="handleImageFileUpload"
                >
                
                <button type="button" @click="triggerImageFileInput" class="w-32 h-32 border-2 border-maurealty-blue dark:border-maurealty-light-blue flex flex-col items-center justify-center rounded-xl text-maurealty-blue dark:text-white hover:bg-maurealty-blue/5 dark:hover:bg-maurealty-light-blue/5 transition cursor-pointer">
                  <span class="text-3xl">+</span>
                  <span class="text-xs font-bold">Add Photo</span>
                </button>
              </div>
            </div>

            <div>
              <section class="flex items-baseline justify-between text-sm font-bold text-maurealty-blue dark:text-white mb-2">
                <label class="block">Description</label>
                <button type="button" class="py-1 px-2.5 border border-maurealty-blue dark:border-maurealty-light-blue rounded-xl hover:bg-maurealty-blue dark:hover:bg-maurealty-light-blue hover:text-white dark:hover:text-maurealty-blue transition-colors cursor-pointer" @click="toggleDescriptionMarkdown">
                    {{ (displayDescriptionMarkdown) ? "Edit" : "Preview" }}
                </button>
              </section>
              
              <textarea type="text" v-if="!displayDescriptionMarkdown" v-model="form.description" placeholder="e.g. This house has amazing features!" 
                        class="custom-scrollbar w-full h-auto min-h-40 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-maurealty-blue outline-none"></textarea>
              
              <div v-if="displayDescriptionMarkdown" class="markdownTypography max-w-none w-full h-auto min-h-40 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg p-3" v-html="compiledDescriptionMarkdown"></div>
              
              <p class="text-sm text-gray-500 italic">Note: description follows the Markdown format, read 
                <a target="_blank" rel="noopener noreferrer" class="text-blue-400 underline" href="https://www.markdownguide.org/basic-syntax/">this</a> 
              for formatting options</p>
            </div>
          </div>

          <div class="bg-blue-50/30 dark:bg-maurealty-light-blue/15 border border-maurealty-blue/10 rounded-2xl p-8">
            <div class="grid grid-cols-2 gap-4">
    
              <div class="col-span-1">
                <label class="block text-sm font-bold text-maurealty-blue dark:text-white mb-1">Price ({{ currentCurrency }})</label>
                <input type="number" step="0.01" v-model="form.price" class="w-full border border-gray-300 dark:border-gray-700 dark:border-gray-700 bg-white dark:bg-black dark:bg-black dark:text-white rounded-lg p-3">
              </div>
              <div class="col-span-1">
                <label class="block text-sm font-bold text-maurealty-blue dark:text-white mb-1">Commission (%)</label>
                <input type="number" step="any" v-model="form.commission" class="w-full border border-gray-300 dark:border-gray-700 dark:border-gray-700 bg-white dark:bg-black dark:bg-black dark:text-white rounded-lg p-3">
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-bold text-maurealty-blue dark:text-white mb-1">Location</label>
                <span class="w-full flex gap-2">
                  <input type="text" v-model="form.location" placeholder="Street, City, Province" class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black dark:bg-black dark:text-white rounded-lg p-3">
                  <button type="button" class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer rounded-lg p-3" @click="toggleMaps"><MapIcon /></button>
                </span>
              </div>

            <div class="col-span-2">
              <label class="block text-sm font-bold text-maurealty-blue dark:text-white mb-1">Developer</label>
              
              <Listbox v-model="form.dev_ID">
                <div class="relative">
                  <ListboxButton class="relative w-full cursor-default rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black dark:text-white p-3 text-left focus:outline-none focus:ring-2 focus:ring-maurealty-blue sm:text-sm transition-all">
                    <span class="block truncate text-gray-700 dark:text-gray-300">
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
                    <ListboxOptions class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-black dark:bg-black py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                      <ListboxOption
                        v-slot="{ active, selected }"
                        v-for="dev in developersList"
                        :key="dev.dev_ID ?? 'none'"
                        :value="dev.dev_ID"
                        as="template"
                      >
                        <li
                          :class="[
                            active ? 'bg-maurealty-blue/10 dark:bg-maurealty-light-blue/10 text-maurealty-blue dark:text-maurealty-light-blue' : 'text-gray-900 dark:text-gray-200',
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
              <label class="block text-sm font-bold text-maurealty-blue dark:text-white mb-1">Quantity Type</label>
              
              <Listbox v-model="form.is_bulk">
                <div class="relative">
                  <ListboxButton class="relative w-full cursor-default rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black dark:text-white p-3 text-left focus:outline-none focus:ring-2 focus:ring-maurealty-blue sm:text-sm transition-all">
                    <span class="block truncate text-gray-700 dark:text-gray-300">
                      {{ form.is_bulk ? 'Bulk' : 'Single' }}
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
                    <ListboxOptions class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-black dark:bg-black py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                      <ListboxOption
                        v-slot="{ active, selected }"
                        v-for="type in [{ label: 'Single', value: false }, { label: 'Bulk', value: true }]"
                        :key="type.label"
                        :value="type.value"
                        as="template"
                      >
                        <li
                          :class="[
                            active ? 'bg-maurealty-blue/10 dark:bg-maurealty-light-blue/10 text-maurealty-blue dark:text-maurealty-light-blue' : 'text-gray-900 dark:text-gray-200',
                            'relative cursor-default select-none py-2 pl-4 pr-4 transition-colors',
                          ]"
                        >
                          <span :class="[selected ? 'font-bold' : 'font-normal', 'block truncate']">
                            {{ type.label }}
                          </span>
                        </li>
                      </ListboxOption>
                    </ListboxOptions>
                  </transition>
                </div>
              </Listbox>
            </div>

              <div class="col-span-2">
                <label class="block text-sm font-bold text-maurealty-blue dark:text-white mb-1">Property Type</label>
                
                <Listbox v-model="form.property_type">
                  <div class="relative">

                    <ListboxButton class="relative w-full cursor-default rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black dark:text-white p-3 text-left focus:outline-none focus:ring-2 focus:ring-maurealty-blue sm:text-sm transition-all">
                      <span class="block truncate text-gray-700 dark:text-gray-300">{{ form.property_type }}</span>
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
                      <ListboxOptions class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-black py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                        <ListboxOption
                          v-slot="{ active, selected }"
                          v-for="choice in types"
                          :key="choice"
                          :value="choice"
                          as="template"
                        >
                          <li
                            :class="[
                              active ? 'bg-maurealty-blue/10 dark:bg-maurealty-light-blue/10 text-maurealty-blue dark:text-maurealty-light-blue' : 'text-gray-900 dark:text-gray-200',
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

<template v-if="form.property_type === 'House And Lot' && !form.is_bulk">
                <div class="col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-maurealty-blue/10 pt-4 mt-2">
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Lot Area</label>
                    <input type="number" step="any" v-model="form.lot_area" :placeholder="unitPlaceholder" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Floor Area</label>
                    <input type="number" step="any" v-model="form.floor_area" :placeholder="unitPlaceholder" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Rooms</label>
                    <input type="number" v-model="form.room_count" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Master Bedroom Area</label>
                    <input type="number" step="any" v-model="form.master_bedroom_area" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Toilets</label>
                    <input type="number" v-model="form.toilet_count" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Helper Rms</label>
                    <input type="number" v-model="form.helper_rooms_count" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Driver Rms</label>
                    <input type="number" v-model="form.driver_rooms_count" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Carpark Spaces</label>
                    <input type="number" v-model="form.carpark_count" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>
                </div>

                <div class="col-span-2 bg-white dark:bg-black border border-gray-200 rounded-xl p-4 mt-2">
                  <p class="text-xs font-bold text-maurealty-blue dark:text-white mb-3 uppercase opacity-70">Property Features</p>
                  <div class="flex flex-wrap gap-x-6 gap-y-3">
                    <label class="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" v-model="form.one_storey" class="w-4 h-4 accent-maurealty-blue rounded cursor-pointer">
                      <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-maurealty-blue dark:group-hover:text-maurealty-light-blue transition">One Storey</span>
                    </label>
                    
                    <label class="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" v-model="form.two_storey" class="w-4 h-4 accent-maurealty-blue rounded cursor-pointer">
                      <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-maurealty-blue dark:group-hover:text-maurealty-light-blue transition">Two Storey</span>
                    </label>

                    <label class="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" v-model="form.with_loft" class="w-4 h-4 accent-maurealty-blue rounded cursor-pointer">
                      <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-maurealty-blue dark:group-hover:text-maurealty-light-blue transition">With Loft</span>
                    </label>

                    <label class="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" v-model="form.townhome" class="w-4 h-4 accent-maurealty-blue rounded cursor-pointer">
                      <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-maurealty-blue dark:group-hover:text-maurealty-light-blue transition">Townhome</span>
                    </label>

                    <label class="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" v-model="form.rowhouse" class="w-4 h-4 accent-maurealty-blue rounded cursor-pointer">
                      <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-maurealty-blue dark:group-hover:text-maurealty-light-blue transition">Rowhouse</span>
                    </label>
                  </div>
                </div>
              </template>


              <template v-if="form.property_type === 'Lot Only' && !form.is_bulk">
                <div class="col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-maurealty-blue/10 pt-4 mt-2">
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Block No.</label>
                    <input type="number" v-model="form.block_number" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Lot No.</label>
                    <input type="number" v-model="form.lot_number" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Phase No.</label>
                    <input type="number" v-model="form.phase_number" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Area</label>
                    <input type="number" step="any" v-model="form.area" :placeholder="unitPlaceholder" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>
                
                  <div class="cols-2 md:col-span-4">
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Lot Class</label>
                    
                    <Listbox v-model="form.class">
                      <div class="relative">

                        <ListboxButton class="relative w-full cursor-default rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-3 text-left focus:outline-none focus:ring-2 focus:ring-maurealty-blue sm:text-sm transition-all">
                          <span class="block truncate text-gray-700 dark:text-gray-300">{{ form.class }}</span>
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
                          <ListboxOptions class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-black py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                            <ListboxOption
                              v-slot="{ active, selected }"
                              v-for="lotclass in lotClasses"
                              :key="lotclass"
                              :value="lotclass"
                              as="template"
                            >
                              <li
                                :class="[
                                  active ? 'bg-maurealty-blue/10 dark:bg-maurealty-light-blue/10 text-maurealty-blue dark:text-maurealty-light-blue' : 'text-gray-900 dark:text-gray-200',
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


              <template v-if="form.property_type === 'Condominium' && !form.is_bulk">
                <div class="col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-maurealty-blue/10 pt-4 mt-2">
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Unit No.</label>
                    <input type="number" v-model="form.unit_number" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Bedroom Count</label>
                    <input type="number" v-model="form.bedroom_count" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Balcony Count</label>
                    <input type="number" v-model="form.balcony_count" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Carpark Count</label>
                    <input type="number" v-model="form.carpark_count" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Master Bedroom Area</label>
                    <input type="number" step="any" v-model="form.master_bedroom_area" class="w-full dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg p-2 text-sm">
                  </div>

                  <div class="cols-2 md:col-span-4">
                    <label class="block text-xs font-bold text-maurealty-blue dark:text-white mb-1 uppercase opacity-70">Condominium Class</label>
                    
                    <Listbox v-model="form.class">
                      <div class="relative">

                        <ListboxButton class="relative w-full cursor-default rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-3 text-left focus:outline-none focus:ring-2 focus:ring-maurealty-blue sm:text-sm transition-all">
                          <span class="block truncate text-gray-700 dark:text-gray-300">{{ form.class }}</span>
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
                          <ListboxOptions class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-black py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                            <ListboxOption
                              v-slot="{ active, selected }"
                              v-for="condoclass in condoClasses"
                              :key="condoclass"
                              :value="condoclass"
                              as="template"
                            >
                              <li
                                :class="[
                                  active ? 'bg-maurealty-blue/10 dark:bg-maurealty-light-blue/10 text-maurealty-blue dark:text-maurealty-light-blue' : 'text-gray-900 dark:text-gray-200',
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

                  <div class="cols-2 md:col-span-4 bg-white dark:bg-black border border-gray-200 rounded-xl p-4 mt-2">
                      <p class="text-xs font-bold text-maurealty-blue dark:text-white mb-3 uppercase opacity-70">Condominium Type</p>
                      
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
                            class="w-4 h-4 accent-maurealty-blue cursor-pointer"
                          >
                          <span class="text-sm text-gray-700 dark:text-gray-300">{{ cType.label }}</span>
                        </label>
                      </div>
                  </div>
                </div>
              </template>


              <template v-if="form.property_type === 'Memorial' && !form.is_bulk">
                <div class="col-span-2 border-t border-maurealty-blue/10 pt-4 mt-2">
                  <div class="cols-6 bg-white dark:bg-black border border-gray-200 rounded-xl p-4 mt-2">
                      <p class="text-xs font-bold text-maurealty-blue dark:text-white mb-3 uppercase opacity-70">Memorial Type</p>

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
                            class="w-4 h-4 accent-maurealty-blue cursor-pointer"
                          >
                          <span class="text-sm text-gray-700 dark:text-gray-300">{{ mType.label }}</span>
                        </label>
                    </div>
                  </div>
                </div>
              </template>

            </div>
          </div>

          <div class="col-span-full">
              <section class="flex items-baseline justify-between text-sm font-bold text-maurealty-blue dark:text-white mb-2">
                <label class="block">Frequently Asked Questions</label>
                <span class="flex gap-3">
                  <button type="button" class="py-1 px-2.5 border border-maurealty-blue dark:border-maurealty-light-blue rounded-xl hover:bg-maurealty-blue dark:hover:bg-maurealty-light-blue hover:text-white dark:hover:text-maurealty-blue transition-colors cursor-pointer" @click="toggleFAQMarkdown">
                      {{ (displayFAQMarkdown) ? "Edit" : "Preview" }}
                  </button>
                  <button type="button" class="py-1 px-2.5 border border-maurealty-blue dark:border-maurealty-light-blue rounded-xl hover:bg-maurealty-blue dark:hover:bg-maurealty-light-blue hover:text-white dark:hover:text-maurealty-blue transition-colors cursor-pointer" @click="toggleQuestions">
                      {{ (displayQuestions) ? "Hide Questions" : "View Questions" }}
                  </button>
                </span>
                
              </section>
              
              <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div :class="[ !displayQuestions ? 'col-span-full' : '' ]">
                  <div v-if="!displayFAQMarkdown" class="w-full flex">
                    <textarea type="text" v-model="form.faq" placeholder="Follow this format:&#10;### (Question Here; click 'View Questions' for some examples or make up your own)&#10;- (Answers here)&#10;&#10;Note: Click Preview to see the formatting" 
                            class="custom-scrollbar w-full dark:text-white h-auto min-h-70 border border-gray-300 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-maurealty-blue outline-none"></textarea>
                    
                  </div>
                  
                  <div v-if="displayFAQMarkdown" class="markdownTypography dark:text-white max-w-none w-full h-auto min-h-70 border border-gray-300 dark:border-gray-700 rounded-lg p-3" v-html="compiledFAQMarkdown"></div>
                </div>

                <div v-if="displayQuestions" class="col-span-1 border border-gray-300 dark:border-gray-700 rounded-lg max-h-70 bg-gray-50 dark:bg-gray-900 overflow-y-auto custom-scrollbar">
                  <div v-for="(item, itemIndex) in questions.FAQs" :key="itemIndex" class="mb-3">
                    <h1 class="w-full bg-white dark:bg-black pt-2 pl-6 pb-4 font-bold uppercase text-xl text-maurealty-blue dark:text-maurealty-light-blue">{{ item.type }}</h1>
                    <div class="grid grid-cols-1 justify-items-start px-3">
                      <button v-for="(q, qIndex) in item.questionList"
                        type="button"
                        :key="qIndex" 
                        class="flex gap-2.5 items-center text-md text-gray-700 dark:text-gray-300 pl-4 py-1.5 hover:bg-maurealty-blue/15 dark:hover:bg-maurealty-light-blue/15 hover:font-semibold hover:text-lg transition-all w-full border-gray-200 dark:border-gray-800 cursor-pointer"
                        :class="(qIndex < item.questionList.length - 1) ? 'border-b' : ''"
                        @click="addQuestion(q.question)">
                          <PlusIcon class="size-5" /> {{ q.question }}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
              
              <p class="text-sm text-gray-500 italic">Note: FAQs follows the Markdown format, read 
                <a target="_blank" rel="noopener noreferrer" class="text-blue-400 underline" href="https://www.markdownguide.org/basic-syntax/">this</a> 
              for formatting options</p>
          </div>

          <!-- FACT SHEET -->
          <div class="col-span-full">
            <input 
              type="file" 
              accept="application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/markdown, application/pdf" 
              ref="factSheetInput" 
              class="hidden" 
              @change="handleFactSheetFileUpload"
            >

            <button type="button" @click="triggerFactSheetFileInput" class="size-full py-8 bg-blue-50/30 hover:bg-blue-50/50 border border-maurealty-blue/10 rounded-xl flex flex-col items-center gap-4 justify-center text-maurealty-blue dark:text-white cursor-pointer">
              <UploadIcon class="size-15" :stroke-width="3"/>
              <h3 v-if="!factSheetFile" class="italic">Upload a fact sheet (optional)</h3>
              <h3 v-else class="font-bold text-green-600 italic">{{ factSheetFile.name }}</h3>
            </button>
          </div>
          
          <div class="flex col-span-2 justify-end gap-4 mt-8">
              <button type="button" @click="goBack" class="px-8 py-3 border border-maurealty-blue dark:border-white text-maurealty-blue dark:text-white font-bold rounded-full hover:bg-gray-100 dark:hover:bg-maurealty-blue/40 transition cursor-pointer">
                CANCEL
              </button>
              <button type="submit" class="px-8 py-3 bg-maurealty-blue dark:bg-maurealty-light-blue text-white dark:text-maurealty-blue font-bold rounded-full shadow-md hover:bg-opacity-90 hover:bg-[#045fa3] dark:hover:bg-[#9dcef3] active:bg-white dark:active:bg-maurealty-blue active:text-maurealty-blue dark:active:text-white border border-maurealty-blue transition flex items-center gap-2 cursor-pointer">
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
import { MapIcon, PlusIcon, UploadIcon, XIcon } from 'lucide-vue-next';
import MapInteractive from '@/components/listings/MapInteractive.vue';
const displayMaps = ref(false);


function toggleMaps() {
  displayMaps.value = !displayMaps.value;
  console.log("Map display status: " + displayMaps.value);
}

// utilities
import { currentCurrency, currentUnit, convertPrice, convertArea, convertPriceToPHP, convertAreaToSqm } from '@/utils/conversion.ts';

const unitPlaceholder = computed(() => currentUnit.value === 'English' ? 'sqft' : 'sqm');

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
import questions from '@/assets/questions.json'
const displayFAQMarkdown = ref(false);
const displayQuestions = ref(false);

function toggleFAQMarkdown() {
  displayFAQMarkdown.value = !displayFAQMarkdown.value;
  console.log("FAQ Markdown display status: " + displayFAQMarkdown.value);
}

function toggleQuestions() {
  displayQuestions.value = !displayQuestions.value;
  console.log("Question display status: " + displayQuestions.value);
}

// Combine all interfaces for the form state
type PropertyForm = HouseAndLot & Lot & Condominium & Memorial & {
  listing_title?: string;
  dev_ID: number | null;
  is_bulk: boolean; 
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
      form.value.price = Number(convertPrice(data.price).toFixed(2));
      form.value.commission = data.commission;
      form.value.location = data.location;
      form.value.lng = data.longitude;
      form.value.lat = data.latitude;
      form.value.description = data.description;
      form.value.status = data.status;
      form.value.dev_ID = data.dev_ID;
      form.value.faq = data.faq;
      form.value.fact_sheet = data.fact_sheet;
      form.value.is_bulk = data.is_bulk || false;

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
        form.value.lot_area = Number(convertArea(subTableData.lot_area).toFixed(2));
        form.value.floor_area = Number(convertArea(subTableData.floor_area).toFixed(2));
        form.value.room_count = subTableData.rooms_count; // UI: room_count, DB: rooms_count
        form.value.toilet_count = subTableData.toilets_count;
        form.value.helper_rooms_count = subTableData.helper_rooms_count;
        form.value.driver_rooms_count = subTableData.driver_rooms_count;
        form.value.carpark_count = subTableData.carpark_count;
        form.value.master_bedroom_area = subTableData.master_bedroom_area;

      } else if (propertyType === 2) { // Lot Only
        const lotClassReverseMap: Record<number, string> = { 1: 'Residential', 2: 'Commercial', 3: 'Industrial', 4: 'Farm Lot' };
        
        form.value.block_number = Number(subTableData.block_number);
        form.value.lot_number = Number(subTableData.lot_number);
        form.value.phase_number = Number(subTableData.phase_number);
        form.value.area = Number(convertArea(subTableData.lot_area).toFixed(2)); // UI: area, DB: lot_area
        form.value.class = lotClassReverseMap[subTableData.lot_class_ID] || 'Residential';

      } else if (propertyType === 3) { // Condominium
        const condoClassReverseMap: Record<number, string> = { 1: 'Residential', 2: 'Commercial', 3: 'Industrial', 4: 'Condotel', 5: 'Timeshare' };
        
        form.value.class = condoClassReverseMap[subTableData.condo_class_ID] || 'Residential';
        form.value.unit_number = subTableData.unit_number;
        form.value.carpark_count = subTableData.carpark_count;
        form.value.balcony_count = subTableData.balcony_count;
        form.value.bedroom_count = subTableData.bedroom_count;
        form.value.master_bedroom_area = subTableData.master_bedroom_area;
        
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
  is_bulk: false, 
  price: 0,
  commission: 0,
  location: '',
  lng: 123.89315517066801,
  lat: 10.309933165401256,
  description: '',
  status: 'active',
  dev_ID: null,
  faq: '',
  fact_sheet: '',

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
  helper_rooms_count: 0,
  driver_rooms_count: 0,
  carpark_count: 0,
  master_bedroom_area: 0,

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
const imageInput = ref<HTMLInputElement | null>(null);

const triggerImageFileInput = () => {
  if (imageInput.value) imageInput.value.click();
};

const handleImageFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    Array.from(target.files).forEach(file => {
      imageFiles.value.push({
        file: file,
        preview: URL.createObjectURL(file) 
      });
    });
  }
  if (imageInput.value) imageInput.value.value = '';
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
  console.log(`[DEBUG] Queued existing image for deletion: ${image.url}`); // debugging

  existingImages.value.splice(index, 1);
};

const setExclusively = (group: (keyof PropertyForm)[], selectedField: keyof PropertyForm) => {
  group.forEach(field => {
    (form.value as any)[field] = (field === selectedField);
  });
};

// fact sheet functionality
const factSheetFile = ref<{ file: File; name: string } | null>(null);
const factSheetInput = ref<HTMLInputElement | null>(null);

const triggerFactSheetFileInput = () => {
  if (factSheetInput.value) factSheetInput.value.click();
};

const handleFactSheetFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0]; // Extract the single document upload
    
    if (file) {
      factSheetFile.value = {
        file: file,
        name: file.name
      };
      console.log("Fact sheet staged:", file.name);
    }
  }
  if (factSheetInput.value) factSheetInput.value.value = '';
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
        is_bulk: form.value.is_bulk,
        price: convertPriceToPHP(Number(form.value.price)) || 0,
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
          lot_area: convertAreaToSqm(Number(form.value.lot_area) || 0),
          floor_area: convertAreaToSqm(Number(form.value.floor_area) || 0),
          rooms_count: form.value.room_count, 
          toilets_count: form.value.toilet_count, 
          helper_rooms_count: form.value.helper_rooms_count,
          driver_rooms_count: form.value.driver_rooms_count,
          carpark_count: form.value.carpark_count,
          master_bedroom_area: form.value.master_bedroom_area
        };
      } else if (propertyTypeId === 2) { // Lot only
        const lotClassMap: Record<string, number> = { 'Residential': 1, 'Commercial': 2, 'Industrial': 3, 'Farm Lot': 4 };
        specificData = {
          block_number: String(form.value.block_number), 
          lot_number: String(form.value.lot_number),
          phase_number: String(form.value.phase_number),
          lot_area: convertAreaToSqm(Number(form.value.area) || 0), 
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
          bedroom_count: form.value.bedroom_count,
          master_bedroom_area: form.value.master_bedroom_area
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

        if (factSheetFile.value) {
          console.log("[DEBUG] Uploading fact sheet for new listing...");
          try {
            await listingsService.uploadFactSheet(propertyId, factSheetFile.value.file);
            console.log("[DEBUG] Fact sheet uploaded successfully.");
          } catch (err) {
            console.error("[DEBUG] Failed to upload fact sheet:", err);
          }
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
        is_bulk: form.value.is_bulk,
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
          helper_rooms_count: form.value.helper_rooms_count,
          driver_rooms_count: form.value.driver_rooms_count,
          carpark_count: form.value.carpark_count,
          master_bedroom_area: form.value.master_bedroom_area
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
          bedroom_count: form.value.bedroom_count,
          master_bedroom_area: form.value.master_bedroom_area
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
        // --- Image Deletion Logic ---
        if (removedImageUrls.value.length > 0) {
          console.log(`[DEBUG] Attempting to delete ${removedImageUrls.value.length} image(s)...`);
          
          // Deep copy array to sever reactive proxy bindings before passing to service
          const cleanUrls = JSON.parse(JSON.stringify(removedImageUrls.value));
          
          try {
            const deleteResult = await listingsService.deleteListingImages(cleanUrls);
            if (!deleteResult.success) {
              alert("Warning: Images were removed from storage but the database records could not be deleted. Please verify your Supabase RLS delete policy on the 'listing_images' table.");
            } else {
              console.log("[DEBUG] Image deletion transaction finished successfully.");
            }
          } catch (deleteError) {
            console.error("[DEBUG] Image deletion threw an error:", deleteError);
            alert("An error occurred while deleting images. Check the console.");
          }
        }

        if (imageFiles.value.length > 0) {
          const filesToUpload = imageFiles.value.map(img => img.file);
          await listingsService.uploadPropertyImages(propertyId, filesToUpload);
        }

        console.log(factSheetFile.value);
        if (factSheetFile.value) {
          console.log("[DEBUG] Uploading fact sheet for new listing...");
          try {
            await listingsService.uploadFactSheet(propertyId, factSheetFile.value.file);
            console.log("[DEBUG] Fact sheet uploaded successfully.");
          } catch (err) {
            console.error("[DEBUG] Failed to upload fact sheet:", err);
          }
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

// to add a selected question into the faq
function addQuestion(question: string) {
  if (form.value.faq) {
    form.value.faq += `\n\n`;
  }

  form.value.faq += `### ${question}\n- `
}

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