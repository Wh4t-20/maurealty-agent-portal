<template>
    <form @submit.prevent="saveAgentDetails" class="bg-gray-100 dark:bg-mist-950 w-full max-w-7xl rounded-2xl shadow-md p-5 sm:p-10 flex flex-col gap-5">
        <!-- Photo on top for phones, photo beside the form on wide screens -->
        <div class="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-10">
            <div class="relative flex flex-col items-center justify-center">
                <img
                :src=" form.profile_url || placeholder"
                alt="Profile"
                class="w-40 h-40 sm:w-56 sm:h-56 lg:w-80 lg:h-80 object-cover rounded-full border-4 border-white shadow"
                />

                <input 
                    type="file"  
                    accept="image/*" 
                    ref="fileInput" 
                    class="hidden" 
                    @change="handleFileUpload"
                >

                <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-2 mt-5">
                    <button type="button" v-if="form.profile_url" @click="removeImage" class="flex flex-col items-center py-2 px-5 rounded-xl border-2 border-red-600 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-colors cursor-pointer">
                        <span class="flex items-center-safe gap-1.5"><Trash2 class="size-4" /> DELETE</span>
                    </button>

                    <button type="button" v-if="checkReversible()" @click="revertImage" class="flex flex-col items-center py-2 px-5 rounded-xl border-2 border-maurealty-blue dark:border-maurealty-light-blue text-maurealty-blue dark:text-maurealty-light-blue font-bold hover:bg-maurealty-blue dark:hover:bg-maurealty-light-blue hover:text-white dark:hover:text-maurealty-blue transition-colors cursor-pointer">
                        <span class="flex items-center-safe gap-1.5"><Undo2 class="size-4" /> REVERT</span>
                    </button>

                    <button type="button" @click="triggerFileInput" class="flex flex-col items-center py-2 px-5 rounded-xl border-2 border-maurealty-blue dark:border-maurealty-light-blue text-maurealty-blue dark:text-maurealty-light-blue font-bold hover:bg-maurealty-blue dark:hover:bg-maurealty-light-blue hover:text-white dark:hover:text-maurealty-blue transition-colors cursor-pointer"
                            :class="[ form.profile_url || checkReversible() ? '' : 'col-span-full' ]">
                        <span class="flex items-center-safe gap-1.5"><Upload class="size-4" />{{ form.profile_url ? 'CHANGE' : 'UPLOAD' }}</span>
                    </button>
                </div>
            </div>

            <div class="flex-1 w-full space-y-3">
                <div class="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div class="col-span-full">
                        <label class="text-maurealty-blue dark:text-maurealty-light-blue font-bold text-xl block">FULL NAME</label>
                        
                        <div class="grid grid-cols-1 sm:grid-cols-3 mt-2 gap-4">
                            <div class="flex flex-col gap-1">
                                <label class="text-maurealty-blue dark:text-maurealty-light-blue font-medium text-sm block">First Name</label>
                                <input type="text" v-model="form.first_name" class="w-full bg-white dark:bg-black dark:text-white border border-gray-300 rounded-lg p-3 py-1.75 focus:ring-2 focus:ring-maurealty-blue outline-none">
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-maurealty-blue dark:text-maurealty-light-blue font-medium text-sm block">Middle Name (if applicable)</label>
                                <input type="text" v-model="form.middle_name" class="w-full bg-white dark:bg-black dark:text-white border border-gray-300 rounded-lg p-3 py-1.75 focus:ring-2 focus:ring-maurealty-blue outline-none">
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-maurealty-blue dark:text-maurealty-light-blue font-medium text-sm block">Last Name</label>
                                <input type="text" v-model="form.last_name" class="w-full bg-white dark:bg-black dark:text-white border border-gray-300 rounded-lg p-3 py-1.75 focus:ring-2 focus:ring-maurealty-blue outline-none">
                            </div>
                        </div>
                    </div>          

                    <div class="flex flex-col gap-1">
                        <label class="text-maurealty-blue dark:text-maurealty-light-blue font-medium text-sm block">Sex</label>
                        <Listbox v-model="form.sex">
                            <div class="relative">
                                <ListboxButton class="relative w-full cursor-default rounded-lg border border-gray-300 bg-white dark:bg-black p-3 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-maurealty-blue sm:text-sm transition-all">
                                    <span class="block truncate text-gray-700 dark:text-gray-300">
                                    {{ form.sex }}
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
                                    <ListboxOptions class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-black dark:text-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                    <ListboxOption
                                        v-slot="{ active, selected }"
                                        v-for="s in sexes"
                                        :key="s"
                                        :value="s"
                                        as="template"
                                    >
                                        <li
                                        :class="[
                                            active ? 'bg-maurealty-blue/10 dark:bg-maurealty-light-blue/10 text-maurealty-blue dark:text-maurealty-light-blue' : 'text-gray-900 dark:text-gray-200',
                                            'relative cursor-default select-none py-2 pl-4 pr-4 transition-colors',
                                        ]"
                                        >
                                        <span :class="[selected ? 'font-bold' : 'font-normal', 'block truncate']">
                                            {{ s }}
                                        </span>
                                        </li>
                                    </ListboxOption>
                                    </ListboxOptions>
                                </transition>
                            </div>
                        </Listbox>
                    </div>

                    <div class="flex flex-col gap-1">
                        <label class="text-maurealty-blue dark:text-maurealty-light-blue font-medium text-sm block">Date of Birth</label>
                        <input type="date" v-model="form.birth_date"
                            class="bg-white dark:bg-black dark:text-white border-gray-300 focus:ring-2 focus:ring-maurealty-blue w-full border rounded-lg p-2 outline-none">
                    </div>

                    <div class="col-span-full flex flex-col gap-1">
                        <label class="text-maurealty-blue dark:text-maurealty-light-blue font-bold text-xl block">Address</label>
                        <input type="text" v-model="form.home_address" class="w-full bg-white dark:bg-black dark:text-white border border-gray-300 rounded-lg p-3 py-1.75 focus:ring-2 focus:ring-maurealty-blue outline-none">
                    </div>

                    <div class="col-span-full">
                        <label class="text-maurealty-blue dark:text-maurealty-light-blue font-bold text-xl block">CONTACT DETAILS</label>
                        
                        <div class="grid grid-cols-1 sm:grid-cols-3 mt-2 gap-4">
                            <div class="flex flex-col gap-1">
                                <label class="text-maurealty-blue dark:text-maurealty-light-blue font-medium text-sm block">Contact No.</label>
                                <input type="text" v-model="form.contact_number" class="w-full bg-white dark:bg-black dark:text-white border border-gray-300 rounded-lg p-3 py-1.75 focus:ring-2 focus:ring-maurealty-blue outline-none">
                            </div>

                            <div class="flex flex-col sm:col-span-2 gap-1">
                                <label class="text-maurealty-blue dark:text-maurealty-light-blue font-medium text-sm block">Email Address</label>
                                <input type="email" v-model="form.email_address" class="w-full bg-white dark:bg-black dark:text-white border border-gray-300 rounded-lg p-3 py-1.75 focus:ring-2 focus:ring-maurealty-blue outline-none">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Buttons stack on phones, sit side by side on bigger screens -->
        <div class="w-full flex flex-col sm:flex-row gap-4 justify-end">
            <button type="button" @click="$emit('cancel')" class="flex flex-col items-center py-2 px-5 w-full sm:w-50 rounded-2xl border-2 border-maurealty-blue dark:border-maurealty-light-blue text-maurealty-blue dark:text-maurealty-light-blue font-bold hover:bg-maurealty-blue dark:hover:bg-maurealty-light-blue hover:text-white dark:hover:text-maurealty-blue hover:shadow-md hover:-translate-y-0.75 transition cursor-pointer">
                <span class="flex items-center-safe gap-2"> CANCEL</span>
            </button>

            <button type="submit" class="flex flex-col items-center py-2 px-5 w-full sm:w-50 rounded-2xl border-2 border-maurealty-blue dark:border-maurealty-light-blue text-maurealty-blue dark:text-maurealty-light-blue font-bold hover:bg-maurealty-blue dark:hover:bg-maurealty-light-blue hover:text-white dark:hover:text-maurealty-blue hover:shadow-md hover:-translate-y-0.75 transition cursor-pointer">
                <span class="flex items-center-safe gap-2"><span>★</span> SAVE ACCOUNT</span>
            </button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue';
import { agentService } from '@/services/agentService';
import { useRouter } from 'vue-router';
import placeholder from '@/assets/images/default_placeholder.png';
import { type AgentProfile, getAge } from '@/assets/classes/agent';
import { Trash2, Undo2, Upload } from 'lucide-vue-next';

const props = defineProps<{ agent: AgentProfile }>();
const emits = defineEmits(['cancel']);

const form = ref<AgentProfile>({
    agent_ID: props.agent.agent_ID,
    first_name: props.agent.first_name,
    middle_name: props.agent.middle_name,
    last_name: props.agent.last_name,
    age: props.agent.age,
    sex: props.agent.sex,
    birth_date: props.agent.birth_date,
    home_address: props.agent.home_address,
    contact_number: props.agent.contact_number,
    email_address: props.agent.email_address,
    hire_date: props.agent.hire_date,
    position_ID: props.agent.position_ID,
    admin_access: props.agent.admin_access,
    profile_url: props.agent.profile_url
});

const sexes: string[] = [ 'Male', 'Female', 'Non-Binary', 'Other' ];

const router = useRouter();

// Image handling
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

    const previewURL = URL.createObjectURL(file);

    currentImage.value = {
      file: file,
      preview: previewURL
    };

    // stores temporary previewURL
    form.value.profile_url = previewURL;
  }
  
  if (fileInput.value) fileInput.value.value = '';
};

const removeImage = () => {
  if (currentImage.value) {
    URL.revokeObjectURL(currentImage.value.preview); 
    currentImage.value = undefined;
  }

  form.value.profile_url = '';
};

const checkReversible = () => {
    return ((!form.value.profile_url && props.agent.profile_url) ? true : false);
}

// brings back original pfp
const revertImage = () => {
    form.value.profile_url = props.agent.profile_url;
}


const saveAgentDetails = async () => {
    console.log('Saving new account details...');

    const agentID = form.value.agent_ID
    const agentData: Partial<AgentProfile> = {
        first_name: form.value.first_name,
        middle_name: form.value.middle_name,
        last_name: form.value.last_name,
        sex: form.value.sex,
        birth_date: form.value.birth_date,
        age: getAge(form.value.birth_date),
        contact_number: form.value.contact_number,
        email_address: form.value.email_address,
    }

    try {
        // SCENARIO 1: A new image file was uploaded
        if (currentImage.value?.file) {
            console.log('Uploading new image...');
            const newUrl = await agentService.uploadProfileImage(agentID, currentImage.value.file);
            agentData.profile_url = newUrl;

            // Clean up the old image from the bucket if it existed
            if (props.agent.profile_url) {
                await agentService.deleteProfileImage(props.agent.profile_url);
            }
        } 
        // SCENARIO 2: The image was explicitly removed by the user (no new file, but URL is empty)
        else if (!form.value.profile_url && props.agent.profile_url) {
            console.log('Removing old image...');
            await agentService.deleteProfileImage(props.agent.profile_url);
            agentData.profile_url = '';
        } 
        // SCENARIO 3: No changes made to the image
        else {
            agentData.profile_url = props.agent.profile_url;
        }

        // Save the final data to the database
        const response = await agentService.updateProfile(agentID, agentData);
        
        if (response.success) {
            console.log('Profile updated successfully!');
            router.go(0); // refresh to see changes
        }
    } catch (error) {
        console.error('Failed to update account details:', error);
    }
}
</script>