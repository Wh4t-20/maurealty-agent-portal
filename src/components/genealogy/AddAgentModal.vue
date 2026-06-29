<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,61,98,0.7)] backdrop-blur-sm p-4" @click.self="emit('close')">
      <div class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        <!-- HEADER -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 class="text-xl font-bold text-[#07407B]">Add Agent</h2>
          <button class="text-gray-400 hover:text-gray-700 text-xl leading-none cursor-pointer" @click="emit('close')">✕</button>
        </div>

        <!-- FORM -->
        <form class="px-6 py-4 overflow-y-auto grid grid-cols-2 gap-4 text-sm" @submit.prevent="save">
          <label class="flex flex-col gap-1">
            <span class="text-gray-500">First name *</span>
            <input v-model.trim="form.first_name" required class="form-input" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500">Middle name</span>
            <input v-model.trim="form.middle_name" class="form-input" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500">Last name *</span>
            <input v-model.trim="form.last_name" required class="form-input" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500">Sex *</span>
            <select v-model="form.sex" required class="form-input">
              <option value="">—</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500">Birth date *</span>
            <input type="date" v-model="form.birth_date" required class="form-input" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500">Hire date *</span>
            <input type="date" v-model="form.hire_date" required class="form-input" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500">Contact number *</span>
            <input v-model.trim="form.contact_number" required class="form-input" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500">Email *</span>
            <input type="email" v-model.trim="form.email_address" required class="form-input" />
          </label>
          <label class="flex flex-col gap-1 col-span-2">
            <span class="text-gray-500">Home address *</span>
            <input v-model.trim="form.home_address" required class="form-input" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500">Position *</span>
            <select v-model.number="form.position_ID" required class="form-input">
              <option :value="null">—</option>
              <option v-for="(label, id) in positionMap" :key="id" :value="Number(id)">{{ label }}</option>
            </select>
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500">Upline (sponsor)</span>
            <select v-model.number="uplineId" class="form-input">
              <option :value="null">— none (team root) —</option>
              <option v-for="a in uplineOptions" :key="a.agent_ID" :value="a.agent_ID">
                {{ a.first_name }} {{ a.last_name }}
              </option>
            </select>
          </label>
          <label class="flex items-center gap-2 col-span-2">
            <input type="checkbox" v-model="form.admin_access" />
            <span class="text-gray-600">Grant admin access</span>
          </label>

          <p v-if="error" class="col-span-2 text-red-600 text-xs">{{ error }}</p>
        </form>

        <!-- ACTIONS -->
        <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" @click="emit('close')" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer">Cancel</button>
          <button type="button" @click="save" :disabled="saving" class="px-4 py-2 rounded-lg bg-[#07407B] text-white hover:opacity-80 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {{ saving ? 'Saving…' : 'Add Agent' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { genealogyService, type GenealogyAgent } from '@/services/genealogyService'
import { positionMap, getAge } from '@/assets/classes/agent'

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const today = new Date().toISOString().slice(0, 10)

const form = ref({
  first_name: '',
  middle_name: '',
  last_name: '',
  sex: '',
  birth_date: '',
  hire_date: today,
  contact_number: '',
  email_address: '',
  home_address: '',
  position_ID: null as number | null,
  admin_access: false,
})

const uplineId = ref<number | null>(null)
const agents = ref<GenealogyAgent[]>([])
const saving = ref(false)
const error = ref('')

// Any existing agent can be an upline.
const uplineOptions = computed(() => agents.value)

onMounted(async () => {
  try {
    agents.value = await genealogyService.getAgents()
  } catch {
    // non-fatal: dropdown just stays empty (first agent has no possible upline anyway)
  }
})

async function save() {
  error.value = ''
  if (!form.value.first_name || !form.value.last_name || !form.value.position_ID) {
    error.value = 'First name, last name and position are required.'
    return
  }

  saving.value = true
  try {
    const payload = {
      ...form.value,
      middle_name: form.value.middle_name || null,
      age: getAge(form.value.birth_date), // derived; agents.age is NOT NULL
      user_id: null, // login attached later via Supabase invite
    }
    await genealogyService.addAgent(payload, uplineId.value ?? undefined)
    emit('saved')
  } catch (e: any) {
    console.error('Add agent failed:', e)
    error.value = e?.message || 'Failed to add agent. You may not have permission.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.form-input {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px 10px;
  outline: none;
}
.form-input:focus {
  border-color: #07407b;
}
</style>
