<template>
    <div>
    <Listbox v-model="currentChoice">
      <div class="relative w-fit">
        <ListboxButton
          class="text-sm w-fit flex items-center-safe gap-4 min-w-25 py-0.5 pl-5 rounded-md bg-background-gray shadow-md/30 focus:outline-2 focus:outline-maurealty-blue"
        >
          <span class="block truncate">{{ currentChoice }}</span>
          <ChevronDown class="size-4" />
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
            class="absolute z-50 mt-1 max-h-80 w-fit min-w-full overflow-auto rounded-xl bg-background-gray py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none"
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
                  active ? 'bg-[#3b6c96] text-white' : 'text-maurealty-blue',
                  'relative cursor-default select-none py-2 pl-5 pr-4 transition-colors duration-175 whitespace-nowrap',
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
import { ChevronDown } from 'lucide-vue-next';
import { computed } from 'vue'

const props = defineProps<{ choices: string[], modelValue: string }>()

const emit = defineEmits(['update:modelValue'])

const currentChoice = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>