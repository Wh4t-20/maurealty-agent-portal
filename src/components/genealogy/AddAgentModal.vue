<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,61,98,0.7)] backdrop-blur-sm p-4" @click.self="close">
      <div class="w-full max-w-2xl bg-white dark:bg-black rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-transparent dark:border-gray-800">

        <!-- HEADER -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 class="text-xl font-bold text-[#07407B] dark:text-maurealty-light-blue">{{ title }}</h2>
          <button class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none cursor-pointer" aria-label="Close" @click="close">✕</button>
        </div>

        <!-- DONE: the login exists; show the email and password to hand over to the agent -->
        <div v-if="created" class="px-6 py-5 overflow-y-auto flex flex-col gap-4 text-sm">
          <div class="flex items-start gap-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4 text-green-900 dark:text-green-100">
            <ShieldCheck class="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              Login created for <b>{{ created.name }}</b>. Give them this email and password.
              The Dashboard will remind them to change the password after they sign in.
            </p>
          </div>

          <div class="flex flex-col gap-1">
            <span class="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-200">
              <CircleAlert class="w-4 h-4 text-red-600 dark:text-red-400" aria-hidden="true" /> Login email
            </span>
            <div class="px-3 py-2 rounded-lg border-2 border-amber-400 dark:border-amber-600 bg-white dark:bg-background-dark-gray text-gray-800 dark:text-gray-100 break-all">
              {{ created.email }}
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <span class="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-200">
              <CircleAlert class="w-4 h-4 text-red-600 dark:text-red-400" aria-hidden="true" /> Initial password
            </span>
            <PasswordReveal :value="created.password" />
            <span class="text-xs text-gray-500 dark:text-gray-400">
              Admins can reveal it later from Edit Agent, until the agent changes it.
            </span>
          </div>
        </div>

        <!-- FORM -->
        <!-- One column on phones, two columns on bigger screens -->
        <form v-else class="px-6 py-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm" @submit.prevent="save">

          <!-- LOGIN ACCOUNT: flagged because a wrong email or a lost password locks the agent out -->
          <section class="sm:col-span-2 flex flex-col gap-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4">
            <div class="flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <TriangleAlert class="w-4 h-4 shrink-0" aria-hidden="true" />
              <h3 class="text-xs font-bold uppercase tracking-wide">Login account · Important</h3>
            </div>
            <p class="text-xs text-amber-900/80 dark:text-amber-100/80">
              The agent signs in with this email and password, and password-change codes are sent to this email. Double-check both before saving.
            </p>

            <!-- Email -->
            <label class="flex flex-col gap-1">
              <span class="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-200">
                <CircleAlert class="w-4 h-4 text-red-600 dark:text-red-400" aria-hidden="true" />
                Email *
              </span>
              <input type="email" v-model.trim="form.email_address" required maxlength="254" autocomplete="off" spellcheck="false"
                     class="form-input important-input" />
            </label>

            <!-- Initial password (new agent): <initials><random>, 14 characters -->
            <div v-if="!isEdit" class="flex flex-col gap-1">
              <span class="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-200">
                <CircleAlert class="w-4 h-4 text-red-600 dark:text-red-400" aria-hidden="true" />
                Initial password *
              </span>
              <PasswordReveal :value="initialPassword" regenerable @regenerate="regeneratePassword" />
              <span class="text-xs text-gray-500 dark:text-gray-400">
                Generated: the agent's initials followed by random characters ({{ INITIAL_PASSWORD_LENGTH }} in total). Give it to the agent; they will be asked to change it.
              </span>
            </div>
          </section>

          <label class="flex flex-col gap-1">
            <span class="text-gray-500 dark:text-gray-400">First name *</span>
            <input v-model.trim="form.first_name" required maxlength="100" class="form-input" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500 dark:text-gray-400">Middle name</span>
            <input v-model.trim="form.middle_name" maxlength="100" class="form-input" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500 dark:text-gray-400">Last name *</span>
            <input v-model.trim="form.last_name" required maxlength="100" class="form-input" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500 dark:text-gray-400">Sex *</span>
            <select v-model="form.sex" required class="form-input">
              <option value="">—</option>
              <option v-for="s in sexes" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500 dark:text-gray-400">Birth date *</span>
            <input type="date" v-model="form.birth_date" required :max="today" class="form-input" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500 dark:text-gray-400">Hire date *</span>
            <input type="date" v-model="form.hire_date" required class="form-input" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500 dark:text-gray-400">Contact number *</span>
            <input v-model.trim="form.contact_number" required maxlength="30" inputmode="tel" class="form-input" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500 dark:text-gray-400">Position *</span>
            <select v-model.number="form.position_ID" required class="form-input">
              <option :value="null">—</option>
              <option v-for="(label, id) in positionMap" :key="id" :value="Number(id)">{{ label }}</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 sm:col-span-2">
            <span class="text-gray-500 dark:text-gray-400">Home address *</span>
            <input v-model.trim="form.home_address" required maxlength="500" class="form-input" />
          </label>
          <label class="flex flex-col gap-1 sm:col-span-2">
            <span class="text-gray-500 dark:text-gray-400">Upline (sponsor)</span>
            <select v-model.number="uplineId" class="form-input" :disabled="selectedRank === 'broker'">
              <option :value="null">— none (team root) —</option>
              <option v-for="a in uplineOptions" :key="a.agent_ID" :value="a.agent_ID">
                {{ a.first_name }} {{ a.last_name }} ({{ rankText(a) }})
              </option>
            </select>
            <span class="text-xs text-gray-400">{{ uplineHint }}</span>
          </label>
          <label class="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" v-model="form.admin_access" />
            <span class="text-gray-600 dark:text-gray-300">Grant admin access</span>
          </label>

          <p v-if="error" class="sm:col-span-2 text-red-600 dark:text-red-400 text-xs" role="alert">{{ error }}</p>
        </form>

        <!-- ACTIONS -->
        <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <template v-if="created">
            <button type="button" @click="copyDetails" class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              {{ copiedDetails ? 'Copied!' : 'Copy login details' }}
            </button>
            <button type="button" @click="close" class="px-4 py-2 rounded-lg bg-[#07407B] text-white hover:opacity-80 transition cursor-pointer">Done</button>
          </template>
          <template v-else>
            <button type="button" @click="close" :disabled="saving" class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
            <button type="button" @click="save" :disabled="saving" class="px-4 py-2 rounded-lg bg-[#07407B] text-white hover:opacity-80 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {{ saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Add Agent') }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { CircleAlert, ShieldCheck, TriangleAlert } from 'lucide-vue-next'
import PasswordReveal from '@/components/genealogy/PasswordReveal.vue'
import { genealogyService, type GenealogyAgent, type AgentDetail } from '@/services/genealogyService'
import { positionMap, getAge } from '@/assets/classes/agent'
import { rankOf, rankLabel, allowedUplineRanks } from '@/utils/ranks'
import { cleanText, normalizeEmail, isValidEmail, isValidPhone, isIsoDate } from '@/utils/sanitize'
import { INITIAL_PASSWORD_LENGTH, agentInitials, buildInitialPassword, generatePasswordTail } from '@/utils/password'
import defaultSettings from '@/assets/defaultSettings.json'

// `agent` present = edit mode (prefill + update); absent = add mode.
// Add mode also creates the agent's login (Supabase Auth user) with a generated initial password.
const props = defineProps<{ agent?: AgentDetail | null }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const isEdit = computed(() => props.agent != null)

const today = new Date().toISOString().slice(0, 10)
const sexes = ['Male', 'Female', 'Non-Binary', 'Other'] // same choices as ProfileEdit

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
const originalUplineId = ref<number | null>(null) // to detect upline changes on edit
const agents = ref<GenealogyAgent[]>([])
const saving = ref(false)
const error = ref('')

// ---------- Initial password ----------
// "<initials><random>", 14 characters. The random part stays the same while the admin types the
// name (only the initials in front change) until "regenerate" is pressed.
const passwordTail = ref(generatePasswordTail())
const initialPassword = computed(() => buildInitialPassword(
  agentInitials(form.value.first_name, form.value.middle_name, form.value.last_name),
  passwordTail.value,
))
function regeneratePassword() {
  passwordTail.value = generatePasswordTail()
}

// Set once a login is created: the modal then shows the email and password to hand over.
const created = ref<{ name: string; email: string; password: string } | null>(null)
const copiedDetails = ref(false)

const title = computed(() => created.value ? 'Login Created' : isEdit.value ? 'Edit Agent' : 'Add Agent')

// Any existing agent can be an upline, except the agent being edited (no self-parent).
// The position chosen decides who can be the upline: a Partner Broker has none, an Investment
// Manager can only report to a Partner Broker.
const selectedRank = computed(() => rankOf(form.value.position_ID != null ? positionMap[form.value.position_ID] : null, form.value.position_ID))
const rankText = (a: GenealogyAgent) => rankLabel(rankOf(a.position, a.position_ID))
const uplineOptions = computed(() => {
  const allowed = allowedUplineRanks(selectedRank.value)
  return agents.value.filter((a) =>
    (!isEdit.value || a.agent_ID !== props.agent!.agent_ID) &&
    allowed.includes(rankOf(a.position, a.position_ID)),
  )
})
const uplineHint = computed(() =>
  selectedRank.value === 'broker' ? 'A Partner Broker has no upline.'
  : selectedRank.value === 'investment_manager' ? 'An Investment Manager can only report to a Partner Broker.'
  : isEdit.value ? 'Changing to Investment Manager detaches this agent from a non-broker upline.' : '',
)

// Drop an upline that the chosen position no longer allows.
watch(selectedRank, () => {
  if (uplineId.value != null && !uplineOptions.value.some(a => a.agent_ID === uplineId.value)) uplineId.value = null
})

onMounted(async () => {
  try {
    agents.value = await genealogyService.getAgents()
  } catch {
    // non-fatal: dropdown just stays empty (first agent has no possible upline anyway)
  }

  if (props.agent) {
    const a = props.agent
    form.value = {
      first_name: a.first_name,
      middle_name: a.middle_name ?? '',
      last_name: a.last_name,
      sex: a.sex,
      birth_date: a.birth_date,
      hire_date: a.hire_date,
      contact_number: a.contact_number,
      email_address: a.email_address,
      home_address: a.home_address,
      position_ID: a.position_ID,
      admin_access: a.admin_access,
    }
    try {
      const chain = await genealogyService.getUplineChain(a.agent_ID, 1)
      uplineId.value = chain[0]?.agent_ID ?? null
    } catch {
      uplineId.value = null
    }
    originalUplineId.value = uplineId.value
  }
})

// Cleans every field (trim, no control characters, length caps, lower-case email) and returns the
// first problem found. Values reach the database as bound parameters through supabase-js, and the
// agent-account Edge Function checks them again on the server.
function cleanForm() {
  const f = form.value
  const values = {
    first_name: cleanText(f.first_name, 100),
    middle_name: cleanText(f.middle_name, 100) || null,
    last_name: cleanText(f.last_name, 100),
    sex: sexes.includes(f.sex) ? f.sex : '',
    birth_date: f.birth_date,
    hire_date: f.hire_date,
    contact_number: cleanText(f.contact_number, 30),
    email_address: normalizeEmail(f.email_address),
    home_address: cleanText(f.home_address, 500),
    position_ID: f.position_ID,
    admin_access: !!f.admin_access,
  }

  let problem = ''
  if (!values.first_name || !values.last_name) problem = 'First name and last name are required.'
  else if (!isValidEmail(values.email_address)) problem = 'Enter a valid email address. The agent signs in with it.'
  else if (!values.sex) problem = 'Choose the sex.'
  else if (!isIsoDate(values.birth_date) || values.birth_date > today || getAge(values.birth_date) > 120) problem = 'Enter a valid birth date.'
  else if (!isIsoDate(values.hire_date)) problem = 'Enter a valid hire date.'
  else if (!isValidPhone(values.contact_number)) problem = 'The contact number can only have digits, spaces and + ( ) - .'
  else if (!values.home_address) problem = 'Home address is required.'
  else if (!values.position_ID) problem = 'Choose a position.'

  return { values, problem }
}

async function save() {
  error.value = ''
  const { values, problem } = cleanForm()
  if (problem) {
    error.value = problem
    return
  }

  saving.value = true
  try {
    if (isEdit.value) {
      const patch = {
        ...values,
        age: getAge(values.birth_date), // keep age consistent with birth_date
      }
      const { detached } = await genealogyService.updateAgentAndUpline(props.agent!.agent_ID, patch, uplineId.value)
      if (detached) alert('This agent was detached from their previous upline because of the new position.')
      emit('saved')
    } else {
      const payload = {
        ...values,
        age: getAge(values.birth_date), // derived; agents.age is NOT NULL (the server derives it again)
        configs: defaultSettings.configs, // agents.configs is NOT NULL with no default
      }
      // The password is read once here so the success screen shows exactly what was saved.
      const password = initialPassword.value
      const account = await genealogyService.addAgent(payload, uplineId.value ?? undefined, password)
      created.value = { name: `${values.first_name} ${values.last_name}`, email: account.email, password }
    }
  } catch (e: any) {
    console.error(isEdit.value ? 'Edit agent failed:' : 'Add agent failed:', e)
    error.value = e?.message || 'Failed to save agent. You may not have permission.'
  } finally {
    saving.value = false
  }
}

// Closing after a login was created still tells the parent to reload.
function close() {
  if (saving.value) return
  if (created.value) emit('saved')
  else emit('close')
}

async function copyDetails() {
  if (!created.value) return
  try {
    await navigator.clipboard.writeText(`Email: ${created.value.email}\nPassword: ${created.value.password}`)
    copiedDetails.value = true
    setTimeout(() => (copiedDetails.value = false), 1500)
  } catch {
    // Clipboard blocked by the browser: the details are still on screen.
  }
}
</script>

<style scoped>
.form-input {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px 10px;
  outline: none;
  background: #fff;
  color: #1f2937;
}
.form-input:focus {
  border-color: #07407b;
}
.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
/* Dark mode (html.dark, see App.vue) */
.dark .form-input {
  background: var(--color-background-dark-gray);
  border-color: #374151;
  color: #f3f4f6;
  color-scheme: dark;
}
.dark .form-input:focus {
  border-color: var(--color-maurealty-light-blue);
}
/* The login email is flagged as important */
.form-input.important-input {
  border: 2px solid #f59e0b;
}
.dark .form-input.important-input {
  border-color: #d97706;
}
</style>
