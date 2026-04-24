<template>
<div class = "modal-overlay">
    <div class = "modal-content">
        <div>
            <label for="name">Name:</label>
            <input id="name" v-model="newDev.name" />
        </div>
        <div>
            <label for="contact_phone">Phone Number:</label>
            <input id="contact_phone" v-model="newDev.contact_number" />
        </div>
        <div>
            <label for="contact_email">Email:</label>
            <input id="contact_email" v-model="newDev.contact_email" />
        </div>
        <div>
            <label for="location">Location:</label>
            <input id="location" v-model="newDev.location" />
        </div>
        <button @click="emit('close')">Close</button>
        <button @click="emit('save', newDev); emit('close')">Save</button>
    </div>
</div>

</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import { type Developer } from "@/assets/classes/developers";
const emit = defineEmits<{
  (e: 'save', developer: Developer): void;
  (e: 'close'): void;
}>();
const props = defineProps<{
  developerData?: Developer;
}>();

const newDev = reactive<Developer>({ // Recieves data if edit mode, otherwise its set to default empty values
  dev_ID: null,
  profile_url: '',
  name: '',
  contact_number: '',
  contact_email: '',
  location: '',
  available_days: '',
  open_hours: '',
  close_hours: ''
});

watch( // watch for changes in developerdata prop
    () => props.developerData,
    (newData: Developer | undefined) => {
        if (newData) {
            Object.assign(newDev, newData);
        }
    },
    { immediate: true }
)
</script>