<template>
  <div 
    class="min-h-screen w-screen m-0 p-6 box-border flex items-center justify-center bg-cover bg-center bg-no-repeat font-[Arial,sans-serif] login-bg bg-cover bg-center"
  >
    <div class="w-full flex flex-col items-center -mt-30">
      
      <div class="flex justify-center items-center">
        <img 
          src="@/assets/images/maureal.png" 
          alt="Maurealty Logo" 
          class="w-105 max-w-full h-auto object-contain max-[480px]:w-37.5" 
        />
      </div>

      <div class="w-full max-w-105 bg-white/80 dark:bg-black/80 rounded-2xl p-[32px_28px] box-border shadow-[0_20px_50px_rgba(0,0,0,0.25)] max-[480px]:p-[24px_18px] max-[480px]:rounded-xl">
        
        <form @submit.prevent="handleLogin">
          <h1 class="text-center m-0 mb-6 text-[1.6rem] font-bold text-[#111827] dark:text-white max-[480px]:text-[1.35rem]">LOGIN PORTAL</h1>

          <div class="mb-4">
            <input
              type="text"
              v-model="email"
              placeholder="Email"
              autocomplete="email"
              class="w-full p-[13px_14px] border border-[#d1d5db] rounded-[10px] box-border text-[1rem] text-[#111827] dark:text-white bg-white dark:bg-black outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#27ae60] focus:shadow-[0_0_0_3px_rgba(39,174,96,0.15)]"
            />
          </div>

          <div class="mb-4">
            <input
              type="password"
              v-model="password"
              placeholder="Password"
              autocomplete="current-password"
              class="w-full p-[13px_14px] border border-[#d1d5db] rounded-[10px] box-border text-[1rem] text-[#111827] dark:text-white bg-white dark:bg-black outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#27ae60] focus:shadow-[0_0_0_3px_rgba(39,174,96,0.15)]"
            />
          </div>

          <p v-if="errorMessage" class="text-red-500 text-sm mb-3 text-center">{{ errorMessage }}</p>
          <p v-if="successMessage" class="text-[#27ae60] text-sm mb-3 text-center font-medium" role="status">{{ successMessage }}</p>

          <button 
            type="submit" 
            :disabled="isLoading"
            class="w-full p-3.25 mt-1 border-none rounded-[10px] bg-[#27ae60] text-white text-[1rem] font-semibold cursor-pointer transition-[background,transform] duration-200 hover:bg-[#219150] hover:-translate-y-px disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Signing In...' : 'Sign In' }}
          </button>

          <div class="flex flex-wrap items-center justify-between gap-2 mt-4 text-[#4b5563] dark:text-gray-300 text-[0.95rem]">
            <div class="flex items-center gap-2">
              <input id="rememberMe" type="checkbox" v-model="rememberMe" />
              <label for="rememberMe">Remember Email</label>
            </div>
            <!-- Opens the email-code flow (ChangePasswordModal) -->
            <button type="button" class="text-[#27ae60] text-[0.9rem] font-medium hover:underline cursor-pointer" @click="openChangePassword">
              Forgot or change password?
            </button>
          </div>

          <div class="text-center mt-4.5 text-[0.9rem]">
            <a href="#" class="text-[#27ae60] no-underline hover:underline">Data Privacy Act</a>
          </div>
        </form>
      </div>
    </div>

    <!-- Change password with a one-time code; ends the code's session so the user signs in again -->
    <ChangePasswordModal
      v-if="showChangePassword"
      :email="email"
      sign-out-when-done
      @close="showChangePassword = false"
      @changed="onPasswordChanged"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabaseClient'

import defaultSettings from '@/assets/defaultSettings.json'
import ChangePasswordModal from '@/components/auth/ChangePasswordModal.vue'
import { normalizeEmail, isValidEmail } from '@/utils/sanitize'

const router = useRouter()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)
const showChangePassword = ref(false)

const openChangePassword = () => {
  errorMessage.value = ''
  successMessage.value = ''
  showChangePassword.value = true
}

// Back from the change-password modal: prefill the email and ask for the new password.
const onPasswordChanged = (changedEmail: string) => {
  showChangePassword.value = false
  email.value = changedEmail
  password.value = ''
  successMessage.value = 'Password changed. Sign in with your new password.'
}

const handleLogin = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // Clean the email before it is sent (trimmed, lower case, valid format).
  // The password is sent exactly as typed: Supabase Auth compares it with the stored hash.
  const cleanEmail = normalizeEmail(email.value)
  if (!isValidEmail(cleanEmail) || !password.value) {
    errorMessage.value = 'Enter your email and password.'
    return
  }

  isLoading.value = true

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password.value,
    })

    if (error) {
      errorMessage.value = error.message
      return
    }


    if (data.user) {
      // for getting the config settings from Supabase 
      const { data: userConfigs, error: configError } = await supabase
        .from('agents') 
        .select('configs')
        .eq('user_id', data.user.id)
        .single();

      // decide which settings to use
      let finalConfigs;
      if (configError || !userConfigs) {
        console.warn('Could not fetch user settings, applying defaults.');
        finalConfigs = defaultSettings.configs;
      } else {
        // Merge fetched configs with defaults to ensure no keys are missing
        finalConfigs = { ...defaultSettings.configs, ...(userConfigs?.configs || {}) };
      }

      // store the configuration in localStorage for global app access
      localStorage.setItem('app_user_settings', JSON.stringify(finalConfigs));

      router.push('/dashboard')
    }
  } catch (err: any) {
    errorMessage.value = 'An unexpected error occurred.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Background photo under two gradients. It is a JPEG (about 290 kB); the original 2.4 MB PNG made
   the login page slow to appear on mobile data. The file name's case must match exactly. */

/* Light Mode (Default) */
.login-bg {
  background-image: 
    linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 30%, rgba(255, 255, 255, 0.1) 100%), 
    linear-gradient(0deg, rgba(0, 77, 122, 0.9) 0%, rgba(0, 77, 122, 0.6) 80%, rgba(0, 77, 122, 0.1) 100%), 
    url('/src/assets/images/LoginFormBg.jpg');
}

/* Dark Mode */
.dark .login-bg {
  background-image: 
    /* Swapped white for dark gray (Tailwind's gray-900) */
    linear-gradient(180deg, rgba(17, 24, 39, 0.95) 0%, rgba(17, 24, 39, 0.8) 30%, rgba(17, 24, 39, 0.2) 100%), 
    /* Darkened the blue tone */
    linear-gradient(0deg, rgba(0, 30, 55, 0.95) 0%, rgba(0, 30, 55, 0.8) 80%, rgba(0, 30, 55, 0.2) 100%), 
    url('/src/assets/images/LoginFormBg.jpg');
}
</style>