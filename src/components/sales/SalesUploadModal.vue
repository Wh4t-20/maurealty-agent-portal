<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,61,98,0.7)] backdrop-blur-sm p-4" @click.self="$emit('close')">
    <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">

      <!-- HEADER -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
        <h2 class="text-xl font-bold text-maurealty-blue">{{ editSale ? 'Edit Sale' : lockedListing ? 'Confirm Sale' : 'Upload Sale' }}</h2>
        <button class="text-gray-400 hover:text-gray-700 text-xl leading-none cursor-pointer" @click="$emit('close')">✕</button>
      </div>

      <!-- FORM -->
      <form class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="submit">

        <!-- Property (full width) -->
        <div class="sm:col-span-2 flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600">Property <span class="text-red-500">*</span></label>
          <!-- Sold flow: property is fixed, shown read-only. Manual flow: dropdown. -->
          <input
            v-if="propertyLocked"
            type="text"
            :value="lockedTitle"
            readonly
            :class="[inputClass, 'bg-gray-100 cursor-not-allowed']"
          />
          <select v-else v-model="form.listing_ID" required :class="inputClass">
            <option :value="null" disabled>Select a property…</option>
            <option v-for="l in listings" :key="l.listing_id" :value="l.listing_id">{{ l.listing_title }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600">Client (Buyer) <span class="text-red-500">*</span></label>
          <input v-model.trim="form.client_name" type="text" required :class="inputClass" placeholder="Full name" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600">Reservation Date <span class="text-red-500">*</span></label>
          <input v-model="form.reservation_date" type="date" required :class="inputClass" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600">Total Contract Price (₱) <span class="text-red-500">*</span></label>
          <input v-model.number="form.total_contract_price" type="number" min="0" step="0.01" required :class="inputClass" placeholder="0.00" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600">Sale # (this agent)</label>
          <input v-model.number="form.agent_sale_seq" type="number" min="0" :class="inputClass" placeholder="e.g. 3" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600">Gross Commission (₱)</label>
          <input v-model.number="form.gross_commission" type="number" min="0" step="0.01" :class="inputClass" placeholder="0.00" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600">Net Commission (₱)</label>
          <input v-model.number="form.net_commission" type="number" min="0" step="0.01" :class="inputClass" placeholder="0.00" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600">Voucher Series</label>
          <input v-model.trim="form.voucher_series" type="text" :class="inputClass" placeholder="VCH-0001" />
        </div>

        <div class="sm:col-span-2 flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600">Remarks</label>
          <input v-model.trim="form.remarks" type="text" :class="inputClass" placeholder="e.g. third equity" />
        </div>

        <!-- ERROR -->
        <p v-if="error" class="sm:col-span-2 text-sm text-red-500">{{ error }}</p>

        <!-- ACTIONS -->
        <div class="sm:col-span-2 flex justify-end gap-3 pt-2">
          <button type="button" class="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer" @click="$emit('close')">Cancel</button>
          <button type="submit" :disabled="saving" class="px-5 py-2 rounded-lg bg-maurealty-blue text-white hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            {{ saving ? 'Saving…' : 'Save Sale' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { salesService, type Sale } from '@/services/salesService'
import { listingsService } from '@/services/listingsServices'
import { authService } from '@/services/authService'
import type { Property } from '@/assets/classes/listings'

// Sold flow passes a fixed listing (id + title + price) so the property is
// locked and the contract price is prefilled. Omit it for the manual flow.
const props = defineProps<{
  lockedListing?: { id: number; title: string; price?: number }
  // When provided, the modal edits this existing sale instead of creating one.
  editSale?: Sale
}>()

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

// Property field is read-only in both the Sold flow and edit (the listing of an
// existing sale isn't changed here). Manual create uses the dropdown.
const lockedTitle = props.lockedListing?.title ?? props.editSale?.listing_title ?? ''
const propertyLocked = !!props.lockedListing || !!props.editSale

const inputClass =
  'py-2 px-3 rounded-md border border-gray-300 bg-white focus:outline-2 focus:outline-maurealty-blue text-sm'

const listings = ref<Property[]>([])
const saving = ref(false)
const error = ref('')

const e = props.editSale
const form = reactive({
  // Prefill from the edited sale, else the locked listing (Sold flow), else blank.
  listing_ID: e?.listing_ID ?? props.lockedListing?.id ?? null as number | null,
  client_name: e?.client_name ?? '',
  reservation_date: e?.reservation_date ?? '',
  total_contract_price: e?.total_contract_price ?? props.lockedListing?.price ?? null as number | null,
  agent_sale_seq: e?.agent_sale_seq ?? null as number | null,
  gross_commission: e?.gross_commission ?? null as number | null,
  net_commission: e?.net_commission ?? null as number | null,
  voucher_series: e?.voucher_series ?? '',
  remarks: e?.remarks ?? '',
})

onMounted(async () => {
  // Locked/edit flows already have their property — no dropdown needed.
  if (propertyLocked) return
  try {
    listings.value = await listingsService.getListings(100)
  } catch (err) {
    console.error('Failed to load listings for sale form:', err)
    error.value = 'Could not load properties.'
  }
})

async function submit() {
  error.value = ''

  // Keys must match the DB column names exactly. Empty optional fields → null.
  const payload = {
    listing_ID: form.listing_ID,
    client_name: form.client_name,
    reservation_date: form.reservation_date,
    total_contract_price: form.total_contract_price,
    agent_sale_seq: form.agent_sale_seq,
    gross_commission: form.gross_commission,
    net_commission: form.net_commission,
    voucher_series: form.voucher_series || null,
    remarks: form.remarks || null,
  }

  saving.value = true
  try {
    if (props.editSale) {
      // Edit: agent_ID (the seller) stays as-is — don't reassign on edit.
      await salesService.updateSale(props.editSale.sale_ID, payload)
    } else {
      // Create: the seller is the current agent.
      const agent = await authService.getCurrentAgent()
      if (!agent?.agent_ID) {
        error.value = 'No authenticated agent — please log in again.'
        return
      }
      await salesService.createSale({ agent_ID: agent.agent_ID, ...payload })
    }
    emit('saved')
  } catch (err: any) {
    console.error('Failed to save sale:', err)
    error.value = err?.message || 'Failed to save sale. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>
