<template>
  <div class="notifications-card mt-4 hover-animate clickable" @click="$emit('view-all')">
    <h3 class="card-title">REMINDERS</h3>
    
    <div v-for="(rem, index) in reminders.slice(0, 3)" :key="index" 
         class="notif-pill" :class="{ urgent: rem.urgent }">
      {{ rem.text }}
    </div>

    <div v-if="reminders.length > 3" class="notif-pill stack-pill">
      + {{ reminders.length - 3 }} more tasks...
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ reminders: any[] }>();
defineEmits(['view-all']);
</script>

<style scoped>
.notifications-card { 
  background: white; 
  padding: 1.25rem; 
  border-radius: 16px; 
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.card-title { 
  font-size: 0.85rem; 
  color: #1a1a1a; 
  margin-bottom: 1rem; 
  letter-spacing: 0.5px;
}

.notif-pill { 
  padding: 10px 12px; 
  background: #f8f9fa; /* Light grey */
  border-radius: 8px; 
  font-size: 0.8rem; 
  margin-bottom: 8px; 
  color: #4a5568;
  transition: background 0.2s;
}

/* Urgent style matching the screenshot (Red/Pinkish) */
.notif-pill.urgent { 
  background: #fff5f5; 
  color: #e53e3e; 
  font-weight: 500;
  border: 1px solid #fed7d7;
}

.stack-pill {
  background: transparent;
  color: #718096;
  text-align: center;
  border: 1px dashed #cbd5e0;
  font-size: 0.75rem;
}

.clickable { cursor: pointer; }
.hover-animate:hover { transform: translateY(-2px); transition: 0.2s; }

.notifications-card { background: white; padding: 1.5rem; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); cursor: pointer; transition: all 0.3s ease;}
.notifications-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.08); }
</style>