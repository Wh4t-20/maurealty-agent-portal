<template>
  <div class="glass-card performance-section hover-animate clickable" @click="$emit('open-details')">
    <div class="section-header">
      <h2>SALES PERFORMANCE</h2>
      <div class="chart-metrics">
        <span>Conv: <strong>3.2%</strong></span>
        <span>Avg Deal: <strong>$450k</strong></span>
      </div>
    </div>
    <div class="chart-container">
      <div v-for="(val, i) in [40, 70, 45, 90, 65, 80, 95]" :key="i" class="bar-wrapper">
        <div class="bar-fill" :style="{ height: val + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-card { background: white; padding: 1.5rem; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); cursor: pointer; transition: all 0.3s ease; }
.glass-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.08); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.chart-metrics { display: flex; gap: 15px; font-size: 0.85rem; color: #4a5568; }
.chart-container { height: 180px; display: flex; align-items: flex-end; gap: 12px; }
.bar-wrapper { flex: 1; background: #f0f2f5; border-radius: 6px; height: 100%; position: relative; overflow: hidden; }
.bar-fill { position: absolute; bottom: 0; width: 100%; background: linear-gradient(180deg, var(--color-maurealty-blue), #2980b9); transition: height 1s ease; }
</style>