<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-60 flex items-center justify-center bg-[rgba(10,61,98,0.7)] backdrop-blur-sm p-4" @click.self="close">
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        class="w-full max-w-md bg-white dark:bg-black rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-transparent dark:border-gray-800 focus:outline-none font-['Poppins']"
        @keydown.esc.stop="close"
      >
        <!-- HEADER -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 :id="titleId" class="flex items-center gap-2 text-xl font-bold text-maurealty-blue dark:text-maurealty-light-blue">
            <KeyRound class="w-5 h-5" aria-hidden="true" /> Change Password
          </h2>
          <button type="button" class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none cursor-pointer" aria-label="Close" @click="close">✕</button>
        </div>

        <!-- STEPS: 1 Email · 2 Code · 3 New password -->
        <ol v-if="step !== 'done'" class="flex items-center gap-2 px-6 pt-4 text-[11px] font-semibold uppercase tracking-wide">
          <li v-for="(s, i) in steps" :key="s.id" class="flex items-center gap-2">
            <span
              class="flex items-center justify-center w-5 h-5 rounded-full text-[10px]"
              :class="stepIndex > i ? 'bg-maurealty-green text-white'
                : stepIndex === i ? 'bg-maurealty-blue text-white dark:bg-maurealty-light-blue dark:text-maurealty-blue'
                : 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'"
            >{{ stepIndex > i ? '✓' : i + 1 }}</span>
            <span :class="stepIndex === i ? 'text-maurealty-blue dark:text-maurealty-light-blue' : 'text-gray-400 dark:text-gray-500'">{{ s.label }}</span>
            <span v-if="i < steps.length - 1" class="w-4 h-px bg-gray-300 dark:bg-gray-700" aria-hidden="true"></span>
          </li>
        </ol>

        <div class="px-6 py-4 flex flex-col gap-3 text-sm overflow-y-auto">

          <!-- 1) EMAIL -->
          <form v-if="step === 'email'" class="flex flex-col gap-3" @submit.prevent="sendCode">
            <p class="text-gray-600 dark:text-gray-300">
              {{ lockEmail
                ? 'We will send a one-time code to the email you sign in with.'
                : 'Enter the email you sign in with. We will send a one-time code to it.' }}
            </p>
            <label class="flex flex-col gap-1">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Email</span>
              <input
                ref="firstInput"
                v-model.trim="emailInput"
                type="email"
                autocomplete="username"
                maxlength="254"
                spellcheck="false"
                :readonly="lockEmail || busy"
                :class="[inputClass, lockEmail ? 'opacity-70 cursor-not-allowed' : '']"
              />
            </label>
            <button type="submit" :disabled="busy || !emailInput" :class="primaryButton">
              {{ busy ? 'Sending…' : 'Send code' }}
            </button>
          </form>

          <!-- 2) CODE -->
          <form v-else-if="step === 'code'" class="flex flex-col gap-3" @submit.prevent="verifyCode">
            <p class="text-gray-600 dark:text-gray-300">
              If <b class="text-gray-800 dark:text-gray-100 break-all">{{ email }}</b> has an account, a code is on its way.
              Enter it below. Check the spam folder if you can't find the email.
            </p>
            <label class="flex flex-col gap-1">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-300">One-time code</span>
              <input
                ref="firstInput"
                :value="code"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="10"
                placeholder="••••••"
                :readonly="busy"
                :class="[inputClass, 'text-center text-lg tracking-[0.4em] font-semibold']"
                @input="onCodeInput"
              />
            </label>
            <button type="submit" :disabled="busy || code.length < 6" :class="primaryButton">
              {{ busy ? 'Checking…' : 'Verify code' }}
            </button>
            <div class="flex items-center justify-between text-xs">
              <button v-if="!lockEmail" type="button" class="text-gray-500 dark:text-gray-400 hover:underline cursor-pointer" :disabled="busy" @click="restart">
                Use a different email
              </button>
              <span v-else></span>
              <button type="button" class="text-maurealty-green font-medium hover:underline cursor-pointer disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                      :disabled="busy || cooldown > 0" @click="sendCode">
                {{ cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code' }}
              </button>
            </div>
          </form>

          <!-- 3) NEW PASSWORD -->
          <form v-else-if="step === 'password'" class="flex flex-col gap-3" @submit.prevent="savePassword">
            <!-- Hidden username field so password managers save the new password for the right account -->
            <input type="email" :value="email" autocomplete="username" class="hidden" tabindex="-1" aria-hidden="true" readonly />
            <p class="text-gray-600 dark:text-gray-300">Code verified. Choose a new password.</p>

            <label class="flex flex-col gap-1">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-300">New password</span>
              <div class="relative">
                <input ref="firstInput" v-model="newPassword" :type="showNew ? 'text' : 'password'" autocomplete="new-password"
                       :maxlength="MAX_PASSWORD_LENGTH" :readonly="busy" :class="[inputClass, 'pr-11']" />
                <button type="button" class="absolute inset-y-0 right-0 px-3 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 cursor-pointer"
                        :aria-label="showNew ? 'Hide password' : 'Show password'" @click="showNew = !showNew">
                  <EyeOff v-if="showNew" class="w-4 h-4" /><Eye v-else class="w-4 h-4" />
                </button>
              </div>
            </label>

            <label class="flex flex-col gap-1">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Confirm new password</span>
              <div class="relative">
                <input v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" autocomplete="new-password"
                       :maxlength="MAX_PASSWORD_LENGTH" :readonly="busy" :class="[inputClass, 'pr-11']" />
                <button type="button" class="absolute inset-y-0 right-0 px-3 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 cursor-pointer"
                        :aria-label="showConfirm ? 'Hide password' : 'Show password'" @click="showConfirm = !showConfirm">
                  <EyeOff v-if="showConfirm" class="w-4 h-4" /><Eye v-else class="w-4 h-4" />
                </button>
              </div>
            </label>

            <!-- Live checklist -->
            <ul class="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-xs" aria-live="polite">
              <li v-for="rule in checklist" :key="rule.id" class="flex items-center gap-1.5"
                  :class="rule.ok ? 'text-maurealty-green' : 'text-gray-500 dark:text-gray-400'">
                <Check v-if="rule.ok" class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <X v-else class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {{ rule.label }}
              </li>
            </ul>

            <button type="submit" :disabled="busy || !canSave" :class="primaryButton">
              {{ busy ? 'Saving…' : 'Change password' }}
            </button>
          </form>

          <!-- DONE -->
          <div v-else class="flex flex-col items-center text-center gap-3 py-4">
            <span class="flex items-center justify-center w-12 h-12 rounded-full bg-green-50 dark:bg-green-950/40 text-maurealty-green">
              <ShieldCheck class="w-6 h-6" aria-hidden="true" />
            </span>
            <p class="text-base font-semibold text-gray-800 dark:text-gray-100">Your password has been changed.</p>
            <p class="text-gray-600 dark:text-gray-300">
              {{ signOutWhenDone ? 'Sign in with your new password.' : 'Use it the next time you sign in.' }}
            </p>
            <button type="button" :class="[primaryButton, 'w-full']" @click="finish">Done</button>
          </div>

          <p v-if="error" class="text-red-600 dark:text-red-400 text-xs" role="alert">{{ error }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount, useId } from 'vue'
import { Check, Eye, EyeOff, KeyRound, ShieldCheck, X } from 'lucide-vue-next'
import { accountService } from '@/services/accountService'
import { authService } from '@/services/authService'
import { normalizeEmail, isValidEmail, digitsOnly } from '@/utils/sanitize'
import { MAX_PASSWORD_LENGTH, passwordRules, isStrongPassword } from '@/utils/password'

// Change a password with a one-time code sent by email (Supabase recovery OTP):
//   1) email -> accountService.sendPasswordCode
//   2) code  -> accountService.verifyPasswordCode (Supabase starts a session for that user)
//   3) new password -> accountService.changePassword
// Used on the Login page ("Forgot or change password?", signOutWhenDone) and from the Dashboard
// reminder (signed in, lockEmail = the agent's own login email).
const props = withDefaults(defineProps<{
  email?: string
  lockEmail?: boolean        // signed in: the code always goes to the agent's own email
  signOutWhenDone?: boolean  // login page: end the session the code started, then sign in again
}>(), {
  email: '',
  lockEmail: false,
  signOutWhenDone: false,
})
const emit = defineEmits<{ (e: 'close'): void; (e: 'changed', email: string): void }>()

type Step = 'email' | 'code' | 'password' | 'done'
const steps = [
  { id: 'email', label: 'Email' },
  { id: 'code', label: 'Code' },
  { id: 'password', label: 'New password' },
] as const

const titleId = useId()
const panel = ref<HTMLElement | null>(null)
const firstInput = ref<HTMLInputElement | null>(null)

const step = ref<Step>('email')
const stepIndex = computed(() => steps.findIndex(s => s.id === step.value))
const emailInput = ref(props.email)
const email = ref('')            // the cleaned email the code was sent to
const code = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showNew = ref(false)
const showConfirm = ref(false)
const busy = ref(false)
const error = ref('')
const verified = ref(false)      // a session exists from the code (cleaned up on the login page)

const inputClass =
  'w-full py-2.5 px-3 rounded-[10px] border border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark-gray ' +
  'text-gray-800 dark:text-gray-100 outline-none transition-[border-color,box-shadow] duration-200 ' +
  'focus:border-maurealty-green focus:shadow-[0_0_0_3px_rgba(39,174,96,0.15)]'
const primaryButton =
  'w-full py-2.5 rounded-[10px] bg-maurealty-green text-white font-semibold cursor-pointer transition hover:opacity-90 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed'

const checklist = computed(() => [
  ...passwordRules(newPassword.value),
  { id: 'match', label: 'Both passwords match', ok: newPassword.value.length > 0 && newPassword.value === confirmPassword.value },
])
const canSave = computed(() => isStrongPassword(newPassword.value) && newPassword.value === confirmPassword.value)

// Resend cooldown (Supabase allows one code per email about every 60 seconds).
const cooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | undefined
function startCooldown(seconds = 60) {
  cooldown.value = seconds
  clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    cooldown.value = Math.max(0, cooldown.value - 1)
    if (cooldown.value === 0) clearInterval(cooldownTimer)
  }, 1000)
}

// Focus the first field of each step.
watch(step, () => nextTick(() => (firstInput.value ?? panel.value)?.focus()))
onMounted(() => nextTick(() => (firstInput.value ?? panel.value)?.focus()))
onBeforeUnmount(() => clearInterval(cooldownTimer))

function onCodeInput(e: Event) {
  const input = e.target as HTMLInputElement
  code.value = digitsOnly(input.value, 10) // digits only, whatever is pasted
  input.value = code.value
}

async function sendCode() {
  error.value = ''
  const cleaned = normalizeEmail(props.lockEmail ? props.email : emailInput.value)
  if (!isValidEmail(cleaned)) {
    error.value = 'Enter a valid email address.'
    return
  }
  busy.value = true
  try {
    await accountService.sendPasswordCode(cleaned)
    email.value = cleaned
    code.value = ''
    step.value = 'code'
    startCooldown()
  } catch (e: any) {
    error.value = e?.message || 'Could not send the code.'
  } finally {
    busy.value = false
  }
}

async function verifyCode() {
  error.value = ''
  if (code.value.length < 6) {
    error.value = 'Enter the full code from the email.'
    return
  }
  busy.value = true
  try {
    await accountService.verifyPasswordCode(email.value, code.value)
    verified.value = true
    step.value = 'password'
  } catch (e: any) {
    error.value = e?.message || 'Could not verify the code.'
  } finally {
    busy.value = false
  }
}

async function savePassword() {
  error.value = ''
  if (!canSave.value) {
    error.value = 'The new password does not meet every rule yet.'
    return
  }
  busy.value = true
  try {
    await accountService.changePassword(newPassword.value)
    // Don't keep the password in memory longer than needed.
    newPassword.value = ''
    confirmPassword.value = ''
    if (props.signOutWhenDone) await endCodeSession()
    step.value = 'done'
  } catch (e: any) {
    error.value = e?.message || 'Could not change the password.'
  } finally {
    busy.value = false
  }
}

// On the login page the code signs the user in; end that session so they sign in normally.
async function endCodeSession() {
  if (!props.signOutWhenDone || !verified.value) return
  verified.value = false
  await authService.logoutUser()
}

function restart() {
  error.value = ''
  code.value = ''
  step.value = 'email'
}

function finish() {
  emit('changed', email.value)
}

async function close() {
  if (busy.value) return
  if (step.value === 'done') {
    finish()
    return
  }
  await endCodeSession() // closed halfway on the login page: don't leave a session behind
  emit('close')
}
</script>
