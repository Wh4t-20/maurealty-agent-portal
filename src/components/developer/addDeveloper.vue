<template>
    <div class="absolute inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm py-10">
        
        <div class="custom-scrollbar bg-white dark:bg-black w-10/12 max-h-full overflow-y-auto rounded-3xl border border-gray-400 dark:border-gray-800 p-10 shadow-xl">
            <header class="relative">
                <h1 class="text-4xl max-w-19/20 font-extrabold text-maurealty-blue dark:text-white mb-4 ml-5">
                    ADD NEW DEVELOPER
                </h1>

                <button class="absolute top-0 right-0 p-3 rounded-full dark:text-white hover:bg-gray-200/40 dark:hover:bg-gray-200/20 transition-colors cursor-pointer" @click="$emit('close-add-developer')">
                    <XIcon class="size-6" stroke-width="3"/>
                </button>

                <hr width="100%" class="mb-4 text-maurealty-blue/30 dark:text-maurealty-light-blue/30">
            </header>

            <form @submit.prevent="saveDeveloper" class="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-5 mx-5">
                
                <section class="flex flex-col gap-4">
                    <div class="flex items-center gap-5 w-full">
                        <label class="block text-2xl font-bold text-maurealty-blue dark:text-white mb-1">Name:</label>
                        <input v-model="form.name" type="text" placeholder="e.g. MauRealty Developer" class="w-full dark:text-white border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                    </div>

                    <div class="flex items-center gap-5 w-full">
                        <label class="block text-2xl font-bold text-maurealty-blue dark:text-white mb-1">Location:</label>
                        <input v-model="form.location" type="text" class="w-full dark:text-white border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                    </div>

                    <hr width="100%" class="my-2 text-maurealty-blue/30 dark:text-maurealty-light-blue/30">

                    <div class="grid grid-cols-2 gap-x-3 w-full">
                        <h1 class="col-span-2 block text-2xl font-bold text-maurealty-blue dark:text-white mb-2">Contact details</h1>
                        <span class="justify-items-center">
                          <label class="block text-lg font-bold text-maurealty-blue dark:text-white mb-1">Phone No.</label>
                            <input v-model="form.phone" type="text" placeholder="(+63)900-000-0000" class="w-full dark:text-white border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                        </span>
                        <span class="justify-items-center">
                          <label class="block text-lg font-bold text-maurealty-blue dark:text-white mb-1">Email</label>
                            <input v-model="form.email" type="email" placeholder="developer@email.com" class="w-full dark:text-white border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                        </span>
                    </div>

                    <hr width="100%" class="my-2 text-maurealty-blue/30 dark:text-maurealty-light-blue/30">

                    <!-- DYNAMIC OFFICE HOURS SECTION -->
                    <div class="flex flex-col gap-4 w-full">
                        <div class="flex justify-between items-center">
                            <h1 class="text-2xl font-bold text-maurealty-blue dark:text-white">Office Hours</h1>
                            <button 
                                type="button" 
                                @click="addHoursSlot"
                                class="text-sm font-semibold text-white dark:text-maurealty-blue bg-maurealty-blue dark:bg-white hover:bg-maurealty-blue/90 dark:hover:bg-white/80 px-3 py-1.5 rounded-lg transition"
                            >
                                + Add Schedule
                            </button>
                        </div>

                        <div 
                            v-for="(slot, index) in officeHours" 
                            :key="index" 
                            class="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-2 items-end p-4 border border-gray-200 dark:border-gray-700 rounded-xl relative bg-gray-50/50 dark:bg-gray-50/20"
                        >
                            <!-- Remove Slot Button -->
                            <button 
                                v-if="officeHours.length > 1"
                                type="button" 
                                @click="removeHoursSlot(index)"
                                class="absolute -top-2 -right-2 bg-red-400 text-white p-1 rounded-full hover:bg-red-500 transition shadow-sm"
                                title="Remove schedule block"
                            >
                                <XIcon class="size-4" stroke-width="2.5"/>
                            </button>

                            <span class="flex flex-col">
                                <label class="block text-base font-bold text-maurealty-blue dark:text-white mb-1">Available Days</label>
                                <Listbox v-model="slot.selectedDays" multiple>
                                    <div class="relative w-full">
                                        <ListboxButton class="relative w-full dark:bg-black dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-left focus:ring-2 focus:ring-maurealty-blue outline-none bg-white cursor-default">
                                            <span class="block truncate">
                                                {{ displayShortcuts(slot.selectedDays) }}
                                            </span>
                                            <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                                                    <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                                </svg>
                                            </span>
                                        </ListboxButton>

                                        <transition leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
                                            <ListboxOptions class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-black py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-20">
                                                <ListboxOption
                                                    v-slot="{ active, selected }"
                                                    v-for="day in days"
                                                    :key="day.id"
                                                    :value="day"
                                                    as="template"
                                                >
                                                    <li :class="[active ? 'bg-maurealty-blue/10 text-maurealty-blue dark:text-white' : 'text-gray-900 dark:text-gray-300', 'relative cursor-default select-none py-2 px-4 flex items-center gap-3']">
                                                        <input 
                                                            type="checkbox" 
                                                            :checked="selected" 
                                                            class="h-4 w-4 rounded border-gray-300 text-maurealty-blue dark:text-maurealty-light-blue focus:ring-maurealty-blue pointer-events-none" 
                                                        />
                                                        <span :class="[selected ? 'font-medium text-maurealty-blue dark:text-maurealty-light-blue' : 'font-normal', 'block truncate']">
                                                            {{ day.name }}
                                                        </span>
                                                    </li>
                                                </ListboxOption>
                                            </ListboxOptions>
                                        </transition>
                                    </div>
                                </Listbox>
                            </span>

                            <span class="flex flex-col">
                                <label class="block text-base font-bold text-maurealty-blue dark:text-white mb-1">Open Hours</label>
                                <span class="flex gap-1">
                                    <input v-if="!slot.isOpenUnavailable " type="time" v-model="slot.openTime"
                                            class="bg-white dark:bg-black dark:text-white dark:scheme-dark border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-maurealty-blue w-full border rounded-lg p-2 outline-none">
                                    <input v-if="slot.isOpenUnavailable " type="text"
                                            :disabled="true"
                                            placeholder="Unavailable"
                                            class="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed w-full border rounded-lg p-2 outline-none select-none">
                                        
                                    <button type="button" @click="toggleOpenUnavailable(slot)" 
                                            class="w-fit p-2 border rounded-lg bg-white dark:bg-black text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 active:bg-maurealty-blue active:text-white cursor-pointer"
                                            :title="slot.isOpenUnavailable ? 'Make Available' : 'Mark Unavailable'">
                                            <XIcon v-if="!slot.isOpenUnavailable" />
                                            <CheckIcon v-if="slot.isOpenUnavailable" />
                                    </button>  
                                </span>
                            </span>

                            <span class="flex flex-col">
                                <label class="block text-base font-bold text-maurealty-blue dark:text-white mb-1">Close Hours</label>
                                <span class="flex gap-1">
                                    <input v-if="!slot.isCloseUnavailable " type="time" v-model="slot.closeTime"
                                            class="bg-white dark:bg-black dark:text-white dark:scheme-dark border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-maurealty-blue w-full border rounded-lg p-2 outline-none">
                                    <input v-if="slot.isCloseUnavailable " type="text"
                                            :disabled="true"
                                            placeholder="Unavailable"
                                            class="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed w-full border rounded-lg p-2 outline-none select-none">
                                        
                                    <button type="button" @click="toggleCloseUnavailable(slot)" 
                                            class="w-fit p-2 border rounded-lg bg-white dark:bg-black text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 active:bg-maurealty-blue active:text-white cursor-pointer"
                                            :title="slot.isCloseUnavailable ? 'Make Available' : 'Mark Unavailable'">
                                            <XIcon v-if="!slot.isCloseUnavailable" />
                                            <CheckIcon v-if="slot.isCloseUnavailable" />
                                    </button>  
                                </span>
                            </span>

                        </div>
                    </div>
                </section>

                <section class="flex flex-col gap-5 items-center justify-start p-5">
                    
                    <div class="relative w-[40%] aspect-square bg-gray-200 rounded-full overflow-hidden shadow-sm group border-2 border-maurealty-blue dark:border-maurealty-light-blue">
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
                        <button type="button" v-if="currentImage" @click="removeImage" class="h-auto w-full border-2 py-3 border-maurealty-blue dark:border-maurealty-light-blue rounded-xl flex flex-col items-center justify-center bg-maurealty-blue dark:bg-maurealty-light-blue text-white dark:text-maurealty-blue hover:bg-maurealty-blue/5 hover:text-maurealty-blue dark:hover:text-maurealty-light-blue transition">
                            <span class="text-xl ">✕ Remove Image</span>
                        </button>

                        <button type="button" @click="triggerFileInput" class="h-auto w-full border-2 py-3 border-maurealty-blue dark:border-maurealty-light-blue rounded-xl flex flex-col items-center justify-center bg-maurealty-blue dark:bg-maurealty-light-blue text-white dark:text-maurealty-blue hover:bg-maurealty-blue/5 hover:text-maurealty-blue dark:hover:text-maurealty-light-blue transition">
                            <span class="text-xl ">+ Upload {{ (currentImage) ? 'New' : ''  }} Image</span>
                        </button>
                    </div>
                    
                </section>

                <section class="col-span-full w-full">
                    <button type="submit" class="w-full border-2 py-3 border-maurealty-blue dark:border-maurealty-light-blue rounded-xl flex flex-col items-center justify-center bg-maurealty-blue dark:bg-maurealty-light-blue text-white dark:text-maurealty-blue hover:bg-maurealty-blue/5 hover:text-maurealty-blue dark:hover:text-maurealty-light-blue transition">
                        <span class="text-2xl font-semibold">★ SAVE DEVELOPER</span>
                    </button>

                </section>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted} from 'vue';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
import { type DayOption, type OfficeHourSlot, days } from '@/assets/classes/developers';
import placeholder from '@/assets/images/default_placeholder.png'
import { CheckIcon, XIcon } from 'lucide-vue-next';
import { developerService, reformatHours } from '@/services/developerService';
import { type Developer } from '@/assets/classes/developers';

// reminder to safeguard the non-nullable inputs pls (error message if missing part)

// taken from Property Management 
// Image Handling Logic

const props = defineProps<{ dev?: Developer }>()
const editMode = ref(false);
const oldDev = ref<Partial<Developer>>({});
const form = ref<Partial<Developer>>({});
const currentImage = ref<{ file: File; preview: string }>();
const fileInput = ref<HTMLInputElement | null>(null);
const oldOfficeHours = ref<OfficeHourSlot[]>([]);
const officeHours = ref<OfficeHourSlot[]>([
    { selectedDays: [], openTime: '', closeTime: '', isOpenUnavailable: false, isCloseUnavailable: false }
]);
watch(() => props.dev, (newDev) => {
        if (newDev) {
        editMode.value = true;
        oldDev.value = { ...newDev }; //this is for comparing if the dev has been changed or not in edit mode when saving
        form.value = newDev;
        currentImage.value = { file: null as any, preview: newDev.image_url };
        officeHours.value = newDev.OfficeHours;
        if (newDev.OfficeHours && newDev.OfficeHours.length > 0) { //change in office hours is checked separately from the rest
            
            oldOfficeHours.value = JSON.parse(JSON.stringify(newDev.OfficeHours));
        } else {
            const defaultSlot = { selectedDays: [], openTime: '', closeTime: '', isOpenUnavailable: false, isCloseUnavailable: false };
            oldOfficeHours.value = [JSON.parse(JSON.stringify(defaultSlot))];
        }
    } else {
        editMode.value = false;
        form.value = {};
        currentImage.value = undefined;
    }
}, { immediate: true })


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

async function saveDeveloper() {
    const payload: Developer = {
        dev_ID: form.value.dev_ID ?? -1, // Placeholder, will be replaced after creation
        image_url: form.value.image_url ?? '',  
        name: form.value.name ?? '',
        phone: form.value.phone ?? '',
        email: form.value.email ?? '',
        location: form.value.location ?? '',
        OfficeHours: officeHours.value ?? [],
        projects: form.value.projects ?? [] // Ensure projects is included in the payload
    };
    
    
    if (oldDev.value !== undefined && oldDev.value !== payload && editMode.value) {
        await developerService.updateDeveloper(payload, oldOfficeHours.value);
        console.log("Updated Developer ID: ", payload.dev_ID);
        form.value = {
            dev_ID: -1,
            image_url: '',
            name: '',
            phone: '',
            email: '',
            OfficeHours: [],
            projects: []
        }
        return;
    }
    else if (oldDev.value !== undefined && oldDev.value === payload && editMode.value) {
        console.error("No change detected. Developer not updated.");
        return;
    }
    else{
        const devID = await developerService.addDeveloper(payload);
        console.log("New Developer ID: ", devID);

        let imageUrl = '';
        if (currentImage.value && currentImage.value.file) {
            imageUrl = await developerService.uploadImage(devID,currentImage.value.file);
            await developerService.updateDeveloper({ ...payload, dev_ID: devID, image_url: imageUrl }, oldOfficeHours.value); //second parameter is kinda irrelevant for adding new dev, but its genuinely needed to track if office hours has been changed from editing in edit mode
        }
    }
    
}



const addHoursSlot = () => {
    officeHours.value.push({ selectedDays: [], openTime: '', closeTime: '', isOpenUnavailable: false, isCloseUnavailable: false });
};

const removeHoursSlot = (index: number) => {
    if (officeHours.value.length > 1) {
        officeHours.value.splice(index, 1);
    }
};

const toggleOpenUnavailable = (slot: OfficeHourSlot) => {
    slot.isOpenUnavailable = !slot.isOpenUnavailable;
    if (slot.isOpenUnavailable) {
        slot.openTime = '';
    }
};

const toggleCloseUnavailable = (slot: OfficeHourSlot) => {
    slot.isCloseUnavailable = !slot.isCloseUnavailable;
    if (slot.isCloseUnavailable) {
        slot.closeTime = '';
    }
};

const displayShortcuts = (selectedDaysList: DayOption[]) => {
    if (!selectedDaysList || selectedDaysList.length === 0) return 'Select days';
    
    const sortedDays = [...selectedDaysList].sort((a, b) => a.id - b.id);
    return sortedDays.map(day => day.shortcut).join(', ');
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
  background-color: #044677; 
  border-radius: 9999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #172b66; 
}
</style>