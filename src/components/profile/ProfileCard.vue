<template>
  <div class="bg-gray-100 w-full max-w-7xl rounded-2xl shadow-md p-10 flex gap-10">
    <div class="relative flex items-center justify-center">
      <img
        :src="props.agent.profile_url || placeholder"
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
              {{ props.agent.last_name }}, {{ props.agent.first_name }} {{ props.agent.middle_name || '' }}
            </p>
            <img
              v-if="props.agent.admin_access"
              :src="MauBadgeDark" 
              alt="Admin Access Enabled"
              class="size-6 border-0"  
            />
          </span>
        </div>          

        <div>
          <label class="text-maurealty-blue font-medium text-sm block">Sex</label>
          <p class="w-full font-medium text-base tracking-wider uppercase">
            {{ props.agent.sex }}
          </p>
        </div>

        <div>
          <label class="text-maurealty-blue font-medium text-sm block">Age</label>
          <p class="w-full font-medium text-base tracking-wider">
            {{ getAge(props.agent.birth_date) }}
          </p>
        </div>

        <div>
          <label class="text-maurealty-blue font-medium text-sm block">Date of Birth</label>
          <p class="w-full font-medium text-base tracking-wider uppercase">
            {{ formatDate(props.agent.birth_date) }}
          </p>
        </div>

        <div class="col-span-full">
          <label class="text-maurealty-blue font-medium text-sm block">Address</label>
          <p class="w-full font-normal text-base tracking-wider uppercase">
            {{ props.agent.home_address }}
          </p>
        </div>

        <div>
          <label class="text-maurealty-blue font-medium text-sm block">Contact No.</label>
          <p class="w-full font-normal text-base tracking-wider uppercase">
            {{ props.agent.contact_number }}
          </p>
        </div>

        <div class="col-span-2">
          <label class="text-maurealty-blue font-medium text-sm block">Email Address</label>
          <p class="w-full font-normal text-base tracking-wider">
            {{ props.agent.email_address }}
          </p>
        </div>

        <div>
          <label class="text-maurealty-blue font-medium text-sm block">Agent ID</label>
          <p class="w-full font-medium text-base tracking-wider uppercase">
            {{ props.agent.agent_ID }}
          </p>
        </div>

        <div>
          <label class="text-maurealty-blue font-medium text-sm block">Position</label>
          <p class="w-full font-medium text-base tracking-wider uppercase">
            {{ positionMap[props.agent.position_ID] || 'N/A' }}
          </p>
        </div>

        <div>
          <label class="text-maurealty-blue font-medium text-sm block">Hire Date</label>
          <p class="w-full font-normal text-base tracking-wider uppercase">
            {{ formatDate(props.agent.hire_date) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import placeholder from '@/assets/images/default_placeholder.png'
import MauBadgeDark from '@/assets/images/MauBadgeDark.svg'
import { type AgentProfile, positionMap, getAge } from '@/assets/classes/agent';

const props = defineProps<{ agent: AgentProfile }>()

// Format database date strings to readable text
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}
</script>

<style scoped>
</style>