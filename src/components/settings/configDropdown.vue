<template>
    <div class="w-full">
    <Listbox v-model="currentChoice">
      <div class="relative w-fit">
        <ListboxButton
            class="relative w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black py-2 pl-3 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-maurealty-blue sm:text-sm transition-all"
        >
            <span class="block truncate text-gray-700 dark:text-gray-300">{{ currentChoice }}</span>
            <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </span>
        </ListboxButton>

        <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-out"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
        >
          <ListboxOptions
            class="absolute z-50 mt-1 max-h-80 w-fit min-w-full overflow-auto rounded-xl bg-background-gray dark:bg-background-dark-gray py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none"
          >
            <ListboxOption
              v-slot="{ active, selected }"
              v-for="choice in props.choices"
              :key="choice"
              :value="choice"
              as="template"
            >
              <li
                :class="[
                  active ? 'bg-[#3b6c96] dark:bg-[#0a4273] text-white' : 'text-maurealty-blue dark:text-maurealty-light-blue',
                  'relative cursor-pointer select-none py-2 pl-5 pr-4 transition-colors duration-175 whitespace-nowrap',
                ]"
              >
                <span
                  :class="[
                    selected ? 'font-medium' : 'font-normal',
                    'block truncate',
                  ]"
                  >{{ choice }}</span
                >
              </li>
            </ListboxOption>
          </ListboxOptions>
        </transition>
      </div>
    </Listbox>
  </div>
</template>

<script setup lang="ts">
// https://headlessui.com/v1/vue/listbox
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'
import { computed } from 'vue'

const props = defineProps<{ choices: string[], modelValue: string }>()

const emit = defineEmits(['update:modelValue'])

const currentChoice = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>