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

      <div class="w-full max-w-105 bg-white/80 rounded-2xl p-[32px_28px] box-border shadow-[0_20px_50px_rgba(0,0,0,0.25)] max-[480px]:p-[24px_18px] max-[480px]:rounded-xl">
        
        <form @submit.prevent="handleLogin">
          <h1 class="text-center m-0 mb-6 text-[1.6rem] font-bold text-[#111827] max-[480px]:text-[1.35rem]">LOGIN PORTAL</h1>

          <div class="mb-4">
            <input
              type="text"
              v-model="username"
              placeholder="Email"
              autocomplete="username"
              class="w-full p-[13px_14px] border border-[#d1d5db] rounded-[10px] box-border text-[1rem] text-[#111827] bg-white outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#27ae60] focus:shadow-[0_0_0_3px_rgba(39,174,96,0.15)]"
            />
          </div>

          <div class="mb-4">
            <input
              type="password"
              v-model="password"
              placeholder="Password"
              autocomplete="current-password"
              class="w-full p-[13px_14px] border border-[#d1d5db] rounded-[10px] box-border text-[1rem] text-[#111827] bg-white outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#27ae60] focus:shadow-[0_0_0_3px_rgba(39,174,96,0.15)]"
            />
          </div>

          <button 
            type="submit" 
            class="w-full p-3.25 mt-1 border-none rounded-[10px] bg-[#27ae60] text-white text-[1rem] font-semibold cursor-pointer transition-[background,transform] duration-200 hover:bg-[#219150] hover:-translate-y-px"
          >
            Sign In
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

const router = useRouter()

const username = ref('')
const password = ref('')
const rememberMe = ref(false)

const handleLogin = () => {
  router.push('/dashboard')
}
</script>