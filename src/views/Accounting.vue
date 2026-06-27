<template>
  <div class="relative w-full flex flex-col min-h-screen bg-[#f6f7fb]">
    
    <header class="flex flex-col py-5 px-10 pb-0 w-full bg-linear-to-r from-[#A9D6FF70] to-[#FFFFFF] text-maurealty-blue shadow-md sticky top-0 z-20">
      <div class="flex justify-between items-center w-full pb-3 mb-3">
        <h1 class="text-3xl font-bold uppercase">Accounting</h1>
        <div class="flex gap-5 h-full">
          </div>
      </div>
    </header>

    <main class="flex-1 p-8 md:p-10 overflow-y-auto flex items-center justify-center">
      
      <div class="accounting-layout">
        
        <div class="flex flex-col gap-6">
          <CalculatorPanel />
        </div>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// Calculator (incl. the amortization schedule) lives in the shared
// CalculatorPanel so the listing popup can reuse it.
import CalculatorPanel from '@/components/calculator/CalculatorPanel.vue'
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
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .accounting-layout {
    max-width: 900px;
    width: 100%;
    height: -webkit-fill-available;
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