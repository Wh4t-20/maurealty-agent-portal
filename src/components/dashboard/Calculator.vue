<template>
  <div class="calculator-panel">
    <h2>Commission Calculator</h2>
    <div class="calc-grid">
      <input type="number" placeholder="Total Sale Price" class="form-input" />
      <input type="number" placeholder="Commission %" class="form-input" />
    </div>
    <div class="result-area">
      <label>Estimated Net:</label>
      <div class="val">$0.00</div>
    </div>
  </div>
</template>

<style scoped>
.calculator-panel { padding: 2rem; }
.calc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.result-area { margin-top: 20px; text-align: center; }
.val { font-size: 2rem; font-weight: bold; color: var(--color-maurealty-blue); }
</style>