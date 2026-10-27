<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,61,98,0.7)] backdrop-blur-sm p-4" @click.self="$emit('close')">
      <div class="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 class="text-xl font-bold text-maurealty-blue">Request Payment</h2>
          <button type="button" class="text-gray-400 hover:text-gray-700 text-xl leading-none cursor-pointer" @click="$emit('close')">✕</button>
        </div>

        <form class="px-6 py-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-3 items-end gap-4 text-sm" @submit.prevent="submit">
          <div class="sm:col-span-3 flex items-start justify-between gap-3">
            <p class="text-xs text-gray-500">
              These details come from your account and the sale. Use <b>Edit details</b> if something needs correcting.
              Amounts and calculations can't be changed.
            </p>
            <button type="button" class="shrink-0 px-3 py-1 text-xs font-semibold rounded-lg border border-maurealty-blue text-maurealty-blue hover:bg-maurealty-blue hover:text-white cursor-pointer"
                    @click="toggleEdit">
              {{ editing ? 'Reset' : 'Edit details' }}
            </button>
          </div>

          <label class="flex flex-col gap-1">
            <span class="text-gray-500 whitespace-nowrap">First name</span>
            <input v-model.trim="form.first_name" :readonly="!editing" :class="fieldClass" required />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500 whitespace-nowrap">Middle name <span class="text-xs text-gray-400">(optional)</span></span>
            <input v-model.trim="form.middle_name" :readonly="!editing" :class="fieldClass" placeholder="—" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-gray-500 whitespace-nowrap">Last name</span>
            <input v-model.trim="form.last_name" :readonly="!editing" :class="fieldClass" required />
          </label>

          <div class="sm:col-span-3 border-t border-gray-100 pt-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-maurealty-blue mb-2">Sale details</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <div><span class="text-gray-500 block">Sale #</span><span class="font-medium">{{ tab.sale_ID }}</span></div>
              <label class="flex flex-col gap-1">
                <span class="text-gray-500">Client</span>
                <input v-model.trim="form.client_name" :readonly="!editing" :class="fieldClass" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-gray-500">Project</span>
                <input v-model.trim="form.project" :readonly="!editing" :class="fieldClass" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-gray-500">Developer</span>
                <input v-model.trim="form.developer" :readonly="!editing" :class="fieldClass" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-gray-500">Reservation date</span>
                <input v-model="form.reservation_date" :readonly="!editing" :class="fieldClass" />
              </label>
              <!-- Locked: everything to do with the amount or its calculation -->
              <div><span class="text-gray-500 block">Contract price <span class="text-xs text-gray-400">(locked)</span></span><span class="font-medium">{{ peso(tab.total_contract_price) }}</span></div>
              <div><span class="text-gray-500 block">Role / Rank <span class="text-xs text-gray-400">(locked)</span></span><span class="font-medium">{{ tab.role }}<template v-if="tab.rank"> · {{ tab.rank }}</template></span></div>
              <div><span class="text-gray-500 block">Payment <span class="text-xs text-gray-400">(locked)</span></span><span class="font-medium">{{ tab.payment_no }} of {{ tab.payment_total }} (due {{ tab.due_date }})</span></div>
              <div class="sm:col-span-2"><span class="text-gray-500 block">Commission amount <span class="text-xs text-gray-400">(locked)</span></span><span class="text-lg font-extrabold text-maurealty-green">{{ peso(tab.commission_amount) }}</span></div>
            </div>
          </div>

          <p v-if="error" class="sm:col-span-3 text-red-600 text-xs">{{ error }}</p>
        </form>

        <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer" @click="$emit('close')">Cancel</button>
          <button type="button" :disabled="saving" class="px-4 py-2 rounded-lg bg-maurealty-blue text-white hover:opacity-80 transition cursor-pointer disabled:opacity-50" @click="submit">
            {{ saving ? 'Submitting…' : 'Submit details' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { commissionService, type CommissionTab, type PaymentRequestDetails } from '@/services/commissionService'

const props = defineProps<{
  tab: CommissionTab
  agent: { first_name: string; middle_name?: string | null; last_name: string }
}>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'submitted'): void }>()

// Starts filled in from the account and the sale. The agent can edit the name and sale-description
// fields; the amount and everything that feeds its calculation stays fixed (taken from the tab).
const base = () => ({
  first_name: props.agent.first_name,
  middle_name: props.agent.middle_name || '',
  last_name: props.agent.last_name,
  client_name: props.tab.client_name,
  project: props.tab.project_name,
  developer: props.tab.developer_name,
  reservation_date: props.tab.reservation_date,
})
const form = reactive(base())
const editing = ref(false)
const fieldClass = computed(() => ['field', editing.value ? 'field-edit' : ''])

function toggleEdit() {
  if (editing.value) Object.assign(form, base())   // Reset
  editing.value = !editing.value
}

const details = computed<PaymentRequestDetails>(() => ({
  first_name: form.first_name,
  middle_name: form.middle_name || null,
  last_name: form.last_name,
  sale_id: props.tab.sale_ID,
  project: form.project,
  developer: form.developer,
  client_name: form.client_name,
  reservation_date: form.reservation_date,
  total_contract_price: props.tab.total_contract_price,
  role: props.tab.role,
  rank: props.tab.rank,
  payment_no: props.tab.payment_no,
  payment_total: props.tab.payment_total,
  amount: props.tab.commission_amount,
  due_date: props.tab.due_date,
}))

const saving = ref(false)
const error = ref('')
const peso = (n: number) => '₱' + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

async function submit() {
  error.value = ''
  if (!form.first_name || !form.last_name) { error.value = 'First and last name are required.'; return }
  saving.value = true
  try {
    const ok = await commissionService.requestPayment(props.tab.id, details.value)
    if (!ok) {
      error.value = 'The request was not saved. The commission may have changed, or you may not have permission.'
      return
    }
    emit('submitted')
  } catch (e: any) {
    console.error('Payment request failed:', e)
    error.value = e?.message || 'Could not send the request. Has the latest migration been run?'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.field {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px 10px;
  background: #f3f4f6;
  cursor: not-allowed;
  width: 100%;
  min-height: 2.5rem;
  box-sizing: border-box;
}
.field-edit {
  background: #fff;
  cursor: text;
  border-color: #07407b;
}
</style>
