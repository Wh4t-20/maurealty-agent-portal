<template>
  <div
    class="p-6 transition-all duration-300 ease-in-out bg-white shadow-sm cursor-pointer rounded-2xl dark:bg-black hover:-translate-y-1.5 hover:shadow-xl"
    @click="$emit('view-full')"
  >
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-base font-bold tracking-wide text-gray-800 dark:text-gray-100">GENEALOGY</h2>
      <span class="px-3 py-1 text-[11px] font-semibold rounded-full bg-maurealty-blue/10 text-maurealty-blue dark:bg-maurealty-blue/20">
        Full Page →
      </span>
    </div>

    <!-- Upline -->
    <p class="mb-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Upline ({{ upline.length }})</p>
    <p v-if="upline.length === 0" class="px-3 py-2 mb-1 text-xs text-gray-500 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-gray-400">No upline</p>
    <ul v-else class="mb-1 space-y-2">
      <li v-for="(u, i) in upline.slice(0, 3)" :key="u.name + i" class="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800">
        <div class="flex items-center justify-center text-xs font-bold text-white rounded-full shrink-0 size-9 bg-maurealty-blue">{{ initials(u.name) }}</div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-gray-800 truncate dark:text-gray-100">{{ u.name }}</p>
          <p class="text-[11px] text-gray-500 truncate dark:text-gray-400">
            <span v-if="i === 0" class="font-semibold text-maurealty-blue">Direct upline · </span>{{ u.meta }}
          </p>
        </div>
      </li>
    </ul>
    <p v-if="upline.length > 3" class="mb-1 text-[11px] text-gray-400">+{{ upline.length - 3 }} more above</p>

    <!-- You -->
    <div class="flex items-center gap-3 my-3">
      <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
      <span class="px-3 py-1 text-[11px] font-bold tracking-wide text-white rounded-full bg-maurealty-green">YOU</span>
      <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
    </div>

    <!-- Downline -->
    <p class="mb-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">My Downline ({{ downline.length }})</p>
    <p v-if="downline.length === 0" class="px-3 py-2 text-xs text-gray-500 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-gray-400">No downline yet</p>
    <ul v-else class="space-y-2">
      <li v-for="(d, i) in downline.slice(0, 4)" :key="d.name + i" class="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800">
        <div class="flex items-center justify-center text-xs font-bold text-white rounded-full shrink-0 size-9 bg-maurealty-green">{{ initials(d.name) }}</div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-gray-800 truncate dark:text-gray-100">{{ d.name }}</p>
          <p class="text-[11px] text-gray-500 truncate dark:text-gray-400">{{ d.meta }}</p>
        </div>
      </li>
    </ul>
    <p v-if="downline.length > 4" class="mt-2 text-[11px] text-gray-400">+{{ downline.length - 4 }} more</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  upline: { name: string; meta: string }[];     // direct upline first, then each upline above
  downline: { name: string; meta: string }[];   // everyone below, any depth
}>();
defineEmits(['view-full']);

// "Angelo Mari Manlangit" -> "AM"
const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
</script>