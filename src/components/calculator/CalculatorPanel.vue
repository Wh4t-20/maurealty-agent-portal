<template>
  <div class="p-6 bg-white border border-blue-200/20 shadow-sm rounded-xl dark:bg-black dark:border-gray-800">
    <h2 class="mb-4 text-lg font-extrabold tracking-wide text-[#1e2a5a] dark:text-gray-100">
      CALCULATOR
    </h2>

    <div class="flex items-center justify-between mb-5">
      <label class="font-bold text-slate-800 dark:text-gray-200">{{ calcMode }} Calculator:</label>
      <select 
        v-model="calcMode" 
        class="px-2.5 py-1.5 bg-white border border-gray-300 rounded-md outline-none cursor-pointer dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 focus:border-[#1e2a5a] dark:focus:border-blue-500 transition-colors"
      >
        <option value="Sales">Sales</option>
        <option value="Loan">Loan</option>
        <option value="Taxes">Property Tax</option>
      </select>
    </div>

    <label class="block mb-2 text-sm text-slate-500 dark:text-slate-300">
      {{ calcMode === 'Loan' ? 'Monthly Payment:' : calcMode === 'Sales' ? 'Net Commission' : '' }}
    </label>

    <div class="relative mb-6">
      <span class="absolute text-2xl font-extrabold -translate-y-1/2 left-4 top-1/2 text-[#1e2a5a] dark:text-gray-100">₱</span>
      <input 
        type="text" 
        class="w-full py-4 pl-10 pr-4 text-3xl font-extrabold text-right border-2 border-gray-200 rounded-lg outline-none bg-slate-50 text-[#1e2a5a] dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100" 
        :value="displayedTotal" 
        readonly 
      />
    </div>

    <div v-if="calcMode === 'Sales'">
      <div class="mb-4">
        <label class="block mb-1.5 text-sm font-semibold text-slate-500 dark:text-slate-300">Gross Profit (₱)</label>
        <input 
          type="number" 
          v-model.number="totalSales" 
          class="w-full px-3.5 py-2.5 font-medium border rounded-lg outline-none bg-slate-50 border-slate-200 text-slate-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200 focus:border-[#1e2a5a] dark:focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
        />
      </div>
      <div class="mb-4">
        <label class="block mb-1.5 text-sm font-semibold text-slate-500 dark:text-slate-300">Net Commission Rate (%)</label>
        <input 
          type="number" 
          v-model.number="commRate" 
          class="w-full px-3.5 py-2.5 font-medium border rounded-lg outline-none bg-slate-50 border-slate-200 text-slate-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200 focus:border-[#1e2a5a] dark:focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
        />
      </div>
      <div class="mb-4">
        <label class="block mb-1.5 text-sm font-semibold text-slate-500 dark:text-slate-300">Commission Tax (%)</label>
        <input 
          type="number" 
          v-model.number="taxRate" 
          class="w-full px-3.5 py-2.5 font-medium border rounded-lg outline-none bg-slate-50 border-slate-200 text-slate-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200 focus:border-[#1e2a5a] dark:focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
        />
      </div>
    </div>

    <div v-if="calcMode === 'Loan'">
      <div class="mb-4">
        <label class="block mb-1.5 text-sm font-semibold text-slate-500 dark:text-slate-300">Loan Price (₱)</label>
        <input 
          type="number" 
          v-model.number="mortPrice" 
          class="w-full px-3.5 py-2.5 font-medium border rounded-lg outline-none bg-slate-50 border-slate-200 text-slate-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200 focus:border-[#1e2a5a] dark:focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
        />
      </div>
      <div class="mb-4">
        <label class="block mb-1.5 text-sm font-semibold text-slate-500 dark:text-slate-300">Interest Rate (Annual %)</label>
        <input 
          type="number" 
          v-model.number="mortInterest" 
          class="w-full px-3.5 py-2.5 font-medium border rounded-lg outline-none bg-slate-50 border-slate-200 text-slate-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200 focus:border-[#1e2a5a] dark:focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
        />
      </div>
      <div class="mb-4">
        <label class="block mb-1.5 text-sm font-semibold text-slate-500 dark:text-slate-300">Loan Term (Years)</label>
        <input
          type="number"
          v-model.number="mortYears"
          min="1"
          max="20"
          @input="mortYears > 20 ? mortYears = 20 : mortYears"
          class="w-full px-3.5 py-2.5 font-medium border rounded-lg outline-none bg-slate-50 border-slate-200 text-slate-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200 focus:border-[#1e2a5a] dark:focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
      <span
        @click="openAmortization"
        class="text-sm cursor-pointer text-slate-500 dark:text-slate-300 hover:underline transition-colors"
      >
        View Amortization Schedule
      </span>
      <p v-if="errorMessage" class="mt-2 text-xs font-bold text-center animate-pulse text-slate-500 dark:text-slate-300">
        {{ errorMessage }}
      </p>
      <p class="mt-2 text-xs text-center text-gray-400 dark:text-gray-500">*Estimated Monthly Payment</p>
    </div>

    <div v-if="calcMode === 'Taxes'">
      <div class="mb-4">
        <label class="block mb-1.5 text-sm font-semibold text-slate-500 dark:text-slate-300">Property Value (₱)</label>
        <input 
          type="number" 
          v-model.number="taxValue" 
          class="w-full px-3.5 py-2.5 font-medium border rounded-lg outline-none bg-slate-50 border-slate-200 text-slate-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200 focus:border-[#1e2a5a] dark:focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
        />
      </div>
      <div class="mb-4">
        <label class="block mb-1.5 text-sm font-semibold text-slate-500 dark:text-slate-300">Tax Rate (%)</label>
        <input 
          type="number" 
          v-model.number="taxRatePercent" 
          class="w-full px-3.5 py-2.5 font-medium border rounded-lg outline-none bg-slate-50 border-slate-200 text-slate-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200 focus:border-[#1e2a5a] dark:focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
        />
      </div>
    </div>

    <Teleport to="body">
      <div>
        <amortSched
          v-if="showAmortization"
          :principal="mortPrice ?? 0"
          :years="mortYears"
          :interest="mortInterest"
          @close="showAmortization = false"
        />
      </div>
      
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import amortSched from '@/components/accounting/amortSched.vue'

// Optional: when opened from a listing, prefill the property price. Loan is the
// default mode (the common "what's the loan on this property" use).
const props = defineProps<{ prefillPrice?: number }>()

const calcMode = ref('Loan')
const showAmortization = ref(false)
const errorMessage = ref('')

const openAmortization = () => {
  if (!mortPrice.value || mortPrice.value <= 0 || !mortYears.value || mortYears.value <= 0 || !mortInterest.value || mortInterest.value <= 0) {
    errorMessage.value = 'Please enter a valid Loan Price, Interest Rate, and Term to view the schedule.'
    setTimeout(() => { errorMessage.value = '' }, 3000)
    return
  }
  errorMessage.value = ''
  showAmortization.value = true
}

// Formatting Tool
const formatCurrency = (val: number) => {
  if (isNaN(val) || !isFinite(val)) return '0.00'
  return val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const totalSales = ref()
const commRate = ref()
const taxRate = ref()

const salesTotal = computed(() => {
  const gross = totalSales.value * (commRate.value / 100)
  const tax = gross * (taxRate.value / 100)
  return gross - tax
})

const mortPrice = ref(props.prefillPrice)
const mortInterest = ref()
const mortYears = ref()

const mortTotal = computed(() => {
  const principal = mortPrice.value || 0
  const annualInterestRate = mortInterest.value
  const monthlyInterestRate = (annualInterestRate / 100) / 12
  const totalPayments = mortYears.value * 12

  if (monthlyInterestRate === 0) return principal / totalPayments

  const monthly = principal * ((monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) / (Math.pow(1 + monthlyInterestRate, totalPayments) - 1))
  return monthly
})

const taxValue = ref()
const taxRatePercent = ref()

const taxTotal = computed(() => {
  return taxValue.value * (taxRatePercent.value / 100)
})

const displayedTotal = computed(() => {
  if (calcMode.value === 'Sales') return formatCurrency(salesTotal.value)
  if (calcMode.value === 'Loan') return formatCurrency(mortTotal.value)
  if (calcMode.value === 'Taxes') return formatCurrency(taxTotal.value)
  return '0.00'
})
</script>