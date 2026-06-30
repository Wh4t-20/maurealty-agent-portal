<template>
    <label class="relative inline-flex items-center cursor-pointer select-none">
        <!-- Hidden Checkbox Input -->
        <input type="checkbox" class="peer sr-only" v-model="currentChoice" />
        
        <!-- Toggle Background Track -->
        <div class="w-11 h-6 bg-gray-200 dark:bg-gray-800 rounded-full transition-colors duration-300 ease-in-out peer-checked:bg-maurealty-blue peer-focus:ring-2 peer-focus:ring-blue-200"></div>
        
        <!-- Sliding Handle Knob -->
        <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out peer-checked:translate-x-5"></div>
    </label>
</template>

<script setup lang="ts">
// https://headlessui.com/v1/vue/listbox
import { computed } from 'vue'

const props = defineProps<{ modelValue: boolean }>()

const emit = defineEmits(['update:modelValue'])

const currentChoice = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>