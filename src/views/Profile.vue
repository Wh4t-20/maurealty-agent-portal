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

        <div v-else-if="agent" class="p-6 mt-10">
            <div v-if="!isEditing" class="flex flex-col items-center justify-center gap-4">
                <ProfileCard :agent="agent" />

                <div class="w-full max-w-7xl justify-items-end">
                    <button @click="isEditing = true" class="flex flex-col items-center py-2 px-5 w-32 rounded-2xl border-2 border-maurealty-blue text-maurealty-blue font-bold hover:bg-maurealty-blue hover:text-white hover:shadow-md hover:-translate-y-0.75 transition cursor-pointer">
                        <span class="flex items-center-safe gap-1"><SquarePen class="size-4" /> EDIT</span>
                    </button>
                </div>
            </div>

            <div v-else class="flex flex-col items-center justify-center">
                <ProfileEdit 
                    :agent="agent" 
                    @cancel="isEditing = false"
                />
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
import { SquarePen } from 'lucide-vue-next'
import ProfileCard from '@/components/profile/ProfileCard.vue'
import ProfileEdit from '@/components/profile/ProfileEdit.vue'

const agent = ref<any>(null)
const isLoading = ref(true)

// Fetch data when component mounts
onMounted(async () => {
  agent.value = await agentService.getCurrentAgentProfile()
  isLoading.value = false
})

const isEditing = ref(false)
</script>

<style scoped>
</style>