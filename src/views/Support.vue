<template>
  <div class="w-full min-h-screen bg-background-gray dark:bg-background-dark-gray flex flex-col">

    <!-- TOAST: bottom right; raised on phones so the bottom nav bar doesn't cover it -->
    <Transition name="toast">
      <div v-if="toast" :role="toast.tone === 'error' ? 'alert' : 'status'"
           class="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-70 flex items-center gap-3 max-w-sm rounded-lg bg-white dark:bg-black border shadow-lg px-5 py-3"
           :class="toast.tone === 'error' ? 'border-red-300 dark:border-red-700' : 'border-maurealty-green/40 dark:border-maurealty-green/60'">
        <span class="flex items-center justify-center shrink-0 size-6 rounded-full text-white text-sm font-bold"
              :class="toast.tone === 'error' ? 'bg-red-600' : 'bg-maurealty-green'">{{ toast.tone === 'error' ? '!' : '✓' }}</span>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ toast.text }}</p>
      </div>
    </Transition>

    <!-- HEADER -->
    <header class="flex flex-col py-5 px-4 sm:px-10 w-full bg-linear-to-r from-[#A9D6FF70] dark:from-[#041d3070] to-[#FFFFFF] dark:to-black text-maurealty-blue dark:text-white shadow-md sticky top-0 z-20">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-3">
        <div>
          <div class="flex flex-wrap items-baseline gap-x-3">
            <h1 class="text-xl sm:text-3xl font-bold">IT SUPPORT</h1>
            <!-- Whose tickets these are; a placeholder until we know if the viewer is an admin -->
            <span v-if="agentResolved" class="text-sm font-medium text-maurealty-blue/70 dark:text-white/70">
              {{ isAdmin ? 'All tickets · you are IT support' : 'Your tickets' }}
            </span>
            <span v-else class="self-center h-4 w-40 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" aria-hidden="true"></span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">Report a problem or send feedback, then follow it from Raised to Resolved.</p>
        </div>
        <!-- <button type="button" :disabled="!canRaise"
                :title="canRaise ? '' : raiseBlockedReason"
                class="flex items-center gap-1 bg-maurealty-blue text-white px-4 py-1.5 rounded-full cursor-pointer hover:opacity-70 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
                @click="openRaise">
          <Plus class="size-4" aria-hidden="true" /> Raise a Ticket
        </button> -->
      </div>
    </header>

    <main class="flex-1 p-4 sm:p-8 lg:p-10">
      <div class="grid grid-cols-1 lg:grid-cols-[20rem_minmax(0,1fr)] gap-6 items-start">

        <!-- LEFT COLUMN -->
        <div class="flex flex-col gap-6">

          <!-- RAISE A TICKET: open-ticket meter and what makes a good ticket -->
          <section :class="[card, 'p-5']">
            <h2 class="text-lg font-bold text-maurealty-blue dark:text-white">Raise a Ticket</h2>

            <div class="mt-3">
              <!-- Open-ticket meter: placeholders until the tickets load (it would read "0 of 3" meanwhile) -->
              <div v-if="loading" class="h-5 flex items-center justify-between gap-3 animate-pulse" aria-hidden="true">
                <div class="h-4 w-48 rounded bg-gray-300 dark:bg-gray-700"></div>
                <div class="h-4 w-8 rounded bg-gray-300 dark:bg-gray-700"></div>
              </div>
              <div v-else class="flex items-center justify-between gap-3 text-sm text-gray-700 dark:text-gray-200">
                <span>Your open tickets ({{ myOpenCount }} of {{ MAX_OPEN_TICKETS }} used)</span>
                <span class="font-semibold tabular-nums">{{ myOpenCount }}/{{ MAX_OPEN_TICKETS }}</span>
              </div>
              <div class="h-2 rounded-full bg-background-gray dark:bg-background-dark-gray overflow-hidden mt-1.5" :class="{ 'animate-pulse': loading }">
                <div class="h-full transition-all" :class="atLimit ? 'bg-amber-500' : 'bg-maurealty-blue dark:bg-maurealty-light-blue'"
                     :style="{ width: openPercent + '%' }"></div>
              </div>
              <p v-if="atLimit" class="text-xs text-amber-700 dark:text-amber-300 mt-2">
                You have {{ myOpenCount }} open tickets. Wait for IT support to resolve one before raising another.
              </p>
              <p v-else class="text-xs text-gray-500 dark:text-gray-400 mt-2">Resolved tickets don't count.</p>
            </div>

            <h3 class="mt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">A good ticket has</h3>
            <ul class="mt-2 flex flex-col gap-1.5 text-xs text-gray-600 dark:text-gray-300">
              <li v-for="tip in GOOD_TICKET_TIPS" :key="tip" class="flex items-start gap-2">
                <CircleCheck class="w-4 h-4 shrink-0 text-maurealty-green" aria-hidden="true" /> {{ tip }}
              </li>
            </ul>

            <button type="button" :disabled="!canRaise"
                    class="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-maurealty-blue text-white font-semibold text-sm hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="openRaise">
              <Plus class="size-4" aria-hidden="true" /> Raise a Ticket
            </button>
          </section>

          <!-- LOADING: a neutral placeholder card until we know which of the two cards below to show -->
          <section v-if="!agentResolved" :class="[card, 'p-5']" aria-hidden="true">
            <div class="animate-pulse">
              <div class="h-6 w-36 rounded bg-gray-300 dark:bg-gray-700"></div>
              <div class="mt-4 flex flex-col gap-3">
                <div v-for="n in 3" :key="'side-skeleton-' + n" class="flex items-center justify-between gap-3">
                  <div class="h-4 w-3/5 rounded bg-gray-300 dark:bg-gray-700"></div>
                  <div class="h-5 w-20 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                </div>
              </div>
            </div>
          </section>

          <!-- ADMINS: their own tickets (the table on the right holds everyone's) -->
          <section v-else-if="isAdmin" :class="[card, 'p-5']">
            <h2 class="text-lg font-bold text-maurealty-blue dark:text-white">Your Tickets</h2>
            <!-- Placeholder rows while the tickets load -->
            <ul v-if="loading" class="mt-2 animate-pulse" aria-hidden="true">
              <li v-for="n in 3" :key="'mine-skeleton-' + n" class="flex items-center justify-between gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span class="flex flex-col gap-1.5 w-3/5">
                  <span class="block h-3 w-12 rounded bg-gray-300 dark:bg-gray-700"></span>
                  <span class="block h-4 w-full rounded bg-gray-300 dark:bg-gray-700"></span>
                </span>
                <span class="block h-5 w-20 rounded-full bg-gray-300 dark:bg-gray-700"></span>
              </li>
            </ul>
            <p v-else-if="myTickets.length === 0" class="mt-2 text-xs text-gray-500 dark:text-gray-400">You haven't raised any tickets.</p>
            <ul v-else class="mt-2">
              <li v-for="t in myTickets.slice(0, 5)" :key="t.id" class="border-b border-gray-100 dark:border-gray-800 last:border-0">
                <button type="button" class="w-full flex items-center justify-between gap-3 py-2.5 text-left cursor-pointer group" @click="openTicket(t)">
                  <span class="min-w-0">
                    <span class="block text-xs text-gray-500 dark:text-gray-400">{{ ticketNumber(t.id) }}</span>
                    <span class="block text-sm font-medium text-gray-800 dark:text-gray-100 truncate group-hover:underline" :title="t.title">{{ t.title }}</span>
                  </span>
                  <TicketStatusBadge :status="t.status" class="shrink-0" />
                </button>
              </li>
            </ul>
          </section>

          <!-- AGENTS: how a ticket moves -->
          <section v-else :class="[card, 'p-5']">
            <h2 class="text-lg font-bold text-maurealty-blue dark:text-white">How tickets move</h2>
            <ol class="mt-3 flex flex-col gap-3 text-xs text-gray-600 dark:text-gray-300">
              <li class="flex items-start gap-3"><TicketStatusBadge status="raised" class="shrink-0" /> IT support has your ticket.</li>
              <li class="flex items-start gap-3"><TicketStatusBadge status="in_review" class="shrink-0" /> IT support is working on it.</li>
              <li class="flex items-start gap-3"><TicketStatusBadge status="resolved" class="shrink-0" /> Done. Open the ticket to read IT support's note.</li>
            </ol>
          </section>
        </div>

        <!-- RIGHT COLUMN: TICKETS -->
        <section :class="[card, 'min-w-0 overflow-hidden']">
          <div class="p-5 pb-4 flex flex-col gap-4 border-b border-gray-100 dark:border-gray-800">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <!-- Title waits for the viewer's role, the count for the tickets -->
              <h2 v-if="agentResolved" class="text-lg font-bold text-maurealty-blue dark:text-white">
                {{ isAdmin ? 'All Tickets (Admin)' : 'My Tickets' }}
                <span v-if="loading" class="inline-block align-middle ml-1 h-3 w-6 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" aria-hidden="true"></span>
                <span v-else class="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">({{ statusFiltered.length }})</span>
              </h2>
              <div v-else class="h-7 flex items-center" aria-hidden="true">
                <div class="h-5 w-40 rounded bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
              </div>
              <!-- Search runs in the browser over the loaded tickets; nothing is sent to the database -->
              <div class="relative w-full sm:w-64">
                <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" aria-hidden="true" />
                <input v-model="search" type="search" maxlength="100" placeholder="Search tickets…" aria-label="Search tickets"
                       class="w-full py-1.5 pl-8 pr-3 text-sm rounded-lg bg-white dark:bg-background-dark-gray text-gray-800 dark:text-gray-100 placeholder:text-gray-500 border border-maurealty-blue/30 dark:border-maurealty-light-blue/30 focus:outline-2 focus:outline-maurealty-blue dark:focus:outline-maurealty-light-blue" />
              </div>
            </div>

            <!-- STATUS FILTER -->
            <div class="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <button v-for="f in STATUS_FILTERS" :key="f.id" type="button"
                      :class="['px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0',
                               statusFilter === f.id
                                 ? 'bg-maurealty-blue text-white shadow-md dark:bg-maurealty-light-blue dark:text-maurealty-blue'
                                 : 'bg-background-gray text-sidebar-hover hover:bg-sidebar-hover/20 dark:bg-background-dark-gray dark:text-gray-300 dark:hover:bg-gray-800']"
                      @click="statusFilter = f.id">
                {{ f.label }}
                <!-- The count waits for the tickets; a placeholder in the text colour until then -->
                <span v-if="loading" class="inline-block align-middle h-3 w-5 rounded-sm bg-current/30 animate-pulse" aria-hidden="true"></span>
                <template v-else>({{ countByStatus(f.id) }})</template>
              </button>
            </div>
          </div>

          <!-- LOADING: announced to screen readers; the table below shows skeleton rows meanwhile -->
          <p v-if="loading" class="sr-only" role="status">Loading tickets…</p>

          <!-- LOAD ERROR: shown instead of an empty list so the cause is visible -->
          <div v-if="!loading && loadError" class="py-12 px-4 text-center">
            <p class="text-sm font-semibold text-red-600 dark:text-red-400">Tickets could not be loaded.</p>
            <p class="text-xs text-gray-600 dark:text-gray-300 mt-1 break-words">{{ loadError }}</p>
          </div>

          <!-- EMPTY (only once loading has finished) -->
          <div v-else-if="!loading && statusFiltered.length === 0" class="py-16 px-4 flex flex-col items-center text-center text-gray-500 dark:text-gray-400 gap-2">
            <LifeBuoy class="size-10 opacity-40" aria-hidden="true" />
            <p class="font-medium">
              {{ search || statusFilter !== 'all' ? 'No tickets match your filters.' : (isAdmin ? 'No tickets yet.' : "You haven't raised any tickets yet.") }}
            </p>
            <button v-if="search || statusFilter !== 'all'" type="button" class="text-sm text-maurealty-blue dark:text-white underline hover:opacity-70 cursor-pointer" @click="clearFilters">
              Clear filters
            </button>
          </div>

          <!-- TABLE: scrolls sideways on its own on small screens. While the tickets load it keeps
               its header and shows skeleton rows (same columns as a real row). -->
          <template v-else>
            <div class="overflow-x-auto" :aria-busy="loading">
              <table class="w-full min-w-[680px] text-sm text-left">
                <thead class="bg-maurealty-blue dark:bg-[#072339] text-white">
                  <tr>
                    <th class="px-4 py-3 font-semibold">ID</th>
                    <th class="px-4 py-3 font-semibold">Ticket</th>
                    <th v-if="isAdmin" class="px-4 py-3 font-semibold">Raised By</th>
                    <th class="px-4 py-3 font-semibold">Submitted</th>
                    <th class="px-4 py-3 font-semibold">Status</th>
                    <th class="px-4 py-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>

                <!-- SKELETON ROWS: one page of placeholders shaped like the real rows below.
                     Keep the cells in step with the real row when a column is added or removed. -->
                <tbody v-if="loading" class="animate-pulse" aria-hidden="true">
                  <tr v-for="n in PAGE_SIZE" :key="'skeleton-' + n" class="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <td class="px-4 py-3"><div class="h-4 w-12 rounded bg-gray-300 dark:bg-gray-700"></div></td>
                    <td class="px-4 py-3 max-w-0 w-full">
                      <div class="h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-700"></div>
                      <div class="mt-1.5 h-3 w-1/2 rounded bg-gray-300 dark:bg-gray-700"></div>
                    </td>
                    <td v-if="isAdmin" class="px-4 py-3"><div class="h-4 w-28 rounded bg-gray-300 dark:bg-gray-700"></div></td>
                    <td class="px-4 py-3"><div class="h-4 w-24 rounded bg-gray-300 dark:bg-gray-700"></div></td>
                    <td class="px-4 py-3"><div class="h-5 w-20 rounded-full bg-gray-300 dark:bg-gray-700"></div></td>
                    <td class="px-4 py-3"><div class="mx-auto h-7 w-22 rounded-lg bg-gray-300 dark:bg-gray-700"></div></td>
                  </tr>
                </tbody>

                <!-- REAL ROWS: click a row (or its ID) to open the ticket -->
                <tbody v-else>
                  <tr v-for="t in paginated" :key="t.id"
                      class="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-background-gray/60 dark:hover:bg-background-dark-gray/80 transition-colors cursor-pointer"
                      @click="openTicket(t)">
                    <!-- The ID is a button so the ticket can also be opened with the keyboard -->
                    <td class="px-4 py-3 whitespace-nowrap">
                      <button type="button" class="font-semibold text-maurealty-blue dark:text-maurealty-light-blue hover:underline cursor-pointer"
                              :aria-label="`Open ticket ${ticketNumber(t.id)}`" @click.stop="openTicket(t)">
                        {{ ticketNumber(t.id) }}
                      </button>
                    </td>
                    <td class="px-4 py-3 max-w-0 w-full">
                      <p class="font-medium text-gray-800 dark:text-white truncate" :title="t.title">{{ t.title }}</p>
                      <p class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                        <span class="truncate">{{ categoryLabel(t.category) }} · {{ t.area }}</span>
                        <span v-if="t.attachment_paths.length" class="inline-flex items-center gap-0.5 shrink-0" :title="`${t.attachment_paths.length} screenshot(s)`">
                          · <Paperclip class="size-3" aria-hidden="true" />{{ t.attachment_paths.length }}
                        </span>
                      </p>
                    </td>
                    <td v-if="isAdmin" class="px-4 py-3 whitespace-nowrap">
                      <span class="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-200">
                        {{ t.raised_by_name }}
                        <span v-if="isMine(t)" class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-maurealty-blue text-white uppercase tracking-wider">You</span>
                      </span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-200" :title="formatDateTime(t.created_at)">{{ timeAgo(t.created_at) }}</td>
                    <td class="px-4 py-3 whitespace-nowrap"><TicketStatusBadge :status="t.status" /></td>
                    <td class="px-4 py-3 text-center whitespace-nowrap" @click.stop>
                      <!-- Admin: the next step for the ticket. Everyone else: view it. -->
                      <template v-if="isAdmin">
                        <button v-if="t.status === 'raised'" type="button" :disabled="busyId === t.id"
                                :class="[actionBtn, 'border-maurealty-blue text-maurealty-blue hover:bg-maurealty-blue hover:text-white dark:border-maurealty-light-blue dark:text-maurealty-light-blue dark:hover:bg-maurealty-light-blue dark:hover:text-maurealty-blue']"
                                @click="quickReview(t)">
                          {{ busyId === t.id ? 'Starting…' : 'Review' }}
                        </button>
                        <button v-else-if="t.status === 'in_review'" type="button"
                                :class="[actionBtn, 'border-maurealty-green text-maurealty-green hover:bg-maurealty-green hover:text-white']"
                                @click="openTicket(t, 'resolve')">
                          Resolve
                        </button>
                        <button v-else type="button"
                                :class="[actionBtn, 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800']"
                                @click="openTicket(t, 'reopen')">
                          Reopen
                        </button>
                      </template>
                      <button v-else type="button"
                              :class="[actionBtn, 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800']"
                              @click="openTicket(t)">
                        View
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- PAGINATION -->
            <footer v-if="!loading && totalPages > 1" class="py-4 flex justify-center items-center gap-4 border-t border-gray-100 dark:border-gray-800">
              <button type="button" :disabled="currentPage === 1" :class="pageBtn" aria-label="Previous page" @click="currentPage--">&lt;</button>
              <span class="text-sm font-medium text-maurealty-blue dark:text-maurealty-light-blue">Page {{ currentPage }} of {{ totalPages }}</span>
              <button type="button" :disabled="currentPage >= totalPages" :class="pageBtn" aria-label="Next page" @click="currentPage++">&gt;</button>
            </footer>
          </template>
        </section>
      </div>
    </main>

    <!-- POPUPS -->
    <RaiseTicketModal
      v-if="showRaise && currentAgentId !== null"
      :agent-id="currentAgentId"
      :open-count="myOpenCount"
      @close="showRaise = false"
      @created="onCreated"
    />
    <TicketDetailsModal
      v-if="selectedTicket"
      :ticket="selectedTicket"
      :is-admin="isAdmin"
      :current-agent-id="currentAgentId"
      :intent="detailsIntent"
      @close="closeTicket"
      @changed="onChanged"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Plus, Search, LifeBuoy, CircleCheck, Paperclip } from 'lucide-vue-next'
import RaiseTicketModal from '@/components/support/RaiseTicketModal.vue'
import TicketDetailsModal from '@/components/support/TicketDetailsModal.vue'
import TicketStatusBadge from '@/components/support/TicketStatusBadge.vue'
import { authService } from '@/services/authService'
import { ticketService } from '@/services/ticketService'
import { useLiveRefresh } from '@/utils/liveRefresh'
import {
  MAX_OPEN_TICKETS, TICKET_STATUS_LABEL, ticketNumber, categoryLabel,
  type SupportTicket, type TicketStatus,
} from '@/assets/classes/ticket'

// IT Support page (/support). Everyone raises tickets; a non-admin sees only their own,
// an admin (IT support) sees everyone's and moves them Raised -> In Review -> Resolved.
// The database enforces the same (RLS + trigger, see ticketService).

const tickets = ref<SupportTicket[]>([])
const loading = ref(true)         // first load only (live refreshes are silent): skeleton rows and counts
const agentResolved = ref(false)  // we know whether the viewer is an admin (header, left card, table title)
const loadError = ref('')
const isAdmin = ref(false)
const currentAgentId = ref<number | null>(null)

const GOOD_TICKET_TIPS = [
  'A title that names the page and the problem',
  'The steps to recreate it, one per line',
  'What you expected and what happened instead',
  'A screenshot, if you can',
]

// --- Toast feedback (bottom right) ---
const toast = ref<{ text: string; tone: 'success' | 'error' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | undefined
function showToast(text: string, tone: 'success' | 'error' = 'success') {
  toast.value = { text, tone }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), tone === 'error' ? 5000 : 3000)
}

// Admin loads everyone's tickets; anyone else only their own (RLS would limit them anyway).
async function load(silent = false) {
  if (!silent) loading.value = true
  try {
    const agent = await authService.getCurrentAgent()
    isAdmin.value = !!agent?.admin_access
    currentAgentId.value = agent?.agent_ID ?? null
    agentResolved.value = true
    if (!agent) {
      tickets.value = []
      loadError.value = "Your login isn't linked to an agent record, so tickets can't be shown. Ask an admin to check your account."
      return
    }
    loadError.value = ''
    tickets.value = await ticketService.getTickets(isAdmin.value ? undefined : agent.agent_ID)
  } catch (e: any) {
    console.error('Failed to load support tickets:', e)
    loadError.value = e?.message || String(e)
  } finally {
    loading.value = false
    agentResolved.value = true
  }
}

onMounted(() => load())

// Stay current without a reload (new tickets, status changes by another admin).
useLiveRefresh(() => load(true), ['support_tickets'])

// "Submitted 5 minutes ago" labels move on by themselves.
const now = ref(Date.now())
const clock = setInterval(() => (now.value = Date.now()), 60_000)
onBeforeUnmount(() => {
  clearInterval(clock)
  clearTimeout(toastTimer)
})

// --- The signed-in user's own tickets ---
const isMine = (t: SupportTicket) => t.agent_ID != null && t.agent_ID === currentAgentId.value
const myTickets = computed(() => tickets.value.filter(isMine))
const myOpenCount = computed(() => myTickets.value.filter(t => t.status !== 'resolved').length)
const atLimit = computed(() => myOpenCount.value >= MAX_OPEN_TICKETS)
const openPercent = computed(() => Math.min(100, Math.round((myOpenCount.value / MAX_OPEN_TICKETS) * 100)))
const canRaise = computed(() => !loading.value && currentAgentId.value !== null && !atLimit.value)
const raiseBlockedReason = computed(() =>
  atLimit.value ? `You have ${myOpenCount.value} open tickets. Wait for one to be resolved.` : 'Loading…'
)

// --- Search and status filter (in the browser) ---
const search = ref('')
type StatusFilter = 'all' | TicketStatus
const statusFilter = ref<StatusFilter>('all')
const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'raised', label: TICKET_STATUS_LABEL.raised },
  { id: 'in_review', label: TICKET_STATUS_LABEL.in_review },
  { id: 'resolved', label: TICKET_STATUS_LABEL.resolved },
]

const searched = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return tickets.value
  return tickets.value.filter(t =>
    [ticketNumber(t.id), t.title, categoryLabel(t.category), t.area, t.raised_by_name]
      .some(s => s.toLowerCase().includes(q))
  )
})

function countByStatus(id: StatusFilter): number {
  return id === 'all' ? searched.value.length : searched.value.filter(t => t.status === id).length
}

// Open tickets first (newest first), then resolved ones (most recently resolved first).
const statusFiltered = computed(() => {
  const list = statusFilter.value === 'all' ? searched.value : searched.value.filter(t => t.status === statusFilter.value)
  return [...list].sort((a, b) => {
    const aDone = a.status === 'resolved' ? 1 : 0
    const bDone = b.status === 'resolved' ? 1 : 0
    if (aDone !== bDone) return aDone - bDone
    const aTime = aDone ? (a.resolved_at ?? a.created_at) : a.created_at
    const bTime = bDone ? (b.resolved_at ?? b.created_at) : b.created_at
    return bTime.localeCompare(aTime)
  })
})

function clearFilters() {
  search.value = ''
  statusFilter.value = 'all'
}

// --- Pagination ---
const PAGE_SIZE = 10
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(statusFiltered.value.length / PAGE_SIZE)))
const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return statusFiltered.value.slice(start, start + PAGE_SIZE)
})
watch([search, statusFilter], () => (currentPage.value = 1))
watch(totalPages, (n) => { if (currentPage.value > n) currentPage.value = n })

// --- Popups ---
const showRaise = ref(false)
function openRaise() {
  if (canRaise.value) showRaise.value = true
}

async function onCreated(id: number) {
  showRaise.value = false
  await load(true)
  statusFilter.value = 'all'
  showToast(`Ticket ${ticketNumber(id)} raised. IT support will review it.`)
}

// The open ticket is looked up by id, so a live refresh shows its newest status.
const selectedId = ref<number | null>(null)
const detailsIntent = ref<'resolve' | 'reopen' | null>(null)
const selectedTicket = computed(() => tickets.value.find(t => t.id === selectedId.value) ?? null)

function openTicket(t: SupportTicket, intent: 'resolve' | 'reopen' | null = null) {
  detailsIntent.value = intent
  selectedId.value = t.id
}
function closeTicket() {
  selectedId.value = null
  detailsIntent.value = null
}

// A status change in the details popup: swap in the updated row. A resolved ticket closes the
// popup; after Start review or Reopen it stays open so the admin can carry on.
function onChanged(updated: SupportTicket, message: string) {
  tickets.value = tickets.value.map(t => (t.id === updated.id ? updated : t))
  if (updated.status === 'resolved') closeTicket()
  else detailsIntent.value = null
  showToast(message)
}

// Admin "Review" in the table: start the review, then open the ticket to read it.
const busyId = ref<number | null>(null)
async function quickReview(t: SupportTicket) {
  if (!isAdmin.value || busyId.value !== null) return
  busyId.value = t.id
  try {
    const updated = await ticketService.startReview(t.id)
    if (!updated) {
      showToast(`${ticketNumber(t.id)} was not changed. Someone else may have updated it.`, 'error')
      await load(true)
      return
    }
    tickets.value = tickets.value.map(x => (x.id === updated.id ? updated : x))
    openTicket(updated)
    showToast(`${ticketNumber(t.id)} is now In Review.`)
  } catch (e: any) {
    showToast(e?.message || 'Could not start the review.', 'error')
  } finally {
    busyId.value = null
  }
}

// --- Formatting ---
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (now.value - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    return `${m} ${m === 1 ? 'minute' : 'minutes'} ago`
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600)
    return `${h} ${h === 1 ? 'hour' : 'hours'} ago`
  }
  const d = Math.floor(seconds / 86400)
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d} days ago`
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Shared Tailwind classes (same card look as the Sales Report).
const card = 'bg-white dark:bg-black rounded-xl border border-[#A9D6FF]/40 dark:border-[#A9D6FF]/20 shadow-[0_4px_6px_rgba(0,0,0,0.05)]'
const actionBtn = 'min-w-[5.5rem] px-4 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
const pageBtn =
  'px-4 py-1 border border-maurealty-blue dark:border-maurealty-light-blue text-maurealty-blue dark:text-maurealty-light-blue rounded ' +
  'hover:bg-maurealty-blue dark:hover:bg-maurealty-light-blue hover:text-white dark:hover:text-maurealty-blue transition-colors ' +
  'disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-maurealty-blue dark:disabled:hover:text-maurealty-light-blue cursor-pointer disabled:cursor-not-allowed'
</script>

<style scoped>
/* Toast slides up into the bottom-right corner */
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
