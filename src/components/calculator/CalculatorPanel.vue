<template>
  <div class="card calculator">
    <h2 class="card-title">CALCULATOR</h2>

    <div class="calc-header">
      <label class="calc-label">{{ calcMode }} Calculator:</label>
      <select v-model="calcMode" class="calc-dropdown">
        <option value="Sales">Sales</option>
        <option value="Loan">Loan</option>
        <option value="Taxes">Property Tax</option>
      </select>
    </div>

    <label class="calc-label block mb-2 text-sm text-[#64748b]">
      {{ calcMode === 'Loan' ? 'Monthly Payment:' : calcMode === 'Sales' ? 'Net Commission' : '' }}
    </label>

    <div class="calc-display">
      <span class="peso-symbol">₱</span>
      <input type="text" class="calc-input large" :value="displayedTotal" readonly />
    </div>

    <div v-if="calcMode === 'Sales'" class="calc-inputs">
      <div class="input-pair">
        <label>Gross Profit (₱)</label>
        <input type="number" v-model.number="totalSales" />
      </div>
      <div class="input-pair">
        <label>Net Commission Rate (%)</label>
        <input type="number" v-model.number="commRate" />
      </div>
      <div class="input-pair">
        <label>Commission Tax (%)</label>
        <input type="number" v-model.number="taxRate" />
      </div>
    </div>

    <div v-if="calcMode === 'Loan'" class="calc-inputs">
      <div class="input-pair">
        <label>Loan Price (₱)</label>
        <input type="number" v-model.number="mortPrice" />
      </div>
      <div class="input-pair">
        <label>Interest Rate (Annual %)</label>
        <input type="number" v-model.number="mortInterest" />
      </div>
      <div class="input-pair">
        <label>Loan Term (Years)</label>
        <input
          type="number"
          v-model.number="mortYears"
          min="1"
          max="20"
          @input="mortYears > 20 ? mortYears = 20 : mortYears"
        />
      </div>
      <span
        @click="openAmortization"
        class="text-sm text-[#64748b] cursor-pointer hover:underline transition-colors"
      >
        View Amortization Schedule
      </span>
      <p v-if="errorMessage" class="mt-2 text-xs text-[#64748b] font-bold animate-pulse text-center">
        {{ errorMessage }}
      </p>
      <p class="text-xs text-center text-gray-400 mt-2">*Estimated Monthly Payment</p>
    </div>

    <div v-if="calcMode === 'Taxes'" class="calc-inputs">
      <div class="input-pair">
        <label>Property Value (₱)</label>
        <input type="number" v-model.number="taxValue" />
      </div>
      <div class="input-pair">
        <label>Tax Rate (%)</label>
        <input type="number" v-model.number="taxRatePercent" />
      </div>
    </div>

    <!-- Teleported so the full-screen amortization overlay works even when this
         panel is rendered inside a small popup. -->
    <Teleport to="body">
      <amortSched
        v-if="showAmortization"
        :principal="mortPrice"
        :years="mortYears"
        :interest="mortInterest"
        @close="showAmortization = false"
      />
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

<style scoped>
/* Chrome, Safari, Edge, Opera fixes for input[type=number] */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}
input[type=number] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  border: 1px solid rgba(169, 214, 255, 0.2);
}

.card-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1e2a5a;
  margin-bottom: 1rem;
  letter-spacing: 0.5px;
}

.calculator .calc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}

.calc-label {
  font-weight: 700;
  color: #2c3e50;
}

.calc-dropdown {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 6px 10px;
  background: white;
  outline: none;
  cursor: pointer;
}

.calc-dropdown:focus {
  border-color: #1e2a5a;
}

.calc-display {
  position: relative;
  margin-bottom: 1.5rem;
}

.peso-symbol {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #1e2a5a;
  font-weight: 800;
  font-size: 1.4rem;
}

.calc-input.large {
  width: 100%;
  font-size: 1.8rem;
  font-weight: 800;
  color: #1e2a5a;
  padding: 1rem 1rem 1rem 2.5rem;
  border: 2px solid #e1e4e8;
  background: #f8fafc;
  border-radius: 10px;
  text-align: right;
  outline: none;
}

.calc-inputs .input-pair {
  margin-bottom: 1rem;
}

.input-pair label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.4rem;
}

.input-pair input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #334155;
  font-weight: 500;
  outline: none;
}
</style>
