<template>
    <form @submit.prevent="" class="bg-gray-100 w-full max-w-7xl rounded-2xl shadow-md p-10 flex flex-col gap-5">
        <div class="flex justify-items-center gap-10">
            <div class="relative flex flex-col items-center justify-center">
                <img
                :src=" form.profile_url || placeholder"
                alt="Profile"
                class="w-80 h-80 object-cover rounded-full border-4 border-white shadow"
                />

                <div v-if="!form.profile_url" class="w-full mt-5">
                    <button class="w-full flex flex-col items-center py-2 px-5 rounded-xl border-2 border-maurealty-blue text-maurealty-blue font-bold hover:bg-maurealty-blue hover:text-white transition-colors cursor-pointer">
                        <span class="flex items-center-safe gap-1.5"><Upload class="size-4" /> UPLOAD</span>
                    </button>
                </div>

                <div v-else class="w-full grid grid-cols-1 md:grid-cols-2 gap-2 mt-5">
                    <button @click="form.profile_url=''" class="flex flex-col items-center py-2 px-5 rounded-xl border-2 border-red-600 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-colors cursor-pointer">
                        <span class="flex items-center-safe gap-1.5"><Trash2 class="size-4" /> DELETE</span>
                    </button>

                    <button class="flex flex-col items-center py-2 px-5 rounded-xl border-2 border-maurealty-blue text-maurealty-blue font-bold hover:bg-maurealty-blue hover:text-white transition-colors cursor-pointer">
                        <span class="flex items-center-safe gap-1.5"><Upload class="size-4" /> CHANGE</span>
                    </button>
                </div>
            </div>

            <div class="flex-1 space-y-3">
                <div class="mt-5 grid grid-cols-3 gap-5">
                    <div class="col-span-full">
                        <label class="text-maurealty-blue font-bold text-xl block">FULL NAME</label>
                        
                        <div class="grid grid-cols-3 mt-2 gap-4">
                            <div class="flex flex-col gap-1">
                                <label class="text-maurealty-blue font-medium text-sm block">First Name</label>
                                <input type="text" v-model="form.first_name" class="w-full bg-white border border-gray-300 rounded-lg p-3 py-1.75 focus:ring-2 focus:ring-maurealty-blue outline-none">
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-maurealty-blue font-medium text-sm block">Middle Name (if applicable)</label>
                                <input type="text" v-model="form.middle_name" class="w-full bg-white border border-gray-300 rounded-lg p-3 py-1.75 focus:ring-2 focus:ring-maurealty-blue outline-none">
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-maurealty-blue font-medium text-sm block">Last Name</label>
                                <input type="text" v-model="form.last_name" class="w-full bg-white border border-gray-300 rounded-lg p-3 py-1.75 focus:ring-2 focus:ring-maurealty-blue outline-none">
                            </div>
                        </div>
                    </div>          

                    <div class="flex flex-col gap-1">
                        <label class="text-maurealty-blue font-medium text-sm block">Sex</label>
                        <Listbox v-model="form.sex">
                            <div class="relative">
                                <ListboxButton class="relative w-full cursor-default rounded-lg border border-gray-300 bg-white p-3 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-maurealty-blue sm:text-sm transition-all">
                                    <span class="block truncate text-gray-700">
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
                                    <ListboxOptions class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                    <ListboxOption
                                        v-slot="{ active, selected }"
                                        v-for="s in sexes"
                                        :key="s"
                                        :value="s"
                                        as="template"
                                    >
                                        <li
                                        :class="[
                                            active ? 'bg-maurealty-blue/10 text-maurealty-blue' : 'text-gray-900',
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
                        <label class="text-maurealty-blue font-medium text-sm block">Date of Birth</label>
                        <input type="date" :value="form.birth_date"
                            class="bg-white border-gray-300 focus:ring-2 focus:ring-maurealty-blue w-full border rounded-lg p-2 outline-none">
                    </div>

                    <div class="col-span-full flex flex-col gap-1">
                        <label class="text-maurealty-blue font-bold text-xl block">Address</label>
                        <input type="text" v-model="form.home_address" class="w-full bg-white border border-gray-300 rounded-lg p-3 py-1.75 focus:ring-2 focus:ring-maurealty-blue outline-none">
                    </div>

                    <div class="col-span-full">
                        <label class="text-maurealty-blue font-bold text-xl block">CONTACT DETAILS</label>
                        
                        <div class="grid grid-cols-3 mt-2 gap-4">
                            <div class="flex flex-col gap-1">
                                <label class="text-maurealty-blue font-medium text-sm block">Contact No.</label>
                                <input type="text" v-model="form.contact_number" class="w-full bg-white border border-gray-300 rounded-lg p-3 py-1.75 focus:ring-2 focus:ring-maurealty-blue outline-none">
                            </div>

                            <div class="flex flex-col col-span-2 gap-1">
                                <label class="text-maurealty-blue font-medium text-sm block">Email Address</label>
                                <input type="email" v-model="form.email_address" class="w-full bg-white border border-gray-300 rounded-lg p-3 py-1.75 focus:ring-2 focus:ring-maurealty-blue outline-none">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="w-full flex gap-4 justify-end">
            <button type="button" @click="$emit('cancel')" class="flex flex-col items-center py-2 px-5 w-50 rounded-2xl border-2 border-maurealty-blue text-maurealty-blue font-bold hover:bg-maurealty-blue hover:text-white hover:shadow-md hover:-translate-y-0.75 transition cursor-pointer">
                <span class="flex items-center-safe gap-2"> CANCEL</span>
            </button>

            <button type="submit" class="flex flex-col items-center py-2 px-5 w-50 rounded-2xl border-2 border-maurealty-blue text-maurealty-blue font-bold hover:bg-maurealty-blue hover:text-white hover:shadow-md hover:-translate-y-0.75 transition cursor-pointer">
                <span class="flex items-center-safe gap-2"><span>★</span> SAVE ACCOUNT</span>
            </button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'
import placeholder from '@/assets/images/default_placeholder.png'
import { type AgentProfile } from '@/assets/classes/agent'
import { Trash2, Upload } from 'lucide-vue-next';

const props = defineProps<{ agent: AgentProfile }>()
const emits = defineEmits(['cancel'])

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
})

const sexes: string[] = [ 'Male', 'Female', 'Non-Binary', 'Other' ]
</script>