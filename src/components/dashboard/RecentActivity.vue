<template>
  <div class="activity-card">
    <div class="header-row">
      <h3>RECENT ACTIVITY</h3>
      <button class="view-all-link" @click="$emit('view-all')">View All</button>
    </div>

    <div v-for="act in activities.slice(0, 3)" :key="act.id" class="feed-item" @click="$emit('view-item', act)">
      <div class="feed-bullet" :class="act.type"></div>
      <div class="feed-body">
        <p><strong>{{ act.title }}</strong> {{ act.desc }}</p>
        <span class="time">{{ act.time }}</span>
      </div>
      <span class="chevron">›</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ activities: any[] }>();
defineEmits(['view-item', 'view-all']);
</script>

<style scoped>
.activity-card { 
  background: white; 
  border-radius: 16px; 
  border: 1px solid #e1e4e8;
  padding: 1.5rem;
}

.header-row { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 1.5rem;
}

h3 { 
  font-size: 0.9rem; 
  color: #1a1a1a; 
  margin: 0;
  letter-spacing: 0.5px;
}

.view-all-link { 
  background: none; 
  border: none; 
  color: #4a90e2; /* Matches the blue link style */
  font-size: 0.85rem; 
  cursor: pointer; 
  font-weight: 500;
}

.view-all-link:hover { text-decoration: underline; }

.feed-item { 
  display: flex; 
  align-items: flex-start; /* Aligns bullet with text top */
  padding: 1rem 0; 
  border-bottom: 1px solid #f0f2f5; 
  cursor: pointer; 
}

.feed-item:last-child { border-bottom: none; }

.feed-bullet { 
  width: 8px; 
  height: 8px; 
  border-radius: 50%; 
  margin-top: 6px; 
  margin-right: 12px; 
  flex-shrink: 0;
}

/* Bullet Colors */
.feed-bullet.money { background: var(--color-maurealty-green); }
.feed-bullet.lead { background: var(--color-maurealty-blue); }

.feed-body { flex-grow: 1; }
.feed-body p { margin: 0; font-size: 0.9rem; color: #2d3748; }
.feed-body .time { font-size: 0.75rem; color: #a0aec0; }

.chevron { 
  color: #cbd5e0; 
  font-size: 1.2rem; 
  align-self: center; 
  margin-left: 10px; 
}

.activity-card { background: white; padding: 1.5rem; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); cursor: pointer; transition: all 0.3s ease;}
.activity-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.08); }
</style>