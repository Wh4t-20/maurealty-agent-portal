<template>
  <aside
    class=" top-0 left-0 h-screen bg-maurealty-blue 
            flex flex-col py-6 shadow-lg
            transition-all duration-300
            w-20 hover:w-90 group overflow-hidden sticky"
  >
  <router-link to="/profile" class="flex flex-col items-center">
    <img src="@/assets/images/Maurealty.png" alt="MauRealty Logo" class="w-3/5 h-auto " />
    <img :src="profileImage" alt="Agent"
      class="w-3/7 aspect-square object-cover rounded-full outline-2 outline-white m-3" />

    <span class="flex items-center gap-1.5">
      <p class="group-hover:text-xl text-0 opacity-0 group-hover:opacity-100 transition whitespace-nowrap text-white text-[clamp(0.5rem,2vw,1rem)]">
        {{ agentName }}
      </p>
      <img v-if="isAdmin" :src="MauBadgeLight" alt="Admin Badge" class="opacity-0 group-hover:opacity-100 size-4.75 transition whitespace-nowrap"/>
    </span>
    

    <p class="group-hover:text-xl text-0 opacity-0 group-hover:opacity-100 transition whitespace-nowrap text-white mb-3">
      {{ agentPosition }}
    </p>
  </router-link>
  
    <!-- TOP NAV -->

    <div class="flex flex-col overflow-y-auto space-y-2 px-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">      <router-link
        v-for="item in topItems"
        :key="item.id"
        :to="item.path"
        class="flex items-center  text-white text-[clamp(0.5rem,2vw,1rem)] font-light
                p-3 rounded-lg hover:bg-[#2A3242] transition"
      >
        <component :is="item.icon" class="w-6 h-5 shrink-0 " :stroke-width="1"  />
        <!-- LABEL -->
        <span
          class="ml-4 whitespace-nowrap opacity-0 
                  group-hover:opacity-100 transition"
        >
          {{ item.label }}
        </span>
      </router-link>
    </div>

    <!-- LOGOUT -->
    <div class="mt-auto px-3">
      <button
        @click="handleLogout"
        class="flex items-center text-white
                p-3 rounded-lg hover:bg-[#2A3242] transition cursor-pointer group"
      >
        <LogOut class="w-7 h-7 shrink-0" :stroke-width="1"/>

        <span
          class="ml-4 whitespace-nowrap opacity-0 text-[clamp(0.5rem,2vw,1rem) font-light
                  group-hover:opacity-100 transition"
        >
          Logout
        </span>
      </button>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '@/services/authService';
import { agentService } from '@/services/agentService';
import { positionMap } from '@/assets/classes/agent';
import placeholder from '@/assets/images/default_placeholder.png';
import MauBadgeLight from '@/assets/images/MauBadgeLight.svg'

const router = useRouter();
const agent = ref<any>(null);

import {
  LayoutDashboard,
  LayoutList,
  Calculator,
  Ticket,
  Mail,
  Trophy,
  ContactRound,
  LogOut,
  SquareChartGantt,
  Network,
  ReceiptText
} from "lucide-vue-next";

// fetch current Agent profile data
onMounted(async () => {
  agent.value = await agentService.getCurrentAgentProfile();
});

const agentName = computed(() => {
  if (!agent.value) return 'Loading...';
  return `${agent.value.first_name} ${agent.value.last_name}`;
});

const agentPosition = computed(() => {
  if (!agent.value) return '';
  return positionMap[agent.value.position_ID] || 'N/A';
});

const profileImage = computed(() => {
  return agent.value?.profile_url || placeholder;
});

const isAdmin = computed(() => {
  return agent.value?.admin_access || false;
});

  const topItems = [
    { id: 1, icon: LayoutDashboard, path: "/dashboard", label: "Dashboard" },
    { id: 2, icon: LayoutList, path: "/listings", label: "Project Listing" },
    { id: 3, icon: Calculator, path: "/accounting", label: "Accounting" },
    { id: 9, icon: ReceiptText, path: "/sales", label: "Sales Report" },
    // { id: 4, icon: Ticket, path: "/voucher", label: "Voucher" },
    // { id: 5, icon: Mail, path: "/inbox", label: "Inbox" },
    // { id: 6, icon: Trophy, path: "/leaderboards", label: "Leaderboards" },
    { id: 7, icon: ContactRound, path: "/developerlist", label: "Developer List" },
    { id: 8, icon: SquareChartGantt, path: "/propertymanagement", label: "Property Management"},
    { id: 9, icon: Network, path: "/genealogy", label: "Genealogy" }


  ];

  const handleLogout = async () => {
    // Send the logout request to Supabase via our service
    const response = await authService.logoutUser();

    //  Evaluate the response
    if (response.success) {
      // If successful, push the user back to the login screen
      router.push('/');
    } else {
      alert('Failed to log out: ' + response.error);
    }
  };

  
  </script>
  