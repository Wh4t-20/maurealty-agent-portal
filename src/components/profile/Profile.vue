<template>
  <div class="min-h-screen bg-gray-200">
    <header class="w-full bg-linear-to-r from-[#A9D6FF70] to-white shadow-md sticky top-0 z-20">
        <div class="flex justify-between items-center px-10 py-10">
          <h1 class="text-3xl font-bold text-maurealty-blue">
            PROFILE
          </h1>
        </div>
    </header>

    <div v-if="isLoading" class="flex justify-center items-center mt-20">
      <p class="text-xl font-medium text-gray-600">Loading profile data...</p>
    </div>

    <div v-else-if="agent" class="flex flex-col items-center justify-center gap-4 p-6 mt-10">
      <div class="bg-gray-100 w-full max-w-7xl rounded-2xl shadow-md p-10 flex gap-10">
        <div class="relative flex items-center justify-center">
          <img
            :src="agent.profile_url || placeholder"
            alt="Profile"
            class="w-80 h-80 object-cover rounded-full border-4 border-white shadow"
          />
        </div>

        <div class="flex-1 space-y-3">
          <div class="mt-5 grid grid-cols-3 gap-5">
            <div class="col-span-full">
              <label class="text-maurealty-blue font-medium text-sm block">Last Name, First Name, Middle Name</label>
                <span class="flex items-center gap-2.5">
                <p class="w-auto font-medium text-lg tracking-wider uppercase">
                  {{ agent.last_name }}, {{ agent.first_name }} {{ agent.middle_name || '' }}
                </p>
                <img
                  v-if="agent.admin_access"
                  :src="MauBadgeDark" 
                  alt="Admin Access Enabled"
                  class="size-6 border-0"  
                />
              </span>
            </div>          

            <div>
              <label class="text-maurealty-blue font-medium text-sm block">Sex</label>
              <p class="w-full font-medium text-base tracking-wider uppercase">
                {{ agent.sex }}
              </p>
            </div>

            <div>
              <label class="text-maurealty-blue font-medium text-sm block">Age</label>
              <p class="w-full font-medium text-base tracking-wider">
                {{ agent.age }}
              </p>
            </div>

            <div>
              <label class="text-maurealty-blue font-medium text-sm block">Date of Birth</label>
              <p class="w-full font-medium text-base tracking-wider uppercase">
                {{ formatDate(agent.birth_date) }}
              </p>
            </div>

            <div class="col-span-full">
              <label class="text-maurealty-blue font-medium text-sm block">Address</label>
              <p class="w-full font-normal text-base tracking-wider uppercase">
                {{ agent.home_address }}
              </p>
            </div>

            <div>
              <label class="text-maurealty-blue font-medium text-sm block">Contact No.</label>
              <p class="w-full font-normal text-base tracking-wider uppercase">
                {{ agent.contact_number }}
              </p>
            </div>

            <div class="col-span-2">
              <label class="text-maurealty-blue font-medium text-sm block">Email Address</label>
              <p class="w-full font-normal text-base tracking-wider">
                {{ agent.email_address }}
              </p>
            </div>

            <div>
              <label class="text-maurealty-blue font-medium text-sm block">Agent ID</label>
              <p class="w-full font-medium text-base tracking-wider uppercase">
                {{ agent.agent_ID }}
              </p>
            </div>

            <div>
              <label class="text-maurealty-blue font-medium text-sm block">Position</label>
              <p class="w-full font-medium text-base tracking-wider uppercase">
                {{ agent.positions?.position || 'N/A' }}
              </p>
            </div>

            <div>
              <label class="text-maurealty-blue font-medium text-sm block">Hire Date</label>
              <p class="w-full font-normal text-base tracking-wider uppercase">
                {{ formatDate(agent.hire_date) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="w-full max-w-7xl justify-items-end">
        <button @click="handleProfileEdit" class="flex flex-col items-center py-2 px-5 w-32 rounded-2xl border-2 border-maurealty-blue text-maurealty-blue font-bold hover:bg-maurealty-blue hover:text-white hover:shadow-md hover:-translate-y-0.75 transition cursor-pointer">
          <span class="flex items-center-safe gap-1"><SquarePen class="size-4" /> EDIT</span>
        </button>
      </div>
    </div>

    <div v-else class="flex justify-center items-center mt-20">
      <p class="text-xl font-medium text-red-600">Failed to load profile data.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { agentService } from '@/services/agentService'
import placeholder from '@/assets/images/default_placeholder.png'
import MauBadgeDark from '@/assets/images/MauBadgeDark.svg'
import { useRouter } from 'vue-router'

const agent = ref<any>(null)
const isLoading = ref(true)

// Fetch data when component mounts
onMounted(async () => {
  agent.value = await agentService.getCurrentAgentProfile()
  isLoading.value = false
})

const router = useRouter()

const handleProfileEdit = () => {
  router.push({
    path: '/profile/edit',
  });
};

// Format database date strings to readable text
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}
</script>

<style scoped>
</style>