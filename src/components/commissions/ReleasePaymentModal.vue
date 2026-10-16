<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,61,98,0.7)] backdrop-blur-sm p-4" @click.self="$emit('close')">
      <div class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 class="text-xl font-bold text-maurealty-blue">Release Payment</h2>
          <button type="button" class="text-gray-400 hover:text-gray-700 text-xl leading-none cursor-pointer" @click="$emit('close')">✕</button>
        </div>

        <div class="px-6 py-4 overflow-y-auto flex flex-col gap-4 text-sm">
          <!-- What the agent submitted -->
          <div v-if="req" class="rounded-lg bg-background-gray/60 border border-sidebar-hover/20 p-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-maurealty-blue mb-2">Requested by</h3>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <div><dt class="text-gray-500">Name</dt><dd class="font-medium">{{ fullName }}</dd></div>
              <div><dt class="text-gray-500">Role / Rank</dt><dd class="font-medium">{{ req.role }}<template v-if="req.rank"> · {{ req.rank }}</template></dd></div>
              <div><dt class="text-gray-500">Sale</dt><dd class="font-medium">#{{ req.sale_id }} · {{ req.project }}</dd></div>
              <div><dt class="text-gray-500">Client</dt><dd class="font-medium">{{ req.client_name }}</dd></div>
              <div><dt class="text-gray-500">Payment</dt><dd class="font-medium">{{ req.payment_no }} of {{ req.payment_total }}</dd></div>
              <div><dt class="text-gray-500">Amount to release</dt><dd class="text-lg font-extrabold text-maurealty-green">{{ peso(req.amount) }}</dd></div>
            </dl>
          </div>
          <p v-else class="text-xs text-gray-500">No request details were saved for this commission.</p>

          <!-- Proof of payment images -->
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-maurealty-blue mb-1">Proof of payment, receipt and voucher <span class="text-red-500">*</span></h3>
            <p class="text-xs text-gray-500 mb-2">Attach one or more images, or copy an image and paste it here (Ctrl+V). At least one is required.</p>

            <label class="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 rounded-lg p-5 text-gray-500 hover:bg-gray-50 cursor-pointer">
              <span class="font-semibold text-maurealty-blue">Click to attach images</span>
              <span class="text-xs">or paste from the clipboard</span>
              <input type="file" accept="image/*" multiple class="hidden" @change="onPick" />
            </label>

            <div v-if="files.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <div v-for="(f, i) in files" :key="f.key" class="relative border border-gray-200 rounded-lg overflow-hidden">
                <img :src="f.url" :alt="f.file.name" class="w-full h-28 object-cover" />
                <button type="button" class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs cursor-pointer" title="Remove" @click="remove(i)">✕</button>
                <p class="text-[10px] text-gray-500 truncate px-1.5 py-1">{{ f.file.name }}</p>
              </div>
            </div>
          </div>

          <p v-if="error" class="text-red-600 text-xs">{{ error }}</p>
        </div>

        <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer" @click="$emit('close')">Cancel</button>
          <button type="button" :disabled="files.length === 0 || sending"
                  class="px-4 py-2 rounded-lg bg-maurealty-green text-white hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="send">
            {{ sending ? 'Sending…' : 'Send proof of payment' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { commissionService, type CommissionTab } from '@/services/commissionService'

const props = defineProps<{ tab: CommissionTab; adminAgentId: number | null }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'released'): void }>()

interface Picked { key: number; file: File; url: string }
const files = ref<Picked[]>([])
const sending = ref(false)
const error = ref('')
let counter = 0

const req = computed(() => props.tab.request_details)
const fullName = computed(() => req.value ? [req.value.first_name, req.value.middle_name, req.value.last_name].filter(Boolean).join(' ') : '')
const peso = (n: number) => '₱' + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function add(list: File[]) {
  for (const file of list) {
    if (!file.type.startsWith('image/')) { error.value = 'Only image files can be attached.'; continue }
    files.value.push({ key: ++counter, file, url: URL.createObjectURL(file) })
  }
}
function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  add(Array.from(input.files ?? []))
  input.value = ''
}
function remove(i: number) {
  const [gone] = files.value.splice(i, 1)
  if (gone) URL.revokeObjectURL(gone.url)
}

// Pasting an image (screenshot / copied picture) attaches it.
function onPaste(e: ClipboardEvent) {
  const imgs = Array.from(e.clipboardData?.files ?? []).filter(f => f.type.startsWith('image/'))
  if (imgs.length) { e.preventDefault(); error.value = ''; add(imgs) }
}
onMounted(() => document.addEventListener('paste', onPaste))
onBeforeUnmount(() => {
  document.removeEventListener('paste', onPaste)
  files.value.forEach(f => URL.revokeObjectURL(f.url))
})

async function send() {
  error.value = ''
  if (files.value.length === 0) { error.value = 'Attach at least one proof of payment image.'; return }
  sending.value = true
  try {
    const ok = await commissionService.releasePayment(props.tab.id, props.adminAgentId, files.value.map(f => f.file))
    if (!ok) { error.value = 'Could not release this payment. It may have changed, or you may not have permission.'; return }
    emit('released')
  } catch (e: any) {
    console.error('Release payment failed:', e)
    error.value = e?.message || 'Could not send the proof of payment. Has the latest migration been run?'
  } finally {
    sending.value = false
  }
}
</script>
