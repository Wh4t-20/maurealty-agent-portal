<template>
  <div 
    class="min-h-screen w-screen m-0 p-6 box-border flex items-center justify-center bg-cover bg-center bg-no-repeat font-[Arial,sans-serif]"
    :style="{ backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 30%, rgba(255, 255, 255, 0.1) 100%), linear-gradient(0deg, rgba(0, 77, 122, 0.9) 0%, rgba(0, 77, 122, 0.6) 80%, rgba(0, 77, 122, 0.1) 100%), url('/src/assets/images/LoginFormBG.png')` }"
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

          <button 
            type="submit" 
            :disabled="isLoading"
            class="w-full p-3.25 mt-1 border-none rounded-[10px] bg-[#27ae60] text-white text-[1rem] font-semibold cursor-pointer transition-[background,transform] duration-200 hover:bg-[#219150] hover:-translate-y-px disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Signing In...' : 'Sign In' }}
          </button>

          <div class="flex items-center gap-2 mt-4 text-[#4b5563] text-[0.95rem]">
            <input id="rememberMe" type="checkbox" v-model="rememberMe" />
            <label for="rememberMe">Remember Email</label>
          </div>

          <div class="text-center mt-4.5 text-[0.9rem]">
            <a href="#" class="text-[#27ae60] no-underline hover:underline">Data Privacy Act</a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabaseClient'

import defaultSettings from '@/assets/defaultSettings.json'

const router = useRouter()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error) {
      errorMessage.value = error.message
      return
    }

    console.log("Logging in...")

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
        console.log('Fetch successful! Applying configs into local storage!');
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