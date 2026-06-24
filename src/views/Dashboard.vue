<template>
  <div class="w-full dashboard-container">
    <div class="main-content">
      <div class="welcome-section">
        <div class="header-flex">
          <div class="header-title">
            <h1 class="welcome-message">Welcome back, {{agentName}} </h1>
            <p class="subtitle">Dashboard > <span class="text-blue">Senior Agent</span></p>
          </div>
          <!-- <div class="quick-actions-top">
            <button class="btn-action primary" @click="activeModal = 'addListing'">+ Add Listing</button>
            <button class="btn-action secondary" @click="activeModal = 'addAgent'">+ Add Agent</button>
            <div class="divider-v"></div>
            <button class="btn-action calculator-btn" @click="activeModal = 'calculator'">Calculator</button>
          </div> -->
        </div>
      </div>

      <div class="DataTabs">
        <div class="stats-grid">
          <StatCard 
            v-for="stat in metrics" 
            :key="stat.label" 
            :stat="stat" 
            @click="expandMetric(stat)" 
          />
        </div>

        <div class="dashboard-grid">
          <div class="left-column">
            <SalesPerformance @open-details="openDetails(performanceData, 'performance')" />
            <RecentActivity 
              :activities="activities" 
              @view-item="(item) => openDetails(item, 'activity')"
              @view-all="openDetails(activities, 'activity_all')"
            />
          </div>

          <div class="right-column">
            <GenealogyCard :downline="downline" @view-full="openDetails(null, 'genealogy_full')" />
            <Reminders :reminders="reminders" @view-all="openDetails(reminders, 'reminders_all')" />
          </div>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="selectedItem || selectedMetric || activeModal" class="modal-overlay" @click.self="closeAll">
        
        <div v-if="activeModal" class="modal-content">
          <button class="close-x" @click="activeModal = null">✕</button>
          <AddListing v-if="activeModal === 'addListing'" />
          <AddAgent v-if="activeModal === 'addAgent'" />
          <Calculator v-if="activeModal === 'calculator'" />
        </div> 

        <div v-else-if="selectedMetric" class="modal-content analytics-modal">
          <button class="close-x" @click="selectedMetric = null">✕</button>
          <div class="modal-header-detail">
            <h2 class="modal-title">{{ selectedMetric.label }} Analysis</h2>
          </div>
          </div>

        <div v-else-if="selectedItem" class="modal-content detail-modal">
           <button class="close-x" @click="closeAll">✕</button>
           </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { supabase } from '@/supabaseClient'
// Component Imports
import StatCard from '@/components/dashboard/DashboardStatCard.vue';
import SalesPerformance from '@/components/dashboard/SalesPerfromance.vue';
import RecentActivity from '@/components/dashboard/RecentActivity.vue';
import GenealogyCard from '@/components/dashboard/GenealogyCard.vue';
import Reminders from '@/components/dashboard/Reminders.vue';
import AddListing from '@/components/dashboard/AddListing.vue';
import AddAgent from '@/components/dashboard/AddAgent.vue';
import Calculator from '@/components/dashboard/Calculator.vue';

// State
const selectedItem = ref<any>(null);
const selectedMetric = ref<any>(null);
const activeModal = ref<string | null>(null); // For forms
const modalType = ref('');
const agent_ID = ref('');
const agentName = ref ('');

// Data (Keep original structure)
const metrics = ref([
  { label: 'TOTAL LISTINGS', value: '42', trend: '+12%', sub: 'vs last month', type: 'positive' },
  { label: 'COMMISSION (NET)', value: '$38,420', trend: '85%', sub: 'Target: $45k', type: 'positive' },
  { label: 'TEAM SALES', value: '$1.2M', trend: '+5.4%', sub: 'Downline contrib.', type: 'positive' },
  { label: 'ACTIVE DEALS', value: '8', trend: '3', sub: 'Pending approval', type: 'neutral' }
]);

const performanceData = ref({ title: "Performance Data", id: "perf-1" });
const activities = ref([/* same as your original array */]);
const reminders = ref([/* same as your original array */]);
const downline = ref([/* same as your original array */]);

// Handlers
const expandMetric = (stat: any) => { selectedMetric.value = stat; };
const openDetails = (item: any, type: string) => {
  selectedItem.value = item || { id: 'temp' };
  modalType.value = type;
};
const closeAll = () => {
  selectedItem.value = null;
  selectedMetric.value = null;
  activeModal.value = null;
};

// Scroll Lock
watch([selectedItem, selectedMetric, activeModal], ([item, metric, modal]) => {
  document.body.style.overflow = (item || metric || modal) ? 'hidden' : '';
});
onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const authId = user.id

      const { data, error } = await supabase
        .from('agents')
        .select('agent_ID, first_name, last_name')
        .eq('user_id', authId)
        .single()

      if (error) throw error

      if (data) {
        agentName.value = `${data.first_name} ${data.last_name}`
        agent_ID.value = String(data.agent_ID) 
      }
    } else {
      agentName.value = 'Guest'
      agent_ID.value = 'N/A'
    }

  } catch (error) {
    console.error("Error fetching agent profile:", error)
    agentName.value = "Unknown Agent"
  }
})
</script>

<style scoped>
@import "@/style.css";

.dashboard-container { display: flex; min-height: 100vh; background: var(--color-background-gray); }
.main-content { flex: 1; display: flex; flex-direction: column; }
.welcome-section { background: white; padding: 1.5rem 2.5rem; border-bottom: 1px solid #e1e4e8; }
.header-flex { display: flex; justify-content: space-between; align-items: center; }
.DataTabs { padding: 2rem 2.5rem; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
.dashboard-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
.left-column { display: flex; flex-direction: column; gap: 2rem; }
.mt-8 { margin-top: 2rem; }

.welcome-message {
  font-size: 30px;
  color: var(--color-maurealty-blue);
  font-weight: bold;
}

.header-title {
  font: Poppins;
}

/* Modal Styles */
.modal-overlay { 
  position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
  background: rgba(10, 61, 98, 0.7); backdrop-filter: blur(8px); 
  display: flex; align-items: center; justify-content: center; z-index: 9999;
}
.modal-content { background: white; border-radius: 24px; position: relative; }

/* Container for the buttons */
.quick-actions-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Base button styles */
.btn-action {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

/* 1. Add Listing (Blue) */
.btn-action.primary {
  background-color: #0066ff;
  color: white;
}
.btn-action.primary:hover {
  background-color: #0052cc;
}

/* 2. Add Agent (Light Green) */
.btn-action.secondary {
  background-color: #e6f4ea;
  color: #1e8e3e;
}
.btn-action.secondary:hover {
  background-color: #d4eeda;
}

/* 3. Calculator (White/Bordered) */
.btn-action.calculator-btn {
  background: white;
  border: 1px solid #dcdcdc;
  color: #4a4a4a;
}
.btn-action.calculator-btn:hover {
  background: #f8f9fa;
  border-color: #bbb;
}

/* Vertical Divider */
.divider-v {
  width: 1px;
  height: 24px;
  background-color: #e1e4e8;
  margin: 0 4px;
}

</style>