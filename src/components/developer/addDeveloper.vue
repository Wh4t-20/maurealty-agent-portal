<template>
    <div class="absolute inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm py-10">
        
        <div class="custom-scrollbar bg-white w-10/12 max-h-full overflow-y-auto rounded-3xl border border-gray-400 p-10 shadow-xl">
            <header class="relative">
                <h1 class="text-4xl max-w-19/20 font-extrabold text-maurealty-blue mb-4 ml-5">
                    ADD NEW DEVELOPER
                </h1>

                <button class="absolute top-0 right-0 p-3 rounded-full hover:bg-gray-200/40 transition-colors cursor-pointer" @click="$emit('closeAddDeveloper')">
                    <XIcon class="size-6" stroke-width="3"/>
                </button>

                <hr width="100%" class="mb-4 text-maurealty-blue/30">
            </header>

            <form @submit.prevent="saveDeveloper" class="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-5 mx-5">
                
                <section class="flex flex-col gap-4">
                    <div class="flex items-center gap-5 w-full">
                        <label class="block text-2xl font-bold text-maurealty-blue mb-1">Name:</label>
                        <input type="text" placeholder="e.g. MauRealty Developer" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                    </div>

                    <div class="flex items-center gap-5 w-full">
                        <label class="block text-2xl font-bold text-maurealty-blue mb-1">Location:</label>
                        <input type="text" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                    </div>

                    <hr width="100%" class="my-2 text-maurealty-blue/30">

                    <div class="grid grid-cols-2 gap-x-3 w-full">
                        <h1 class="col-span-2 block text-2xl font-bold text-maurealty-blue mb-2">Contact details</h1>
                        <span class="justify-items-center">
                          <label class="block text-lg font-bold text-maurealty-blue mb-1">Phone No.</label>
                            <input type="text" placeholder="(+63)900-000-0000" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                        </span>
                        <span class="justify-items-center">
                          <label class="block text-lg font-bold text-maurealty-blue mb-1">Email</label>
                            <input type="email" placeholder="developer@email.com" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                        </span>
                    </div>

                    <hr width="100%" class="my-2 text-maurealty-blue/30">

                    <div class="grid grid-cols-3 gap-x-3 w-full">
                        <h1 class="col-span-3 block text-2xl font-bold text-maurealty-blue mb-2">Office Hours</h1>
                        <span class="justify-items-center">

                            <label class="block text-lg font-bold text-maurealty-blue mb-1">Available Days</label>
                            
                            <Listbox v-model="selectedDays" multiple>
                                <div class="relative w-full">
                                    <ListboxButton class="relative w-full border border-gray-300 rounded-lg p-2 text-left focus:ring-2 focus:ring-maurealty-blue outline-none bg-white cursor-default">
                                        <span class="block truncate">
                                            {{ displayShortcuts }}
                                        </span>
                                        <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                            <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                                                <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>
                                        </span>
                                    </ListboxButton>

                                    <transition leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
                                        <ListboxOptions class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
                                            <ListboxOption
                                                v-slot="{ active, selected }"
                                                v-for="day in days"
                                                :key="day.id"
                                                :value="day"
                                                as="template"
                                            >
                                                <li :class="[active ? 'bg-maurealty-blue/10 text-maurealty-blue' : 'text-gray-900', 'relative cursor-default select-none py-2 px-4 flex items-center gap-3']">
                                                    <input 
                                                        type="checkbox" 
                                                        :checked="selected" 
                                                        class="h-4 w-4 rounded border-gray-300 text-maurealty-blue focus:ring-maurealty-blue pointer-events-none" 
                                                    />
                                                    <span :class="[selected ? 'font-medium text-maurealty-blue' : 'font-normal', 'block truncate']">
                                                        {{ day.name }}
                                                    </span>
                                                </li>
                                            </ListboxOption>
                                        </ListboxOptions>
                                    </transition>
                                </div>
                            </Listbox>

                        </span>
                        <span class="justify-items-center">
                          <label class="block text-lg font-bold text-maurealty-blue mb-1">Open Hours</label>
                            <input type="time" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                        </span>
                        <span class="justify-items-center">
                          <label class="block text-lg font-bold text-maurealty-blue mb-1">Closed Hours</label>
                            <input type="time" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                        </span>
                    </div>
                </section>

                <section class="flex flex-col gap-5 items-center justify-start p-5">
                    
                    <div class="relative w-[40%] aspect-square bg-gray-200 rounded-full overflow-hidden shadow-sm group border-2 border-maurealty-blue">
                        <img v-if="!currentImage" :src="placeholder" alt="Developer Profile" class="object-cover size-full">
                        <img v-if="currentImage" :src="currentImage.preview" alt="Developer Profile" class="object-cover size-full">
                    </div>
                    
                    <input 
                        type="file"  
                        accept="image/*" 
                        ref="fileInput" 
                        class="hidden" 
                        @change="handleFileUpload"
                    >
                    
                    <div class="w-full flex gap-2">
                        <button type="button" v-if="currentImage" @click="removeImage" class="h-auto w-full border-2 py-3 border-maurealty-blue rounded-xl flex flex-col items-center justify-center text-maurealty-blue hover:bg-maurealty-blue/5 transition">
                            <span class="text-xl ">✕ Remove Image</span>
                        </button>

                        <button type="button" @click="triggerFileInput" class="h-auto w-full border-2 py-3 border-maurealty-blue rounded-xl flex flex-col items-center justify-center text-maurealty-blue hover:bg-maurealty-blue/5 transition">
                            <span class="text-xl ">+ Upload {{ (currentImage) ? 'New' : ''  }} Image</span>
                        </button>
                    </div>
                    
                </section>

                <section class="col-span-full w-full">
                    <button type="submit" class="w-full border-2 py-3 border-maurealty-blue rounded-xl flex flex-col items-center justify-center bg-maurealty-blue text-white hover:bg-maurealty-blue/5 hover:text-maurealty-blue transition">
                        <span class="text-2xl font-semibold">★ SAVE DEVELOPER</span>
                    </button>

                </section>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
import { type DayOption } from '@/assets/classes/developers';
import placeholder from '@/assets/images/default_placeholder.png'
import { XIcon } from 'lucide-vue-next';

// reminder to safeguard the non-nullable inputs pls (error message if missing part)

// taken from Property Management 
// Image Handling Logic
const currentImage = ref<{ file: File; preview: string }>();
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  if (fileInput.value) fileInput.value.click();
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  
  if (target.files && target.files.length > 0) {
    const file = target.files[0];

    if (!file) return;

    if (currentImage.value) {
        URL.revokeObjectURL(currentImage.value.preview);
    }

    currentImage.value = {
      file: file,
      preview: URL.createObjectURL(file) 
    };
  }
  
  if (fileInput.value) fileInput.value.value = '';
};

const removeImage = () => {
  if (currentImage.value) {
    URL.revokeObjectURL(currentImage.value.preview); 
    currentImage.value = undefined;
  }
};

function saveDeveloper() {
    console.log("Saving developer");
}

// for the days logic
const days: DayOption[] = [
    { id: 1, name: 'Monday', shortcut: 'Mon' },
    { id: 2, name: 'Tuesday', shortcut: 'Tue' },
    { id: 3, name: 'Wednesday', shortcut: 'Wed' },
    { id: 4, name: 'Thursday', shortcut: 'Thu' },
    { id: 5, name: 'Friday', shortcut: 'Fri' },
    { id: 6, name: 'Saturday', shortcut: 'Sat' },
    { id: 7, name: 'Sunday', shortcut: 'Sun' },
]

const selectedDays = ref<DayOption[]>([]);

const displayShortcuts = computed(() => {
    if (selectedDays.value.length === 0) return 'Select days';
    
    const sortedDays = [...selectedDays.value].sort((a, b) => a.id - b.id);
    return sortedDays.map(day => day.shortcut).join(', ');
});
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
</style>