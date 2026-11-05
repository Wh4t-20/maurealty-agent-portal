<template>
  <Teleport to="body">
    <!-- dragover/drop are stopped on the whole overlay so an image dropped outside the drop zone
         doesn't make the browser leave the page (and lose what was typed) -->
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,61,98,0.7)] backdrop-blur-sm p-4"
         @click.self="requestClose" @dragover.prevent @drop.prevent>
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        class="w-full max-w-4xl bg-white dark:bg-black rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-transparent dark:border-gray-800 focus:outline-none"
        @keydown.esc.stop="requestClose"
      >
        <!-- HEADER -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 :id="titleId" class="flex items-center gap-2 text-xl font-bold text-maurealty-blue dark:text-maurealty-light-blue">
            <LifeBuoy class="w-5 h-5" aria-hidden="true" /> Raise a Ticket
          </h2>
          <button type="button" class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none cursor-pointer" aria-label="Close" @click="requestClose">✕</button>
        </div>

        <!-- BODY: the form, and beside it (below it on phones) the live checklist -->
        <div class="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_17rem]">
          <form class="px-6 py-5 flex flex-col gap-6 text-sm lg:overflow-y-auto lg:min-h-0" novalidate @submit.prevent="submit">

            <!-- Open-ticket limit reached (the database refuses a 4th open ticket too) -->
            <div v-if="atLimit" role="alert" class="flex items-start gap-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 text-amber-900 dark:text-amber-100">
              <TriangleAlert class="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              <p class="text-xs">
                You already have {{ openCount }} open tickets (the limit is {{ MAX_OPEN_TICKETS }}).
                Wait for IT support to resolve one before raising another.
              </p>
            </div>

            <!-- Why the questions are so specific -->
            <div class="flex items-start gap-3 rounded-xl border border-[#A9D6FF] dark:border-[#1d4f7a] bg-maurealty-light-blue/70 dark:bg-[#041d30] p-4 text-maurealty-blue dark:text-maurealty-light-blue">
              <Lightbulb class="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              <p class="text-xs leading-relaxed">
                IT support fixes a problem faster when they can <b>recreate it</b>. Write it so someone who wasn't there
                can follow along: where you were, what you did step by step, what you expected, and what happened instead.
              </p>
            </div>

            <!-- 1) WHAT IS IT ABOUT -->
            <section class="flex flex-col gap-4">
              <h3 :class="sectionTitle"><span :class="sectionNumber">1</span> What is it about?</h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label class="flex flex-col gap-1">
                  <span :class="labelClass">Category <span class="text-red-500">*</span></span>
                  <select ref="firstField" v-model="form.category" :class="inputClass" :disabled="saving">
                    <option value="" disabled>Choose a category</option>
                    <optgroup label="Problems">
                      <option v-for="c in issueCategories" :key="c.id" :value="c.id">{{ c.label }}</option>
                    </optgroup>
                    <optgroup label="Requests and feedback">
                      <option v-for="c in requestCategories" :key="c.id" :value="c.id">{{ c.label }}</option>
                    </optgroup>
                  </select>
                  <span v-if="category" :class="hintClass">{{ category.hint }}</span>
                </label>

                <label class="flex flex-col gap-1">
                  <span :class="labelClass">
                    {{ category && !isIssue ? 'Which part of the portal is it about?' : 'Where did it happen?' }} <span class="text-red-500">*</span>
                  </span>
                  <select v-model="form.area" :class="inputClass" :disabled="saving">
                    <option value="" disabled>Choose a page</option>
                    <option v-for="a in TICKET_AREAS" :key="a" :value="a">{{ a }}</option>
                  </select>
                </label>
              </div>

              <label class="flex flex-col gap-1">
                <span class="flex items-baseline justify-between gap-2">
                  <span :class="labelClass">Title: the problem in one line <span class="text-red-500">*</span></span>
                  <span :class="counterClass">{{ charCount(form.title) }}/{{ L.title.max }}</span>
                </span>
                <input v-model="form.title" type="text" autocomplete="off" :maxlength="L.title.max" :readonly="saving"
                       :placeholder="`e.g. ${category?.titleExample ?? DEFAULT_TITLE_EXAMPLE}`" :class="inputClass" />
                <span :class="hintClass">Name the page and the problem. "It's broken" or "Help" is hard for IT to act on.</span>
              </label>
            </section>

            <!-- 2a) ISSUES: the details IT needs to recreate the problem -->
            <section v-if="isIssue" class="flex flex-col gap-4">
              <h3 :class="sectionTitle"><span :class="sectionNumber">2</span> Help IT support recreate it</h3>

              <label class="flex flex-col gap-1">
                <span class="flex items-baseline justify-between gap-2">
                  <span :class="labelClass">Steps to recreate it <span class="text-red-500">*</span></span>
                  <span :class="counterClass">{{ stepCount }} {{ stepCount === 1 ? 'step' : 'steps' }}</span>
                </span>
                <textarea v-model="form.steps_to_reproduce" rows="5" :maxlength="L.steps.max" :readonly="saving"
                          :placeholder="STEPS_PLACEHOLDER" :class="[inputClass, 'resize-y leading-relaxed']"
                          @focus="startSteps" @blur="tidySteps" @keydown="onStepsKeydown"></textarea>
                <span :class="hintClass">One step per line, starting from a page anyone can open. Press Enter and the next number is added for you.</span>
              </label>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label class="flex flex-col gap-1">
                  <span :class="labelClass">What did you expect to happen? <span class="text-red-500">*</span></span>
                  <textarea v-model="form.expected_result" rows="3" :maxlength="L.expected.max" :readonly="saving"
                            placeholder="The Confirm Sale form opens." :class="[inputClass, 'resize-y']"></textarea>
                </label>
                <label class="flex flex-col gap-1">
                  <span class="flex items-baseline justify-between gap-2">
                    <span :class="labelClass">What happened instead? <span class="text-red-500">*</span></span>
                    <span :class="counterClass">{{ charCount(form.description) }}/{{ L.description.max }}</span>
                  </span>
                  <textarea v-model="form.description" rows="3" :maxlength="L.description.max" :readonly="saving"
                            placeholder="Nothing happens. No error appears and the page stays the same."
                            :class="[inputClass, 'resize-y']"></textarea>
                </label>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <fieldset class="flex flex-col gap-1.5">
                  <legend :class="[labelClass, 'mb-1.5']">How often does it happen? <span class="text-red-500">*</span></legend>
                  <div class="flex flex-wrap gap-2">
                    <label v-for="f in TICKET_FREQUENCIES" :key="f.id" class="cursor-pointer">
                      <input v-model="form.frequency" type="radio" name="ticket-frequency" :value="f.id" class="sr-only peer" :disabled="saving" />
                      <span class="inline-block px-3.5 py-1.5 rounded-full border text-xs font-semibold transition
                                   border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300
                                   hover:border-maurealty-blue dark:hover:border-maurealty-light-blue
                                   peer-checked:bg-maurealty-blue peer-checked:border-maurealty-blue peer-checked:text-white
                                   dark:peer-checked:bg-maurealty-light-blue dark:peer-checked:border-maurealty-light-blue dark:peer-checked:text-maurealty-blue
                                   peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-maurealty-blue">
                        {{ f.label }}
                      </span>
                    </label>
                  </div>
                </fieldset>

                <label class="flex flex-col gap-1">
                  <span :class="labelClass">When did it happen? <span class="font-normal text-gray-400">(optional)</span></span>
                  <input v-model="form.occurred_at" type="datetime-local" :max="nowLocal" :readonly="saving" :class="inputClass" />
                  <span v-if="occurredInFuture" class="text-xs text-red-600 dark:text-red-400">That time is in the future.</span>
                  <span v-else :class="hintClass">Helps IT find it in the logs.</span>
                </label>
              </div>
            </section>

            <!-- 2b) REQUESTS AND FEEDBACK: one detailed answer -->
            <section v-else-if="category" class="flex flex-col gap-4">
              <h3 :class="sectionTitle"><span :class="sectionNumber">2</span> Tell IT support more</h3>
              <label class="flex flex-col gap-1">
                <span class="flex items-baseline justify-between gap-2">
                  <span :class="labelClass">
                    {{ category.id === 'feature_request' ? 'What would you like, and how would it help?' : 'Details' }} <span class="text-red-500">*</span>
                  </span>
                  <span :class="counterClass">{{ charCount(form.description) }}/{{ L.description.max }}</span>
                </span>
                <textarea v-model="form.description" rows="6" :maxlength="L.description.max" :readonly="saving"
                          :placeholder="REQUEST_PLACEHOLDER[category.id] ?? ''" :class="[inputClass, 'resize-y leading-relaxed']"></textarea>
              </label>
            </section>

            <!-- 2) No category yet -->
            <section v-else class="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-xs text-gray-500 dark:text-gray-400">
              Choose a category above to see the questions for it.
            </section>

            <!-- 3) SCREENSHOTS (optional): private, only the user and admins can open them -->
            <section class="flex flex-col gap-3">
              <h3 :class="sectionTitle">
                <span :class="sectionNumber">3</span> Screenshots
                <span class="text-xs font-normal text-gray-500 dark:text-gray-400">(optional, up to {{ MAX_TICKET_IMAGES }})</span>
              </h3>

              <label v-if="files.length < MAX_TICKET_IMAGES"
                     class="flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-lg p-5 text-center text-gray-500 dark:text-gray-400 cursor-pointer transition"
                     :class="dragging ? 'border-maurealty-blue bg-maurealty-light-blue/60 dark:border-maurealty-light-blue dark:bg-[#041d30]'
                                      : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900'"
                     @dragover.prevent="dragging = true" @dragleave="dragging = false" @drop.prevent="onDrop">
                <ImagePlus class="w-6 h-6 text-maurealty-blue dark:text-maurealty-light-blue" aria-hidden="true" />
                <span class="font-semibold text-maurealty-blue dark:text-maurealty-light-blue">Click to attach, drag images here, or paste (Ctrl+V)</span>
                <span class="text-xs">PNG, JPG, WEBP or GIF · up to {{ MAX_TICKET_IMAGE_MB }} MB each</span>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple class="sr-only" :disabled="saving" @change="onPick" />
              </label>

              <div v-if="files.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div v-for="(f, i) in files" :key="f.key" class="relative border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-background-dark-gray">
                  <img :src="f.url" :alt="`Screenshot ${i + 1}`" class="w-full h-28 object-contain" />
                  <button type="button" class="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white cursor-pointer disabled:opacity-50"
                          :aria-label="`Remove screenshot ${i + 1}`" :disabled="saving" @click="removeFile(i)">
                    <X class="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <p class="text-[10px] text-gray-500 dark:text-gray-400 truncate px-1.5 py-1">{{ f.file.name }}</p>
                </div>
              </div>

              <p v-if="fileError" class="text-xs text-red-600 dark:text-red-400" role="alert">{{ fileError }}</p>
              <p :class="hintClass">Show the whole screen, including any error message. Cover client details you don't want to share. Only you and IT support can open these.</p>

              <!-- Device details, so IT can test on the same setup -->
              <p class="flex items-start gap-2 rounded-lg bg-background-gray/70 dark:bg-background-dark-gray p-3 text-xs text-gray-500 dark:text-gray-400">
                <MonitorSmartphone class="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>Added automatically so IT can match your setup: <b class="font-medium text-gray-700 dark:text-gray-200">{{ deviceInfo || 'not available' }}</b></span>
              </p>
            </section>
          </form>

          <!-- CHECKLIST: the Raise Ticket button unlocks when every required item is done -->
          <aside class="px-6 py-5 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 bg-background-gray/50 dark:bg-background-dark-gray/60 flex flex-col gap-6 text-sm lg:overflow-y-auto lg:min-h-0">
            <div>
              <h3 class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-maurealty-blue dark:text-maurealty-light-blue">
                <ListChecks class="w-4 h-4" aria-hidden="true" /> Ticket checklist
              </h3>
              <p class="mt-2 text-xs text-gray-600 dark:text-gray-300">{{ doneCount }} of {{ checklist.length }} done</p>
              <div class="h-1.5 rounded-full bg-white dark:bg-black overflow-hidden mt-1">
                <div class="h-full bg-maurealty-green transition-all" :style="{ width: checklistPercent + '%' }"></div>
              </div>

              <ul class="mt-3 flex flex-col gap-2 text-xs" aria-live="polite">
                <li v-for="item in checklist" :key="item.id" class="flex items-start gap-2"
                    :class="item.ok ? 'text-maurealty-green' : 'text-gray-600 dark:text-gray-300'">
                  <CircleCheck v-if="item.ok" class="w-4 h-4 shrink-0" aria-hidden="true" />
                  <Circle v-else class="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-600" aria-hidden="true" />
                  <span>{{ item.label }}<span class="sr-only">{{ item.ok ? ' (done)' : ' (to do)' }}</span></span>
                </li>
              </ul>

              <h4 class="mt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Makes it faster (optional)</h4>
              <ul class="mt-2 flex flex-col gap-2 text-xs">
                <li v-for="item in optionalChecklist" :key="item.id" class="flex items-start gap-2"
                    :class="item.ok ? 'text-maurealty-green' : 'text-gray-500 dark:text-gray-400'">
                  <CircleCheck v-if="item.ok" class="w-4 h-4 shrink-0" aria-hidden="true" />
                  <CirclePlus v-else class="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{{ item.label }}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-maurealty-blue dark:text-maurealty-light-blue">What happens next</h3>
              <ol class="mt-2 flex flex-col gap-2 text-xs text-gray-600 dark:text-gray-300">
                <li><b class="text-gray-800 dark:text-gray-100">Raised:</b> IT support gets your ticket.</li>
                <li><b class="text-gray-800 dark:text-gray-100">In Review:</b> IT support is working on it.</li>
                <li><b class="text-gray-800 dark:text-gray-100">Resolved:</b> IT support leaves a note on the ticket saying what was done.</li>
              </ol>
            </div>
          </aside>
        </div>

        <!-- ACTIONS -->
        <div class="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <p class="text-xs" :class="error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'" :role="error ? 'alert' : 'status'">
            {{ error || footerHint }}
          </p>
          <div class="flex justify-end gap-3 shrink-0">
            <button type="button" :disabled="saving"
                    class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="requestClose">
              Cancel
            </button>
            <button type="button" :disabled="!canSubmit || saving"
                    class="flex items-center gap-2 px-4 py-2 rounded-lg bg-maurealty-blue text-white hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="submit">
              <Send class="w-4 h-4" aria-hidden="true" /> {{ saving ? 'Raising…' : 'Raise Ticket' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Closing with something typed asks first, so a stray click outside doesn't lose the ticket -->
    <ConfirmActionModal
      v-if="confirmingDiscard"
      title="Discard this ticket?"
      message="What you have written will be lost."
      confirm-label="Discard"
      cancel-label="Keep writing"
      @cancel="confirmingDiscard = false"
      @confirm="emit('close')"
    />
  </Teleport>
</template>

<script setup lang="ts">
// RaiseTicketModal: the guided Raise a Ticket form on the IT Support page: category, page, title,
// steps / expected / actual result for problems, optional screenshots, and a live checklist that
// unlocks the submit button. ticketService.createTicket cleans and checks everything again.
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, useId } from 'vue'
import { LifeBuoy, Lightbulb, TriangleAlert, ImagePlus, MonitorSmartphone, ListChecks, CircleCheck, Circle, CirclePlus, Send, X } from 'lucide-vue-next'
import ConfirmActionModal from '@/components/commissions/ConfirmActionModal.vue'
import { ticketService, cleanTicket, ticketProblems } from '@/services/ticketService'
import { describeDevice } from '@/utils/deviceInfo'
import {
  TICKET_CATEGORIES, TICKET_AREAS, TICKET_FREQUENCIES, TICKET_TEXT_LIMITS as L, MAX_OPEN_TICKETS,
  MAX_TICKET_IMAGES, MAX_TICKET_IMAGE_MB, MIN_TICKET_STEPS, categoryOption, charCount, countSteps, imageProblem,
  type NewTicket, type TicketCategory, type TicketFrequency,
} from '@/assets/classes/ticket'

// openCount: the user's tickets that are not resolved yet (the page already has them loaded).
const props = defineProps<{ agentId: number; openCount: number }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'created', id: number): void }>()

const titleId = useId()
const panel = ref<HTMLElement | null>(null)
const firstField = ref<HTMLSelectElement | null>(null)

const issueCategories = TICKET_CATEGORIES.filter(c => c.isIssue)
const requestCategories = TICKET_CATEGORIES.filter(c => !c.isIssue)

const DEFAULT_TITLE_EXAMPLE = TICKET_CATEGORIES[0]?.titleExample ?? ''
const STEPS_PLACEHOLDER ='1. Went to Project Listings\n2. Opened the listing "Azure Residences"\n3. Pressed SOLD'
const REQUEST_PLACEHOLDER: Partial<Record<TicketCategory, string>> = {
  feature_request: 'What should the portal do, and how would it help your work?\nExample: an Export button on the Commissions page that saves the list as a CSV for our monthly report.',
  feedback: 'What works well, or what could be better? Name the page and what you were trying to do.',
  other: 'Tell IT support what you need. Include the names of pages, listings or sales if they matter.',
}

// --- Form ---
const form = reactive({
  category: '' as TicketCategory | '',
  area: '',
  title: '',
  steps_to_reproduce: '',
  expected_result: '',
  description: '',
  frequency: null as TicketFrequency | null,
  occurred_at: '',
})

// Browser, OS and window/screen size, read once when the form opens.
const deviceInfo = describeDevice()

const category = computed(() => categoryOption(form.category))
const isIssue = computed(() => !!category.value?.isIssue)
const atLimit = computed(() => props.openCount >= MAX_OPEN_TICKETS)

// The ticket exactly as it would be sent (cleaned the same way ticketService cleans it).
const draft = computed<NewTicket>(() => ({
  category: form.category as TicketCategory,
  title: form.title,
  area: form.area,
  frequency: form.frequency,
  description: form.description,
  steps_to_reproduce: form.steps_to_reproduce,
  expected_result: form.expected_result,
  occurred_at: form.occurred_at || null,
  device_info: deviceInfo,
}))
const cleaned = computed(() => cleanTicket(draft.value))
const stepCount = computed(() => countSteps(form.steps_to_reproduce))

// "When did it happen" can't be in the future (the max attribute alone doesn't stop typing it).
function localDateTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
const nowLocal = localDateTime(new Date())
const occurredInFuture = computed(() => !!form.occurred_at && new Date(form.occurred_at).getTime() > Date.now() + 5 * 60 * 1000)

// --- Live checklist (the same rules ticketService.ticketProblems checks before sending) ---
const checklist = computed(() => {
  const t = cleaned.value
  const items = [
    { id: 'category', label: 'Category chosen', ok: !!categoryOption(t.category) },
    { id: 'area', label: 'Page or feature chosen', ok: TICKET_AREAS.includes(t.area) },
    { id: 'title', label: `Title names the problem (${L.title.min}+ characters)`, ok: charCount(t.title) >= L.title.min },
  ]
  if (!category.value || isIssue.value) {
    // Read from the form (not the cleaned draft) so the items tick before a category is chosen too.
    const steps = form.steps_to_reproduce
    items.push(
      { id: 'steps', label: `At least ${MIN_TICKET_STEPS} steps to recreate it`, ok: countSteps(steps) >= MIN_TICKET_STEPS && charCount(steps.trim()) >= L.steps.min },
      { id: 'expected', label: 'What you expected to happen', ok: charCount(form.expected_result.trim()) >= L.expected.min },
      { id: 'actual', label: `What happened instead (${L.description.min}+ characters)`, ok: charCount(t.description) >= L.description.min },
      { id: 'frequency', label: 'How often it happens', ok: !!form.frequency },
    )
  } else {
    items.push({ id: 'details', label: `Details written (${L.description.min}+ characters)`, ok: charCount(t.description) >= L.description.min })
  }
  return items
})

const optionalChecklist = computed(() => [
  { id: 'screenshot', label: 'A screenshot of the problem', ok: files.value.length > 0 },
  ...(!category.value || isIssue.value ? [{ id: 'when', label: 'When it happened', ok: !!form.occurred_at && !occurredInFuture.value }] : []),
])

const doneCount = computed(() => checklist.value.filter(i => i.ok).length)
const checklistPercent = computed(() => Math.round((doneCount.value / checklist.value.length) * 100))
const canSubmit = computed(() =>
  !atLimit.value && checklist.value.every(i => i.ok) && ticketProblems(cleaned.value).length === 0
)

const footerHint = computed(() => {
  if (atLimit.value) return "You can't raise another ticket right now."
  const left = checklist.value.length - doneCount.value
  if (left > 0) return `${left} more ${left === 1 ? 'item' : 'items'} on the checklist.`
  return ticketProblems(cleaned.value)[0] ?? 'Ready to send to IT support.'
})

// --- Steps: numbered automatically ---
// Focusing an empty box starts the list with "1. ".
function startSteps() {
  if (!form.steps_to_reproduce.trim()) form.steps_to_reproduce = '1. '
}
// Leaving it with only "1. " clears it again, so the example placeholder shows.
function tidySteps() {
  if (/^\s*1[.)]?\s*$/.test(form.steps_to_reproduce)) form.steps_to_reproduce = ''
}
// Enter on a numbered line adds the next number; Enter on an empty numbered line ends the list.
function onStepsKeydown(e: KeyboardEvent) {
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return
  const el = e.target as HTMLTextAreaElement
  const { selectionStart: start, selectionEnd: end, value } = el
  if (start !== end) return
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const marker = /^(\s*)(\d+)([.)])\s*(.*)$/.exec(value.slice(lineStart, start))
  if (!marker) return
  e.preventDefault()

  const indent = marker[1] ?? ''
  const num = Number(marker[2] ?? 0)
  const dot = marker[3] ?? '.'
  const text = marker[4] ?? ''
  let next: string
  let caret: number
  if (!text.trim()) {
    next = value.slice(0, lineStart) + value.slice(start)
    caret = lineStart
  } else {
    const insert = `\n${indent}${num + 1}${dot} `
    next = value.slice(0, start) + insert + value.slice(end)
    caret = start + insert.length
  }
  form.steps_to_reproduce = next.slice(0, L.steps.max)
  nextTick(() => el.setSelectionRange(caret, caret))
}

// --- Screenshots: file picker, drag and drop, or paste ---
interface Picked { key: number; file: File; url: string }
const files = ref<Picked[]>([])
const fileError = ref('')
const dragging = ref(false)
let fileCounter = 0

function addFiles(list: File[]) {
  fileError.value = ''
  for (const file of list) {
    if (files.value.length >= MAX_TICKET_IMAGES) {
      fileError.value = `You can attach up to ${MAX_TICKET_IMAGES} screenshots.`
      break
    }
    const problem = imageProblem(file)
    if (problem) { fileError.value = problem; continue }
    files.value.push({ key: ++fileCounter, file, url: URL.createObjectURL(file) })
  }
}
function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  addFiles(Array.from(input.files ?? []))
  input.value = ''
}
function onDrop(e: DragEvent) {
  dragging.value = false
  if (!saving.value) addFiles(Array.from(e.dataTransfer?.files ?? []))
}
function removeFile(i: number) {
  const [gone] = files.value.splice(i, 1)
  if (gone) URL.revokeObjectURL(gone.url)
  fileError.value = ''
}
// Pasting an image anywhere while the form is open attaches it (text pastes are left alone).
function onPaste(e: ClipboardEvent) {
  if (saving.value || confirmingDiscard.value) return
  const imgs = Array.from(e.clipboardData?.files ?? []).filter(f => f.type.startsWith('image/'))
  if (imgs.length) { e.preventDefault(); addFiles(imgs) }
}

// --- Closing ---
const confirmingDiscard = ref(false)
const isDirty = computed(() =>
  !!(form.title.trim() || form.description.trim() || form.expected_result.trim() || stepCount.value > 0 || files.value.length)
)
function requestClose() {
  if (saving.value) return
  if (isDirty.value) confirmingDiscard.value = true
  else emit('close')
}

// Focus starts on the Category field and goes back to the opening button on close.
let returnFocus: HTMLElement | null = null
onMounted(() => {
  returnFocus = document.activeElement as HTMLElement | null
  document.addEventListener('paste', onPaste)
  nextTick(() => (firstField.value ?? panel.value)?.focus())
})
onBeforeUnmount(() => {
  document.removeEventListener('paste', onPaste)
  files.value.forEach(f => URL.revokeObjectURL(f.url))
  returnFocus?.focus?.()
})

// --- Submit ---
const saving = ref(false)
const error = ref('')

async function submit() {
  if (!canSubmit.value || saving.value) return
  error.value = ''
  saving.value = true
  try {
    // ticketService cleans and checks everything again, uploads the screenshots, then saves.
    const id = await ticketService.createTicket(props.agentId, draft.value, files.value.map(f => f.file))
    emit('created', id)
  } catch (e: any) {
    error.value = e?.message || 'Could not raise the ticket. Please try again.'
  } finally {
    saving.value = false
  }
}

// Shared Tailwind classes for this form (light and dark mode).
const sectionTitle = 'flex items-center gap-2 text-sm font-bold text-maurealty-blue dark:text-maurealty-light-blue'
const sectionNumber = 'flex items-center justify-center w-5 h-5 rounded-full text-[11px] bg-maurealty-blue text-white dark:bg-maurealty-light-blue dark:text-maurealty-blue'
const labelClass = 'text-xs font-medium text-gray-600 dark:text-gray-300'
const hintClass = 'text-xs text-gray-500 dark:text-gray-400'
const counterClass = 'text-[11px] text-gray-400 dark:text-gray-500 tabular-nums'
const inputClass =
  'w-full py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark-gray ' +
  'text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none ' +
  'transition-[border-color,box-shadow] duration-200 focus:border-maurealty-blue focus:shadow-[0_0_0_3px_rgba(4,70,119,0.15)] ' +
  'dark:focus:border-maurealty-light-blue dark:[color-scheme:dark] disabled:opacity-60'
</script>
