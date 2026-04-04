<template>
    <div>
        <button @click="isOpen = !isOpen" class="block size-8 text-sm  pr-1 rounded-xl bg-[#ECF1F5] shadow-md/30 focus:outline-2 focus:outline-maurealty-blue">
            <h1>{{ currentChoice }}</h1>
        </button>
        <div>
            <a v-for="i in choices" @click="newChoice(i)">{{ i }}</a>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{ choices: string[] }>()
let currentChoice = ref(props.choices[0] || '')

let isOpen: boolean

function newChoice(chosen: string) {
    currentChoice.value = chosen
}
</script>