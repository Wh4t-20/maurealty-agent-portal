<template>
  <div class="genealogy-card hover-animate clickable" @click="$emit('view-full')">
    <div class="section-header">
      <h2>GENEALOGY</h2>
      <button class="mini-tag">Full Page</button>
    </div>
    <div class="upline-section">
      <label>UPLINE BROKER</label>
      <div class="member-mini-item">
        <div class="avatar">JD</div>
        <div class="info">
          <p class="name">Carl Santillan</p>
          <p class="meta">5% Override</p>
        </div>
      </div>
    </div>
    <div class="mini-tree-container">
      <div class="node broker">JD</div>
      <div class="tree-line"></div>
      <div class="node user active">YOU</div>
    </div>
    <div class="downline-section">
      <label>MY TEAM ({{ downline.length }})</label>
      <div v-for="agent in downline.slice(0, 2)" :key="agent.name" class="member-mini-item">
        <span class="name">{{ agent.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ downline: any[] }>();
defineEmits(['view-full']);
</script>

<style scoped>
.genealogy-card { background: var(--color-maurealty-blue); padding: 1.5rem; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); cursor: pointer; transition: all 0.3s ease; color: white;}
.genealogy-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.08); }
.avatar { width: 35px; height: 35px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.node { width: 40px; height: 25px; border-radius: 4px; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.2); }
.node.user { background: var(--color-maurealty-green); width: 60px; }
.tree-line { width: 2px; height: 10px; background: rgba(255,255,255,0.3); }
</style>