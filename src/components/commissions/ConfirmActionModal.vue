<template>
  <Teleport to="body">
    <!-- Sits above the other commission popups (z-50), so it can open on top of one -->
    <div class="fixed inset-0 z-60 flex items-center justify-center bg-[rgba(10,61,98,0.7)] backdrop-blur-sm p-4" @click.self="cancel">
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="messageId"
        tabindex="-1"
        class="w-full max-w-md bg-white dark:bg-black rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-transparent dark:border-gray-800 focus:outline-none"
        @keydown="onKeydown"
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 :id="titleId" class="text-xl font-bold text-maurealty-blue dark:text-maurealty-light-blue">{{ title }}</h2>
          <button type="button" class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none cursor-pointer" aria-label="Close" @click="cancel">✕</button>
        </div>

        <div class="px-6 py-4 flex flex-col gap-3 text-sm">
          <p :id="messageId" class="text-base font-medium text-gray-700 dark:text-gray-200">{{ message }}</p>

          <!-- Optional summary of what is being confirmed -->
          <div v-if="$slots.default" class="rounded-lg bg-background-gray/60 dark:bg-background-dark-gray border border-sidebar-hover/20 dark:border-gray-800 p-3 text-gray-700 dark:text-gray-200">
            <slot />
          </div>

          <p v-if="error" class="text-red-600 text-xs">{{ error }}</p>
        </div>

        <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button type="button" :disabled="busy"
                  class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="cancel">
            {{ cancelLabel }}
          </button>
          <button type="button" :disabled="busy"
                  :class="['px-4 py-2 rounded-lg text-white hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                           tone === 'green' ? 'bg-maurealty-green' : 'bg-maurealty-blue']"
                  @click="confirm">
            {{ busy ? busyLabel : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, useId, onMounted, onBeforeUnmount, nextTick } from 'vue'

// Small "are you sure?" popup for commission actions that can't be undone (approve, ...).
// The parent runs the action on `confirm` and passes `busy` / `error` back while it does.
const props = withDefaults(defineProps<{
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  busyLabel?: string
  tone?: 'blue' | 'green'
  busy?: boolean
  error?: string
}>(), {
  confirmLabel: 'Yes',
  cancelLabel: 'No',
  busyLabel: 'Saving…',
  tone: 'blue',
  busy: false,
  error: '',
})
const emit = defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>()

const titleId = useId()
const messageId = useId()
const panel = ref<HTMLElement | null>(null)

// Keyboard focus moves into the popup (not onto a button, so Enter can't confirm by accident)
// and goes back to whatever had it, usually the button that opened the popup, on close.
let returnFocus: HTMLElement | null = null
onMounted(() => {
  returnFocus = document.activeElement as HTMLElement | null
  nextTick(() => panel.value?.focus())
})
onBeforeUnmount(() => returnFocus?.focus?.())

function cancel() {
  if (!props.busy) emit('cancel')
}
function confirm() {
  if (!props.busy) emit('confirm')
}

// Escape closes; Tab and Shift+Tab cycle through the popup's controls instead of the page behind.
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { e.stopPropagation(); cancel(); return }
  if (e.key !== 'Tab' || !panel.value) return
  const items = Array.from(panel.value.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])'))
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) { e.preventDefault(); return }
  const active = document.activeElement
  if (e.shiftKey && (active === first || active === panel.value)) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus() }
}
</script>
