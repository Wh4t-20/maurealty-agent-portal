<template>
  <div class="bg-white dark:bg-black dark:text-white p-8 rounded-xl shadow mt-6">
    <h2 class="font-bold mb-1">ROLES, OVERRIDES &amp; PROMOTION</h2>
    <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
      Promotion is based on accumulated sales: an agent's own completed sales plus everyone below them. An admin confirms each promotion.
    </p>

    <!-- Thresholds (editable) -->
    <div class="mb-6">
      <h3 class="text-sm font-semibold mb-2">Accumulated sales needed to be promoted into each rank</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div v-for="r in promotable" :key="r.position_ID" class="p-3 rounded bg-[#C8DDF64A] dark:bg-[#5e77954a]">
          <div class="text-sm font-medium">{{ r.position }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">{{ r.rate }}% rate</div>
          <div class="flex gap-2">
            <input type="number" min="0" step="1000" v-model.number="edits[r.position_ID]"
                   placeholder="Not set"
                   class="w-full min-w-0 px-2 py-1 text-sm border border-gray-300 rounded dark:bg-black dark:border-gray-700" />
            <button class="px-3 py-1 text-sm rounded bg-[#07407B] text-white hover:opacity-80 cursor-pointer disabled:opacity-50"
                    :disabled="savingId === r.position_ID" @click="saveThreshold(r.position_ID)">Save</button>
          </div>
        </div>
      </div>
      <p v-if="message" class="text-xs mt-2" :class="messageIsError ? 'text-red-600' : 'text-green-600'">{{ message }}</p>
    </div>

    <p v-if="loading" class="text-sm text-gray-500">Loading…</p>
    <p v-else-if="members.length === 0" class="text-sm text-gray-500 dark:text-gray-400">No agents yet.</p>

    <div v-for="m in members" :key="m.agent_ID" class="p-3 mb-2 rounded bg-[#C8DDF64A] dark:bg-[#5e77954a]">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div class="min-w-0">
          <button class="font-medium text-left cursor-pointer hover:underline" @click="toggle(m.agent_ID)">{{ m.name }}</button>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ m.rankLabel }} · {{ m.rate }}% · {{ m.directDownlines }} direct / {{ m.teamSize }} total downline(s)
          </div>
        </div>
        <div class="md:w-72">
          <div class="flex justify-between text-xs mb-1">
            <span>Accumulated {{ peso(m.accumulatedSales) }}</span>
            <span v-if="m.nextRankLabel && m.threshold">of {{ peso(m.threshold) }}</span>
          </div>
          <template v-if="m.nextRankLabel">
            <div class="h-2 bg-white dark:bg-gray-800 rounded-full overflow-hidden">
              <div class="h-full" :class="m.eligible ? 'bg-green-500' : 'bg-blue-500'" :style="{ width: m.progress + '%' }"></div>
            </div>
            <div class="flex items-center justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span v-if="m.threshold">{{ m.progress }}% to {{ m.nextRankLabel }}</span>
              <span v-else>No threshold set for {{ m.nextRankLabel }}</span>
              <button v-if="m.eligible"
                      class="px-2 py-0.5 text-xs font-semibold rounded bg-green-600 text-white hover:opacity-80 cursor-pointer disabled:opacity-50"
                      :disabled="promotingId === m.agent_ID" @click="promote(m)">
                {{ promotingId === m.agent_ID ? 'Promoting…' : `Promote to ${m.nextRankLabel}` }}
              </button>
            </div>
          </template>
          <div v-else class="text-xs text-gray-500 dark:text-gray-400">Top rank</div>
        </div>
      </div>

      <!-- Who earns what on this agent's sales -->
      <div v-if="openId === m.agent_ID" class="mt-3 pt-3 border-t border-white/60 dark:border-gray-700 text-sm">
        <div class="font-medium mb-1">Split of each payment's company commission on {{ m.name }}'s sales</div>
        <ul class="space-y-1">
          <li class="flex justify-between"><span>{{ m.name }} (Agent · {{ m.rankLabel }})</span><span class="font-semibold">{{ pct(m.agentSharePct) }}</span></li>
          <li v-for="o in m.overrides" :key="o.role" class="flex justify-between">
            <span>{{ o.name }} ({{ o.role }} · {{ o.rankLabel }})</span><span class="font-semibold">{{ pct(o.pct) }}</span>
          </li>
        </ul>
        <p v-if="m.overrides.length === 0" class="text-xs text-gray-500 dark:text-gray-400 mt-1">No upline earns an override on this agent's sales.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { genealogyService, type TeamMember, type RankPosition } from '@/services/genealogyService'
import { useLiveRefresh } from '@/utils/liveRefresh'

const emit = defineEmits<{ (e: 'changed'): void }>()

const members = ref<TeamMember[]>([])
const ranks = ref<RankPosition[]>([])
const edits = ref<Record<number, number | null>>({})
const loading = ref(true)
const openId = ref<number | null>(null)
const savingId = ref<number | null>(null)
const promotingId = ref<number | null>(null)
const message = ref('')
const messageIsError = ref(false)

// Specialists are the starting rank, so only the other three have a promotion threshold.
const promotable = computed(() => ranks.value.filter(r => r.rank !== 'specialist'))

const peso = (n: number) => '₱' + n.toLocaleString('en-PH', { maximumFractionDigits: 0 })
const pct = (n: number) => `${Number(n.toFixed(2))}%`
const toggle = (id: number) => { openId.value = openId.value === id ? null : id }

async function load(silent = false) {
  if (!silent) loading.value = true
  try {
    const [m, r] = await Promise.all([genealogyService.getTeamInsights(), genealogyService.getRankPositions()])
    members.value = m.sort((a, b) => b.accumulatedSales - a.accumulatedSales)
    ranks.value = r
    // Keep what the admin is typing; fill the rest from the database.
    for (const p of r) if (!(p.position_ID in edits.value) || !silent) edits.value[p.position_ID] = p.threshold
  } catch (e) {
    console.error('Failed to load team insights:', e)
  } finally {
    loading.value = false
  }
}

async function saveThreshold(positionId: number) {
  savingId.value = positionId
  message.value = ''
  try {
    const v = edits.value[positionId]
    await genealogyService.setPromotionThreshold(positionId, v == null || (v as unknown) === '' ? null : Number(v))
    messageIsError.value = false
    message.value = 'Threshold saved.'
    await load(true)
  } catch (e: any) {
    messageIsError.value = true
    message.value = e?.message || 'Could not save the threshold. Has the latest migration been run?'
  } finally {
    savingId.value = null
  }
}

async function promote(m: TeamMember) {
  if (!window.confirm(`Promote ${m.name} to ${m.nextRankLabel}?`)) return
  promotingId.value = m.agent_ID
  message.value = ''
  try {
    const { detached, newRank } = await genealogyService.promoteAgent(m.agent_ID)
    messageIsError.value = false
    message.value = `${m.name} is now ${newRank}.${detached ? ' They were detached from their previous upline.' : ''}`
    await load(true)
    emit('changed')
  } catch (e: any) {
    messageIsError.value = true
    message.value = e?.message || 'Promotion failed.'
  } finally {
    promotingId.value = null
  }
}

onMounted(() => load())
useLiveRefresh(() => load(true), ['sales', 'agents', 'genealogy', 'positions'])
</script>
