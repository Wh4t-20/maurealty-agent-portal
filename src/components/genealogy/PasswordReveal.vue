<template>
  <div class="flex items-stretch gap-2">
    <!-- Hidden as dots until the eye is pressed -->
    <div
      class="flex-1 min-w-0 flex items-center px-3 py-2 rounded-lg border-2 border-amber-400 dark:border-amber-600
             bg-white dark:bg-background-dark-gray font-mono text-[0.95rem] tracking-wider
             text-gray-800 dark:text-gray-100 overflow-x-auto whitespace-nowrap"
      aria-live="polite"
      :aria-label="shown && value ? 'Password' : 'Password (hidden)'"
    >{{ display }}</div>

    <button type="button" :class="iconButton" :aria-pressed="shown"
            :title="shown ? 'Hide password' : 'Show password'" :aria-label="shown ? 'Hide password' : 'Show password'"
            @click="toggle">
      <EyeOff v-if="shown" class="w-4 h-4" />
      <Eye v-else class="w-4 h-4" />
    </button>
    <button type="button" :class="iconButton" :disabled="!value" title="Copy password" aria-label="Copy password" @click="copy">
      <Check v-if="copied" class="w-4 h-4 text-maurealty-green" />
      <Copy v-else class="w-4 h-4" />
    </button>
    <button v-if="regenerable" type="button" :class="iconButton"
            title="Generate a new password" aria-label="Generate a new password" @click="emit('regenerate')">
      <RefreshCw class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { Eye, EyeOff, Copy, Check, RefreshCw } from 'lucide-vue-next'
import { INITIAL_PASSWORD_LENGTH } from '@/utils/password'

// Password box for the Add / Edit Agent modal: dots until the eye is pressed, plus copy and
// (for a new password) regenerate. `value` = null means the password hasn't been loaded yet:
// pressing the eye emits `reveal` so the parent can fetch it (admins only, through
// accountService.getAgentLogin), and the box shows it once it arrives.
const props = withDefaults(defineProps<{
  value: string | null
  loading?: boolean
  regenerable?: boolean
}>(), {
  loading: false,
  regenerable: false,
})
const emit = defineEmits<{ (e: 'reveal'): void; (e: 'regenerate'): void }>()

const iconButton =
  'px-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 ' +
  'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed'

const shown = ref(false)
const copied = ref(false)
const dots = '•'.repeat(INITIAL_PASSWORD_LENGTH)

const display = computed(() => {
  if (!shown.value) return dots
  if (props.value != null) return props.value
  return props.loading ? 'Loading…' : dots
})

function toggle() {
  if (!shown.value && props.value == null) emit('reveal')
  shown.value = !shown.value
}

let copiedTimer: ReturnType<typeof setTimeout> | undefined
async function copy() {
  if (!props.value) return
  try {
    await navigator.clipboard.writeText(props.value)
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => (copied.value = false), 1500)
  } catch {
    // Clipboard blocked by the browser: the password can still be revealed and selected.
  }
}
onBeforeUnmount(() => clearTimeout(copiedTimer))
</script>
