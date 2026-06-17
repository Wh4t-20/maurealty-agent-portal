<template>
  <div class="w-full flex flex-col min-h-screen bg-[#f6f7fb]">
    
    <header class="flex flex-col py-5 px-10 pb-0 w-full bg-linear-to-r from-[#A9D6FF70] to-[#FFFFFF] text-maurealty-blue shadow-md sticky top-0 z-20">
      <div class="flex justify-between items-center w-full pb-3 mb-3">
        <h1 class="text-3xl font-bold uppercase">Sales</h1>
        <div class="flex gap-5 h-full">
          </div>
      </div>
    </header>

    <main class="flex-1 p-8 md:p-10 overflow-y-auto">
      
      <div class="accounting-layout">
        
        <div class="flex flex-col gap-6">
          
          <div class="card calculator">
            <h2 class="card-title">CALCULATOR</h2>

            <div class="calc-header">
              <label class="calc-label">{{ calcMode }} Calculator:</label>
              <select v-model="calcMode" class="calc-dropdown">
                <option value="Sales">Sales</option>
                <option value="Mortgage">Mortgage</option>
                <option value="Taxes">Property Tax</option>
              </select>
            </div>

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

            <div v-if="calcMode === 'Mortgage'" class="calc-inputs">
              <div class="input-pair">
                <label>Property Price (₱)</label>
                <input type="number" v-model.number="mortPrice" />
              </div>
              <div class="input-pair">
                <label>Downpayment (%)</label>
                <input type="number" v-model.number="mortDownPercent" />
              </div>
              <div class="input-pair">
                <label>Interest Rate (Annual %)</label>
                <input type="number" v-model.number="mortInterest" />
              </div>
              <div class="input-pair">
                <label>Loan Term (Years)</label>
                <input type="number" v-model.number="mortYears" />
              </div>
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
          </div>

          <div class="card notices">
            <h2 class="card-title red">RED FLAG NOTICES</h2>
            <div class="notice">
              <span class="flag">🚩</span>
              <span class="text">Lacking Voucher</span>
              <span class="date">09/15/2025</span>
            </div>
            <div class="notice">
              <span class="flag">🚩</span>
              <span class="text">Wrong Expenses L.</span>
              <span class="date">09/15/2025</span>
            </div>
            <div class="notice">
              <span class="flag">🚩</span>
              <span class="text">Quota Due Coming</span>
              <span class="date">08/15/2025</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-6">
          
          <div class="card expenses">
            <h2 class="card-title">MONTHLY EXPENSES</h2>

            <div class="expenses-header">
              <div class="filters">
                <label class="text-sm font-semibold text-gray-600">Filters:</label>
                <select class="filter-select">
                  <option>Ascending</option>
                  <option>Descending</option>
                </select>
                <select class="filter-select">
                  <option>Type</option>
                  <option>Fixed</option>
                  <option>Utilities</option>
                  <option>Taxes</option>
                </select>
              </div>
              <span class="search-icon">🔍</span>
            </div>

            <div class="expense-row">
              <span class="type">Fixed</span>
              <span class="amount">₱ 10,000,000.00</span>
            </div>
            <div class="expense-row">
              <span class="type">Utilities</span>
              <span class="amount negative">-₱ 10,000,000.00</span>
            </div>
            <div class="expense-row">
              <span class="type">Taxes</span>
              <span class="amount negative">-₱ 9,876,543.21</span>
            </div>
          </div>

          <div class="card checks">
            <h2 class="card-title">CHECKS</h2>
            <div class="list-item">110145162157 <span class="info">ⓘ</span></div>
            <div class="list-item">103157154145 <span class="info">ⓘ</span></div>
            <div class="list-item">103141162154 <span class="info">ⓘ</span></div>
          </div>

          <div class="card receipts">
            <h2 class="card-title">RECEIPTS</h2>
            <div class="list-item">
              <span class="code">TWFltUmVhbHR5</span>
              <span class="date">09/15/2025</span>
              <span class="info">ⓘ</span>
            </div>
            <div class="list-item">
              <span class="code">QmlsbHlfKZWU</span>
              <span class="date">08/27/2025</span>
              <span class="info">ⓘ</span>
            </div>
            <div class="list-item">
              <span class="code">emVyby96ZXJv</span>
              <span class="date">06/31/2025</span>
              <span class="info">ⓘ</span>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const calcMode = ref('Sales')

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

const mortPrice = ref()
const mortDownPercent = ref()
const mortInterest = ref()
const mortYears = ref()

const mortTotal = computed(() => {
  const principal = mortPrice.value * (1 - (mortDownPercent.value / 100))
  const monthlyInterestRate = (mortInterest.value / 100) / 12
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
  if (calcMode.value === 'Mortgage') return formatCurrency(mortTotal.value)
  if (calcMode.value === 'Taxes') return formatCurrency(taxTotal.value)
  return '0.00'
})
</script>

<style scoped>
/* Chrome, Safari, Edge, Opera Fixes for input[type=number] */
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

/* ============= LAYOUT ============= */
.accounting-layout {
  display: grid;
  grid-template-columns: 1fr; /* Stacks on mobile */
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Side-by-side on larger screens */
@media (min-width: 1024px) {
  .accounting-layout {
    grid-template-columns: 1.3fr 1fr;
  }
}

/* ============= CARDS ============= */
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
  color: #1e2a5a; /* Maurealty Blue */
  margin-bottom: 1rem;
  letter-spacing: 0.5px;
}

.card-title.red {
  color: #e74c3c;
}

/* ============= CALCULATOR ============= */
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

/* ============= EXPENSES ============= */
.expenses-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-select {
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  padding: 4px 8px;
  font-size: 0.85rem;
  background: white;
  outline: none;
}

.search-icon {
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.search-icon:hover {
  opacity: 1;
}

.expense-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.expense-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.type {
  font-weight: 600;
  color: #475569;
}

.amount {
  font-weight: 800;
  color: #1e2a5a;
}

.amount.negative {
  color: #e74c3c;
}

/* ============= RED FLAG NOTICES ============= */
.notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;
  padding: 0.8rem 0;
}

.notice:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.flag {
  font-size: 1.1rem;
}

.text {
  flex: 1;
  margin-left: 0.8rem;
  color: #334155;
  font-weight: 600;
  font-size: 0.95rem;
}

.date {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
}

/* ============= CHECKS & RECEIPTS ============= */
.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding: 0.8rem 0;
}

.list-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info {
  color: #94a3b8;
  font-size: 1rem;
  cursor: pointer;
}

.info:hover {
  color: #1e2a5a;
}

.code {
  font-family: 'Courier New', monospace;
  color: #334155;
  font-weight: 700;
  font-size: 0.95rem;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>