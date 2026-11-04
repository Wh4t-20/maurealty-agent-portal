<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,61,98,0.7)] backdrop-blur-sm p-4" @click.self="close">
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        class="w-full max-w-3xl bg-white dark:bg-black rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-transparent dark:border-gray-800 focus:outline-none"
        @keydown.esc.stop="close"
      >
        <!-- HEADER -->
        <div class="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm font-bold text-gray-500 dark:text-gray-400">{{ ticketNumber(ticket.id) }}</span>
              <TicketStatusBadge :status="ticket.status" />
              <span v-if="ticket.reopen_count" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Reopened{{ ticket.reopen_count > 1 ? ` ×${ticket.reopen_count}` : '' }}
              </span>
            </div>
            <h2 :id="titleId" class="mt-1 text-xl font-bold text-maurealty-blue dark:text-maurealty-light-blue break-words">{{ ticket.title }}</h2>
          </div>
          <button type="button" class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none cursor-pointer" aria-label="Close" @click="close">✕</button>
        </div>

        <div class="px-6 py-5 overflow-y-auto flex flex-col gap-5 text-sm text-gray-700 dark:text-gray-200">

          <!-- PROGRESS: Raised -> In Review -> Resolved, with who and when -->
          <ol class="grid grid-cols-3 gap-3" aria-label="Ticket progress">
            <li v-for="step in progress" :key="step.id" :aria-current="step.state === 'current' ? 'step' : undefined">
              <div class="h-1.5 rounded-full" :class="STEP_BAR[step.state]"></div>
              <p class="mt-2 text-xs font-bold" :class="STEP_TEXT[step.state]">{{ step.label }}</p>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 break-words">{{ step.detail }}</p>
            </li>
          </ol>
          <p v-if="ticket.reopen_count && ticket.reopened_at" class="-mt-2 text-xs text-amber-700 dark:text-amber-300">
            Reopened {{ ticket.reopen_count }} {{ ticket.reopen_count === 1 ? 'time' : 'times' }}, last on {{ formatDateTime(ticket.reopened_at) }}.
          </p>

          <!-- FACTS -->
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 rounded-xl bg-background-gray/60 dark:bg-background-dark-gray border border-sidebar-hover/10 dark:border-gray-800 p-4">
            <div>
              <dt :class="dtClass">Raised by</dt>
              <dd class="flex items-center gap-1.5 font-medium">
                {{ ticket.raised_by_name }}
                <span v-if="isOwn" class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-maurealty-blue text-white uppercase tracking-wider">You</span>
              </dd>
            </div>
            <div><dt :class="dtClass">Category</dt><dd class="font-medium">{{ categoryLabel(ticket.category) }}</dd></div>
            <div><dt :class="dtClass">Where</dt><dd class="font-medium">{{ ticket.area }}</dd></div>
            <div v-if="ticket.frequency"><dt :class="dtClass">How often</dt><dd class="font-medium">{{ frequencyLabel(ticket.frequency) }}</dd></div>
            <div v-if="ticket.occurred_at"><dt :class="dtClass">When it happened</dt><dd class="font-medium">{{ formatDateTime(ticket.occurred_at) }}</dd></div>
            <div v-if="ticket.device_info" class="sm:col-span-2"><dt :class="dtClass">Device</dt><dd class="font-medium break-words">{{ ticket.device_info }}</dd></div>
          </dl>

          <!-- WHAT THE USER WROTE: shown as plain text (never as HTML), line breaks kept -->
          <template v-if="issue">
            <section v-if="ticket.steps_to_reproduce">
              <h3 :class="h3Class">Steps to recreate it</h3>
              <p :class="textBox">{{ ticket.steps_to_reproduce }}</p>
            </section>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <section>
                <h3 :class="h3Class">Expected</h3>
                <p :class="textBox">{{ ticket.expected_result || '—' }}</p>
              </section>
              <section>
                <h3 :class="h3Class">What happened instead</h3>
                <p :class="textBox">{{ ticket.description }}</p>
              </section>
            </div>
          </template>
          <section v-else>
            <h3 :class="h3Class">Details</h3>
            <p :class="textBox">{{ ticket.description }}</p>
          </section>

          <!-- SCREENSHOTS: private files, opened through signed links that expire -->
          <section v-if="ticket.attachment_paths.length">
            <h3 :class="h3Class">Screenshots ({{ ticket.attachment_paths.length }})</h3>
            <p v-if="shotsLoading" class="mt-1 text-xs text-gray-500 dark:text-gray-400">Loading screenshots…</p>
            <p v-else-if="shotsError" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ shotsError }}</p>
            <template v-else>
              <div class="mt-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <template v-for="(url, i) in shots" :key="i">
                  <a v-if="url" :href="url" target="_blank" rel="noopener noreferrer"
                     class="block border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-background-dark-gray hover:shadow-md transition">
                    <img :src="url" :alt="`Screenshot ${i + 1} of ${ticketNumber(ticket.id)}`" class="w-full h-40 object-contain" />
                  </a>
                  <div v-else class="flex items-center justify-center h-40 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-xs text-gray-500 dark:text-gray-400">
                    Screenshot {{ i + 1 }} can't be shown
                  </div>
                </template>
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Click a screenshot to open it full size. The links stop working after an hour; open the ticket again for new ones.</p>
            </template>
          </section>

          <!-- RESOLUTION NOTE from IT support (kept, greyed, while a reopened ticket is back in review) -->
          <section v-if="ticket.resolution_note" class="rounded-xl border p-4"
                   :class="ticket.status === 'resolved'
                     ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100'
                     : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-background-dark-gray text-gray-600 dark:text-gray-300'">
            <h3 class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <CircleCheck class="w-4 h-4" aria-hidden="true" />
              {{ ticket.status === 'resolved' ? 'Resolution from IT support' : 'Last resolution (before it was reopened)' }}
            </h3>
            <p class="mt-2 whitespace-pre-line break-words leading-relaxed">{{ ticket.resolution_note }}</p>
            <p v-if="ticket.status === 'resolved' && ticket.resolved_at" class="mt-2 text-xs opacity-80">
              {{ ticket.resolved_by_name ?? 'IT support' }} · {{ formatDateTime(ticket.resolved_at) }}
            </p>
          </section>

          <!-- ADMIN: the note the user will read, required to resolve -->
          <section v-if="isAdmin && ticket.status === 'in_review'" class="flex flex-col gap-1.5">
            <label :for="noteId" class="flex items-baseline justify-between gap-2">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Resolution note for {{ ticket.raised_by_name }} <span class="text-red-500">*</span></span>
              <span class="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">{{ charCount(cleanedNote) }}/{{ L.resolutionNote.max }}</span>
            </label>
            <textarea :id="noteId" ref="noteInput" v-model="note" rows="4" :maxlength="L.resolutionNote.max" :readonly="busy"
                      placeholder="What was wrong and what was done, or what they should do now. Example: Fixed the SOLD button for bulk listings. Refresh the page and try again."
                      :class="inputClass"></textarea>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              Required to resolve the ticket (at least {{ L.resolutionNote.min }} characters). The person who raised it will see this note.
            </span>
          </section>

          <!-- NON-ADMIN: what happens next -->
          <p v-if="!isAdmin" class="flex items-start gap-2 rounded-lg bg-maurealty-light-blue/70 dark:bg-[#041d30] p-3 text-xs text-maurealty-blue dark:text-maurealty-light-blue">
            <Info class="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{{ statusMessage }}</span>
          </p>

          <p v-if="error && !confirming" class="text-xs text-red-600 dark:text-red-400" role="alert">{{ error }}</p>
        </div>

        <!-- ACTIONS: the status is changed by admins (IT support) only -->
        <div class="flex flex-wrap justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button type="button" :disabled="busy"
                  class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="close">
            Close
          </button>
          <template v-if="isAdmin">
            <button v-if="ticket.status === 'raised'" type="button" :disabled="busy"
                    class="px-4 py-2 rounded-lg bg-maurealty-blue text-white hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="startReview">
              {{ busy ? 'Starting…' : 'Start review' }}
            </button>
            <button v-else-if="ticket.status === 'in_review'" type="button" :disabled="busy || !noteOk"
                    :title="noteOk ? '' : 'Write the resolution note first'"
                    class="px-4 py-2 rounded-lg bg-maurealty-green text-white hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="askConfirm('resolve')">
              Resolve ticket
            </button>
            <button v-else type="button" :disabled="busy"
                    class="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-maurealty-blue dark:border-maurealty-light-blue text-maurealty-blue dark:text-maurealty-light-blue hover:bg-maurealty-blue hover:text-white dark:hover:bg-maurealty-light-blue dark:hover:text-maurealty-blue transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="askConfirm('reopen')">
              <RotateCcw class="w-4 h-4" aria-hidden="true" /> Reopen
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Resolve and Reopen can't be taken back, so each asks first -->
    <ConfirmActionModal
      v-if="confirming === 'resolve'"
      title="Resolve Ticket"
      message="Mark this ticket as resolved? The person who raised it will see your note."
      confirm-label="Resolve"
      cancel-label="Cancel"
      busy-label="Resolving…"
      tone="green"
      :busy="busy"
      :error="error"
      @cancel="cancelConfirm"
      @confirm="resolve"
    >
      <p class="text-xs font-semibold">{{ ticketNumber(ticket.id) }} · {{ ticket.title }}</p>
      <p class="mt-1 text-xs whitespace-pre-line break-words">{{ cleanedNote }}</p>
    </ConfirmActionModal>
    <ConfirmActionModal
      v-if="confirming === 'reopen'"
      title="Reopen Ticket"
      message="Reopen this ticket? It goes back to In Review with you as the reviewer, and counts as open again for the person who raised it."
      confirm-label="Reopen"
      cancel-label="Cancel"
      busy-label="Reopening…"
      :busy="busy"
      :error="error"
      @cancel="cancelConfirm"
      @confirm="reopen"
    >
      <p class="text-xs font-semibold">{{ ticketNumber(ticket.id) }} · {{ ticket.title }}</p>
    </ConfirmActionModal>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, useId } from 'vue'
import { CircleCheck, Info, RotateCcw } from 'lucide-vue-next'
import ConfirmActionModal from '@/components/commissions/ConfirmActionModal.vue'
import TicketStatusBadge from '@/components/support/TicketStatusBadge.vue'
import { ticketService } from '@/services/ticketService'
import { cleanMultilineText } from '@/utils/sanitize'
import {
  TICKET_TEXT_LIMITS as L, ticketNumber, categoryLabel, frequencyLabel, isIssueCategory, charCount,
  type SupportTicket,
} from '@/assets/classes/ticket'

// intent: what the table button asked for. 'resolve' puts the cursor in the note,
// 'reopen' opens the reopen confirmation straight away.
const props = defineProps<{
  ticket: SupportTicket
  isAdmin: boolean
  currentAgentId: number | null
  intent?: 'resolve' | 'reopen' | null
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'changed', ticket: SupportTicket, message: string): void
}>()

const titleId = useId()
const noteId = useId()
const panel = ref<HTMLElement | null>(null)
const noteInput = ref<HTMLTextAreaElement | null>(null)

const issue = computed(() => isIssueCategory(props.ticket.category))
const isOwn = computed(() => props.ticket.agent_ID != null && props.ticket.agent_ID === props.currentAgentId)

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

// --- Progress strip ---
type StepState = 'done' | 'current' | 'todo'
const STEP_BAR: Record<StepState, string> = {
  done: 'bg-maurealty-green',
  current: 'bg-maurealty-blue dark:bg-maurealty-light-blue',
  todo: 'bg-gray-200 dark:bg-gray-800',
}
const STEP_TEXT: Record<StepState, string> = {
  done: 'text-maurealty-green',
  current: 'text-maurealty-blue dark:text-maurealty-light-blue',
  todo: 'text-gray-400 dark:text-gray-500',
}
const progress = computed<{ id: string; label: string; state: StepState; detail: string }[]>(() => {
  const t = props.ticket
  return [
    { id: 'raised', label: 'Raised', state: 'done',
      detail: `${t.raised_by_name} · ${formatDateTime(t.created_at)}` },
    { id: 'in_review', label: 'In Review',
      state: t.status === 'in_review' ? 'current' : t.status === 'resolved' ? 'done' : 'todo',
      detail: t.reviewed_at ? `${t.reviewed_by_name ?? 'IT support'} · ${formatDateTime(t.reviewed_at)}` : 'Waiting for IT support' },
    { id: 'resolved', label: 'Resolved', state: t.status === 'resolved' ? 'done' : 'todo',
      detail: t.resolved_at ? `${t.resolved_by_name ?? 'IT support'} · ${formatDateTime(t.resolved_at)}` : 'Not yet' },
  ]
})

const statusMessage = computed(() => {
  const t = props.ticket
  if (t.status === 'raised') return 'IT support has your ticket and will start reviewing it soon. The status changes here as they work on it.'
  if (t.status === 'in_review') return `IT support is working on this ticket${t.reviewed_by_name ? ` (${t.reviewed_by_name})` : ''}.`
  return `IT support resolved this ticket. If the problem comes back, raise a new ticket and mention ${ticketNumber(t.id)}, or ask IT support to reopen this one.`
})

// --- Screenshots (signed links, loaded when the ticket opens) ---
const shots = ref<(string | null)[]>([])
const shotsLoading = ref(false)
const shotsError = ref('')
async function loadShots() {
  const paths = props.ticket.attachment_paths
  shots.value = []
  shotsError.value = ''
  if (paths.length === 0) return
  shotsLoading.value = true
  try {
    shots.value = await ticketService.getAttachmentUrls(paths)
  } catch (e: any) {
    shotsError.value = e?.message || 'The screenshots could not be loaded.'
  } finally {
    shotsLoading.value = false
  }
}
// Only reload when the files change, not on every live refresh of the same ticket.
watch(() => `${props.ticket.id}|${props.ticket.attachment_paths.join('|')}`, loadShots, { immediate: true })

// --- Admin actions ---
const note = ref('')
const cleanedNote = computed(() => cleanMultilineText(note.value, L.resolutionNote.max))
const noteOk = computed(() => charCount(cleanedNote.value) >= L.resolutionNote.min)

const busy = ref(false)
const error = ref('')
const confirming = ref<'resolve' | 'reopen' | null>(null)

function askConfirm(action: 'resolve' | 'reopen') {
  error.value = ''
  confirming.value = action
}
function cancelConfirm() {
  confirming.value = null
  error.value = ''
}

// Runs one status change. A null result means no row changed: someone else moved the ticket
// first, or the database refused (not an admin).
async function run(action: () => Promise<SupportTicket | null>, message: string): Promise<boolean> {
  busy.value = true
  error.value = ''
  try {
    const updated = await action()
    if (!updated) {
      error.value = 'The ticket was not changed. Someone else may have updated it, or you may not have permission. Close it and try again.'
      return false
    }
    confirming.value = null
    emit('changed', updated, message)
    return true
  } catch (e: any) {
    error.value = e?.message || 'Something went wrong. Please try again.'
    return false
  } finally {
    busy.value = false
  }
}

function startReview() {
  void run(() => ticketService.startReview(props.ticket.id), `${ticketNumber(props.ticket.id)} is now In Review.`)
}
async function resolve() {
  if (!noteOk.value) return
  const ok = await run(() => ticketService.resolveTicket(props.ticket.id, note.value), `${ticketNumber(props.ticket.id)} resolved.`)
  if (ok) note.value = ''
}
function reopen() {
  void run(() => ticketService.reopenTicket(props.ticket.id), `${ticketNumber(props.ticket.id)} reopened and back in review.`)
}

function close() {
  if (!busy.value) emit('close')
}

// Focus moves into the popup (or the note, for "Resolve") and back to the opening button on close.
let returnFocus: HTMLElement | null = null
onMounted(() => {
  returnFocus = document.activeElement as HTMLElement | null
  nextTick(() => {
    if (props.intent === 'resolve' && props.isAdmin && props.ticket.status === 'in_review') noteInput.value?.focus()
    else panel.value?.focus()
    if (props.intent === 'reopen' && props.isAdmin && props.ticket.status === 'resolved') askConfirm('reopen')
  })
})
onBeforeUnmount(() => returnFocus?.focus?.())

// Shared Tailwind classes (light and dark mode).
const dtClass = 'text-xs text-gray-500 dark:text-gray-400'
const h3Class = 'text-xs font-bold uppercase tracking-wider text-maurealty-blue dark:text-maurealty-light-blue'
const textBox = 'mt-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark-gray p-3 whitespace-pre-line break-words leading-relaxed'
const inputClass =
  'w-full py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark-gray ' +
  'text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none resize-y ' +
  'transition-[border-color,box-shadow] duration-200 focus:border-maurealty-green focus:shadow-[0_0_0_3px_rgba(51,176,88,0.15)] ' +
  'dark:[color-scheme:dark]'
</script>
