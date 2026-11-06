<template>
    <div class="min-h-screen w-full bg-background-gray dark:bg-background-dark-gray pt-8 flex flex-col items-center">

      <!-- MAIN CONTAINER -->
      <div class="w-full max-w-[1100px] px-4">

        <!-- HEADER -->
        <!-- Header wraps into two rows on phones instead of squeezing everything into one -->
        <div class="flex flex-wrap items-center justify-between gap-3 min-h-[110px] px-4 sm:px-6 py-4 mb-6
                    bg-gradient-to-r from-[#A9D6FF70] dark:from-[#031a2b] to-[#FFFFFF] dark:to-black
                    shadow-[0_10px_15px_rgba(0,0,0,0.15)] rounded-[12px]">

          <!-- TITLE -->
          <h1 class="text-[clamp(1.2rem,2vw,2rem)] font-extrabold text-[#07407B] dark:text-white">
            GENEALOGY
          </h1>

          <!-- SEARCH -->
          <div class="flex-1 sm:mx-6 max-w-[350px] order-3 sm:order-none w-full sm:w-auto basis-full sm:basis-auto">
            <input
              type="text"
              v-model="search"
              placeholder="Search Agent"
              class="w-full rounded-[10px] border border-[#1C1E76] dark:border-maurealty-light-blue dark:text-white px-3 py-2
                     text-[clamp(0.7rem,1vw,1rem)]
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- ACTIONS (admins only: adding an agent also creates their login) -->
          <div class="flex items-center gap-4">
            <button
              v-if="isAdmin"
              @click="openAdd"
              class="flex items-center gap-2 bg-[#07407B] text-white
                     px-4 py-2 rounded-[10px] hover:bg-blue-700 text-sm cursor-pointer">
              <span class="text-lg">+</span>
              Add Agent
            </button>
          </div>
        </div>

        <!-- STATS -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-[#C8DDF64A] dark:bg-[#1b3c64b7] dark:text-white p-4 rounded-xl shadow border-l-4 border-blue-500 dark:border-blue-900">
            Total Agents<br><b>{{ stats.totalAgents }}</b>
          </div>
          <div class="bg-[#c8ddf6b7] dark:bg-[#1c2b3db7] dark:text-white p-4 rounded-xl border-l-4 border-blue-500 dark:border-blue-900 shadow">
            Team Leaders<br><b>{{ stats.teamLeaders }}</b>
          </div>
          <div class="bg-[#c8ddf6b7] dark:bg-[#1c2b3db7] dark:text-white p-4 rounded-xl border-l-4 border-blue-500 dark:border-blue-900 shadow">
            Active Teams<br><b>{{ stats.activeTeams }}</b>
          </div>
          <div class="bg-[#c8ddf6b7] dark:bg-[#1c2b3db7] dark:text-white p-4 rounded-xl border-l-4 border-blue-500 dark:border-blue-900 shadow">
            New This Month<br><b>{{ stats.newThisMonth }}</b>
          </div>
        </div>

        <!-- CONTENT -->
        <section class="custom-scrollbar h-full overflow-y-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

          <!-- TEAMS -->
          <div class="bg-white dark:bg-black dark:text-white p-8 rounded-xl shadow">
            <h2 class="font-bold mb-4">TEAMS</h2>

            <p v-if="!loading && teams.length === 0" class="text-sm text-gray-500 dark:text-gray-400">No teams yet.</p>

            <div v-for="team in filteredTeams" :key="team.agent_ID"
                 class="flex justify-between p-3 bg-[#C8DDF64A] dark:bg-[#5e77954a] rounded mb-2">
              <div>
                {{ team.name }}'s Team<br>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ team.members }} member{{ team.members === 1 ? '' : 's' }}</span>
              </div>
            </div>
          </div>

          <!-- RECENT -->
          <div class="bg-white dark:bg-black dark:text-white p-8 rounded-xl shadow">
            <h2 class="font-bold mb-4">RECENTLY ADDED</h2>

            <p v-if="!loading && recent.length === 0" class="text-sm text-gray-500 dark:text-gray-400">No agents yet.</p>

            <div v-for="a in filteredRecent" :key="a.agent_ID"
                 class="flex justify-between p-3 bg-[#C8DDF64A] dark:bg-[#5e77954a] rounded mb-2">
              <div>
                {{ a.first_name }} {{ a.last_name }}<br>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ positionLabel(a) }}</span>
              </div>

              <div class="text-right">
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ formatHire(a.hire_date) }}</div>
              </div>
            </div>
          </div>

        </div>

        <!-- MANAGE AGENTS -->
        <div class="bg-white dark:bg-black dark:text-white p-8 rounded-xl shadow mt-6">
          <h2 class="font-bold mb-4">MANAGE AGENTS</h2>

          <p v-if="!loading && allAgents.length === 0" class="text-sm text-gray-500 dark:text-gray-400">No agents yet.</p>
          <p v-if="deleteError" class="text-red-600 text-xs mb-3">{{ deleteError }}</p>

          <div v-for="a in filteredAll" :key="a.agent_ID"
               class="flex items-center justify-between p-3 bg-[#C8DDF64A] dark:bg-[#5e77954a] rounded mb-2">
            <div>
              {{ a.first_name }} {{ a.last_name }}<br>
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ positionLabel(a) }}</span>
            </div>
            <!-- Edit (incl. revealing the initial password) and Delete are admin-only.
                 An admin can't delete their own record (it would also remove their login). -->
            <div v-if="isAdmin" class="flex items-center gap-2">
              <button @click="openEdit(a.agent_ID)"
                      class="px-3 py-1 rounded-lg border border-[#07407B] text-[#07407B] dark:border-maurealty-light-blue dark:text-maurealty-light-blue text-sm hover:bg-[#07407B] dark:hover:bg-maurealty-light-blue hover:text-white dark:hover:text-maurealty-blue transition cursor-pointer">
                Edit
              </button>
              <button v-if="a.agent_ID !== currentAgentId" @click="confirmDelete(a)" :disabled="deletingId === a.agent_ID"
                      class="px-3 py-1 rounded-lg border border-red-500 text-red-600 text-sm hover:bg-red-500 hover:text-white transition cursor-pointer disabled:opacity-50">
                {{ deletingId === a.agent_ID ? 'Deleting…' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>

        <TeamInsights ref="insights" @changed="onSaved" />

      </section>

      </div>

    <Gen :key="reloadKey" />

    <AddAgentModal v-if="showModal" :agent="editing" @close="closeModal" @saved="onSaved" />
    </div>
  </template>

<script setup lang ="ts">
// Genealogy page (/genealogy): team stats, Teams, Recently Added, Manage Agents (admins edit and
// delete), the Roles / Overrides / Promotion panel (TeamInsights) and the tree (genealogymodal).
// Adding an agent also creates their login (AddAgentModal -> agent-account Edge Function).
import { ref, computed, onMounted } from 'vue'
import Gen from '@/components/genealogy/genealogymodal.vue'
import AddAgentModal from '@/components/genealogy/AddAgentModal.vue'
import TeamInsights from '@/components/genealogy/TeamInsights.vue'
import { useLiveRefresh } from '@/utils/liveRefresh'
import { genealogyService, type GenealogyStats, type GenealogyAgent, type GenealogyNode, type AgentDetail } from '@/services/genealogyService'
import { positionMap } from '@/assets/classes/agent'
import { authService } from '@/services/authService'

const stats = ref<GenealogyStats>({ totalAgents: 0, teamLeaders: 0, activeTeams: 0, newThisMonth: 0 })
const recent = ref<(GenealogyAgent & { hire_date: string | null })[]>([])
const teams = ref<{ agent_ID: number; name: string; members: number }[]>([])
const allAgents = ref<GenealogyAgent[]>([])
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const editing = ref<AgentDetail | null>(null) // null = add mode, set = edit mode
const deletingId = ref<number | null>(null)
const deleteError = ref('')
const reloadKey = ref(0) // bump to remount the tree after a change
// Team Insights is told to reload after an add, edit or delete; it used to keep showing the old
// roster until the next realtime event or 60 s poll.
const insights = ref<InstanceType<typeof TeamInsights> | null>(null)

// Signed-in agent. Add / Edit / Delete are admin-only (the agent-account Edge Function and the
// admin_get_agent_login SQL function check this again on the server).
const isAdmin = ref(false)
const currentAgentId = ref<number | null>(null)

async function loadCurrentAgent() {
  const me = await authService.getCurrentAgent()
  isAdmin.value = !!me?.admin_access
  currentAgentId.value = me?.agent_ID ?? null
}

// Count a root's whole subtree (incl. itself) = team size.
function countMembers(node: GenealogyNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countMembers(c), 0)
}

function positionLabel(a: GenealogyAgent): string {
  if (a.position) return a.position
  if (a.position_ID != null) return positionMap[a.position_ID] ?? 'N/A'
  return 'N/A'
}

function formatHire(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

const filteredTeams = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? teams.value.filter(t => t.name.toLowerCase().includes(q)) : teams.value
})

const filteredRecent = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q
    ? recent.value.filter(a => `${a.first_name} ${a.last_name}`.toLowerCase().includes(q))
    : recent.value
})

const filteredAll = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q
    ? allAgents.value.filter(a => `${a.first_name} ${a.last_name}`.toLowerCase().includes(q))
    : allAgents.value
})

async function load() {
  loading.value = true
  try {
    const [s, r, tree, all] = await Promise.all([
      genealogyService.getStats(),
      genealogyService.getRecentAgents(5),
      genealogyService.getTree(),
      genealogyService.getAgents(),
    ])
    stats.value = s
    recent.value = r
    allAgents.value = all
    teams.value = tree.map(root => ({
      agent_ID: root.agent_ID,
      name: `${root.first_name} ${root.last_name}`,
      members: countMembers(root),
    }))
  } catch (e) {
    console.error('Failed to load genealogy landing:', e)
  } finally {
    loading.value = false
  }
}

function openAdd() {
  if (!isAdmin.value) return
  editing.value = null
  showModal.value = true
}

async function openEdit(id: number) {
  if (!isAdmin.value) return
  deleteError.value = ''
  try {
    editing.value = await genealogyService.getAgentById(id)
    showModal.value = true
  } catch (e) {
    console.error('Failed to load agent for edit:', e)
    deleteError.value = 'Could not open that agent for editing.'
  }
}

function closeModal() {
  showModal.value = false
  editing.value = null
}

async function confirmDelete(a: GenealogyAgent) {
  if (!isAdmin.value || a.agent_ID === currentAgentId.value) return
  deleteError.value = ''
  if (!window.confirm(`Delete ${a.first_name} ${a.last_name}? Their downlines move up to their upline. This cannot be undone.`)) return
  deletingId.value = a.agent_ID
  try {
    await genealogyService.deleteAgent(a.agent_ID)
    reloadKey.value++ // remount the tree so it reflects the removal
    await Promise.all([load(), insights.value?.reload()])
  } catch (e: any) {
    console.error('Delete agent failed:', e)
    deleteError.value = e?.message || 'Failed to delete agent.'
  } finally {
    deletingId.value = null
  }
}

function onSaved() {
  closeModal()
  reloadKey.value++ // remount the tree so the change appears
  load()
  void insights.value?.reload()
}

onMounted(() => {
  load()
  loadCurrentAgent()
})

// Agents added, moved or promoted elsewhere refresh the page without a reload.
useLiveRefresh(async () => { await load(); reloadKey.value++ }, ['agents', 'genealogy'])
</script>


<style scoped>
</style>
