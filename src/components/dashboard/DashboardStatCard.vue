<template>
  <div class="stat-card clickable-expansion hover-animate" @click="$emit('click', stat)">
    <div class="stat-header">
      <h3>{{ stat.label }}</h3>
      <span class="icon"></span>
    </div>
    <div class="amount">{{ stat.value }}</div>
    <div class="stat-footer">
      <span class="trend" :class="stat.type">{{ stat.trend }}</span>
      <span class="sub-label">{{ stat.sub }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ stat: any }>();
defineEmits(['click']);
</script>

<style scoped>
.stat-card { background: white; padding: 1.5rem; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); cursor: pointer; transition: all 0.3s ease; }
.stat-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.08); }
.stat-header { display: flex; justify-content: space-between; align-items: center; }
.stat-header h3 { font-size: 0.75rem; color: #64748b; margin: 0; }
.amount { font-size: 1.8rem; font-weight: 800; color: #1a1a1a; margin: 10px 0; }
.stat-footer { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; }
.trend.positive { color: var(--color-maurealty-green); }
.sub-label { color: #94a3b8; }
</style>