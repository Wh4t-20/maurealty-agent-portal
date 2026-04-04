<template>
    <div class="z-10 sticky inset-y-0 left-0 w-9/40 max-w-xs h-screen bg-maurealty-blue flex flex-col text-white">
      <!--Logo and Icons stuff-->
      <div class="flex flex-col items-center">
        <img src="@/assets/images/Maurealty.png" alt="MauRealty Logo" class="w-3/5 h-auto m-4" />
        <img src="@/assets/images/profile.png" alt="Agent" class="w-3/7 aspect-square object-cover rounded-full outline-2 outline-white m-3" />
        <p class="text-xl">Kenji Bad Boyboy</p>
        <p class="text-xl">Emerald</p>
      </div>
    
      <!--Siderbar choices-->
      <nav class="flex flex-col mt-10 divide-y">
        <router-link to="/dashboard" class="sidebar-choice">Dashboard</router-link>
        <router-link to="/listings" class="sidebar-choice">Listing</router-link>
        <router-link to="/accounting" class="sidebar-choice">Accounting</router-link>
        <router-link to="/voucher" class="sidebar-choice">Voucher</router-link>
        <router-link to="/inbox" class="sidebar-choice">Inbox</router-link>
        <router-link to="/leaderboards" class="sidebar-choice">Leaderboards</router-link>
        <router-link to="/developerlist" class="sidebar-choice">Developer List</router-link>
      </nav>

      <!--Footer for Settings and Logout-->
      <div class="flex justify-between absolute bottom-3 w-full px-3">
        <button class="flex items-center">
          <img src="@/assets/images/signout-icon.png" class="size-5 m-2">
          Sign Out
        </button>
        <button>
          <img src="@/assets/images/settings-icon.png" class="size-5.5 m-2">
        </button>
      </div>
    </div>
</template>

<script setup lang="ts">
</script>