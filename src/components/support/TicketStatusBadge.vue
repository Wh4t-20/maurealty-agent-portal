<template>
  <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border whitespace-nowrap', STATUS_CLASS[status]]">
    {{ TICKET_STATUS_LABEL[status] ?? status }}
  </span>
</template>

<script setup lang="ts">
import { TICKET_STATUS_LABEL, type TicketStatus } from '@/assets/classes/ticket'

defineProps<{ status: TicketStatus }>()

// Same pill style as the Sales Report status badges: blue = waiting for IT,
// yellow = IT is working on it, green = done.
const STATUS_CLASS: Record<TicketStatus, string> = {
  raised: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800',
  resolved: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
}
</script>
