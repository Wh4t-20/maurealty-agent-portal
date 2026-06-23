<template>
    <div class="absolute h-screen w-full z-5 bg-black/25 backdrop-blur-sm flex items-center justify-center">
        <div class="bg-white w-full rounded-3xl border border-gray-400 my-30 mx-40 p-10">

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
                        <input v-model="form.name" type="text" placeholder="e.g. MauRealty Developer" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
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
                            <input v-model="form.contact_number" type="text" placeholder="(+63)900-000-0000" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
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
                            <input v-model="openhours" type="time" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                        </span>
                        <span class="justify-items-center">
                          <label class="block text-lg font-bold text-maurealty-blue mb-1">Closed Hours</label>
                            <input v-model="closedhours" type="time" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
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
                        <button type="button" @click="removeImage" class="h-12 w-full border-2 py-3 border-maurealty-blue rounded-xl flex flex-col items-center justify-center text-maurealty-blue hover:bg-maurealty-blue/5 transition">
                            <span class="text-xl ">✕ Remove Image</span>
                        </button>

                        <button type="button" @click="triggerFileInput" class="h-12 w-full border-2 py-3 border-maurealty-blue rounded-xl flex flex-col items-center justify-center text-maurealty-blue hover:bg-maurealty-blue/5 transition">
                            <span class="text-xl ">+ Upload Image</span>
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
import { ref, computed, watch} from 'vue';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
import { type DayOption } from '@/assets/classes/developers';
import placeholder from '@/assets/images/default_placeholder.png'
import { XIcon } from 'lucide-vue-next';
import { developerService, reformatHours } from '@/services/developerService';
import { type Developer } from '@/assets/classes/developers';

// reminder to safeguard the non-nullable inputs pls (error message if missing part)

// taken from Property Management 
// Image Handling Logic

//need to complete saveDeveloper function to include the image file in the payload when adding a new developer

const props = defineProps<{ dev: Developer }>()
const editMode = ref(false);
watch(() => props.dev, (newDev) => {
        if (newDev) {
        editMode.value = true;
        form.value = newDev;
        openhours.value = reformatHours(newDev.hours)[0];
        closedhours.value = reformatHours(newDev.hours)[1];
        currentImage.value = { file: null as any, preview: newDev.profile_url };
        selectedDays.value = days.filter(day => newDev.available_days === day.id);
    } else {
        editMode.value = false;
        form.value = {};
        openhours.value = '';
        closedhours.value = '';
        currentImage.value = undefined;
        selectedDays.value = [];
    }
}, { immediate: true })
const form = ref<Partial<Developer>>({});
const openhours = ref('');
const closedhours = ref('');
const currentImage = ref<{ file: File; preview: string }>();
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  if (fileInput.value) fileInput.value.click();
};

const handleFileUpload = (event: Event) => { // The purpose of this code block is to store the uploaded image file into a state wtih which we can work on
    // So now, we need to do something with that file after it has been stored
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

async function saveDeveloper() {
    const payload: Developer = {
        dev_ID: null,
        profile_url: '',
        name: form.value.name ?? '',
        contact_number: form.value.contact_number ?? '',
        contact_email: form.value.contact_email ?? '',
        location: form.value.location ?? '',
        available_days: selectedDays.value.map(day => day.id)[0],
        hours: `${openhours.value} - ${closedhours.value}`
    };
    
    const devID = await developerService.addDeveloper(payload);
    let imageUrl = '';
    if (currentImage.value && currentImage.value.file) {
        imageUrl = await developerService.uploadImage(devID,currentImage.value.file);
        await developerService.updateDeveloper({ ...payload, dev_ID: devID, profile_url: imageUrl });

    }
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