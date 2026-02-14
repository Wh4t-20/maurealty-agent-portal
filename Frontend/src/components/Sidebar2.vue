<template>
    <aside
      class=" top-0 left-0 h-screen bg-maurealty-blue 
             flex flex-col py-6 shadow-lg
             transition-all duration-300
             w-20 hover:w-90 group overflow-hidden sticky"
    >
    <div class="flex flex-col items-center ">
        <img src="@/assets/images/Maurealty.png" alt="MauRealty Logo" class="w-3/5 h-auto " />
        <img src="@/assets/images/profile.png" alt="Agent" class="w-3/7 aspect-square object-cover rounded-full outline-2 outline-white m-3" />
        <p class="group-hover:text-xl  text-0 opacity-0 group-hover:opacity-100 transition whitespace-nowrap text-white text-[clamp(0.5rem,2vw,1rem)"> Carl Santillan</p>
        <p class="group-hover:text-xl  text-0 opacity-0 group-hover:opacity-100  transition  whitespace-nowrap text-white mb-3">Emerald</p>
      </div>
      <!-- TOP NAV -->
      <div class="flex flex-col  space-y-2 px-3">
        <router-link
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
        <router-link
          :to="logoutItem.path"
          class="flex items-center text-white
                 p-3 rounded-lg hover:bg-[#2A3242] transition"
        >
          <component :is="logoutItem.icon" class="w-7 h-7 shrink-0" :stroke-width="1"/>
  
          <span
            class="ml-4 whitespace-nowrap opacity-0 text-[clamp(0.5rem,2vw,1rem) font-light
                   group-hover:opacity-100 transition"
          >
            Logout
          </span>
        </router-link>
      </div>
    </aside>
  </template>
  
  <script lang="ts" setup>
  import {
    LayoutDashboard,
    LayoutList,
    Calculator,
    Ticket,
    Mail,
    Trophy,
    ContactRound, 
    LogOut
  } from "lucide-vue-next";
  
  const topItems = [
    { id: 1, icon: LayoutDashboard, path: "/dashboard", label: "Dashboard" },
    { id: 2, icon: LayoutList, path: "/listings", label: "Project Listing" },
    { id: 3, icon: Calculator, path: "/accounting", label: "Accounting" },
    { id: 4, icon: Ticket, path: "/voucher", label: "Voucher" },
    { id: 5, icon: Mail, path: "/inbox", label: "Inbox" },
    { id: 6, icon: Trophy, path: "/leaderboards", label: "Leaderboards" },
    { id: 7, icon: ContactRound, path: "/developerlist", label: "Developer List" }

    
  ];
  
  const logoutItem = {
    icon: LogOut,
    path: "/login"
  };
  </script>
  