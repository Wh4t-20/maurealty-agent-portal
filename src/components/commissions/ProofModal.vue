<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,61,98,0.7)] backdrop-blur-sm p-4" @click.self="$emit('close')">
      <div class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 class="text-xl font-bold text-maurealty-blue">Proof of Payment</h2>
          <button type="button" class="text-gray-400 hover:text-gray-700 text-xl leading-none cursor-pointer" @click="$emit('close')">✕</button>
        </div>

        <div class="px-6 py-4 overflow-y-auto flex flex-col gap-3 text-sm">
          <p class="text-gray-600">
            {{ tab.project_name }} · Payment {{ tab.payment_no }} of {{ tab.payment_total }} ·
            <span class="font-bold text-maurealty-green">{{ peso(tab.commission_amount) }}</span>
            <template v-if="tab.released_at"> · sent {{ new Date(tab.released_at).toLocaleString('en-PH') }}</template>
          </p>

          <p v-if="tab.proof_urls.length === 0" class="text-gray-500">No images were attached.</p>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a v-for="(u, i) in tab.proof_urls" :key="u" :href="u" target="_blank" rel="noopener"
               class="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md">
              <img :src="u" :alt="`Proof ${i + 1}`" class="w-full max-h-72 object-contain bg-gray-50" />
            </a>
          </div>
          <p class="text-xs text-gray-500">Click an image to open it full size.</p>

          <p v-if="canConfirm" class="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3">
            Only press "Received payment" once the money has actually reached you. This marks the commission as received and cannot be undone.
          </p>
          <p v-if="error" class="text-red-600 text-xs">{{ error }}</p>
        </div>

        <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer" @click="$emit('close')">Close</button>
          <button v-if="canConfirm" type="button" :disabled="saving"
                  class="px-4 py-2 rounded-lg bg-maurealty-green text-white hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                  @click="confirm">
            {{ saving ? 'Saving…' : 'Received payment' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { commissionService, type CommissionTab } from '@/services/commissionService'

// canConfirm: only the recipient, and only while the payment is released.
const props = defineProps<{ tab: CommissionTab; canConfirm: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'received'): void }>()

const saving = ref(false)
const error = ref('')
const peso = (n: number) => '₱' + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

async function confirm() {
  error.value = ''
  saving.value = true
  try {
    const ok = await commissionService.confirmReceived(props.tab.id)
    if (!ok) { error.value = 'Could not mark this as received. Check permissions.'; return }
    emit('received')
  } catch (e: any) {
    console.error('Confirm received failed:', e)
    error.value = e?.message || 'Something went wrong.'
  } finally {
    saving.value = false
  }
}
</script>
