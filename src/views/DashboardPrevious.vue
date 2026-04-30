<template>
  <div class="w-full dashboard-container">
    <div class="main-content">
      <div class="welcome-section">
        <div class="header-flex">
          <div>
            <h1>Welcome back, {{ agentName }}</h1>
            <p class="subtitle">Dashboard > <span class="text-blue">Senior Agent</span></p>
          </div>
          <div class="quick-actions-top">
            <button class="btn-action primary" @click="openForm('listing')">
              <span class="btn-icon">+</span> Add Listing
            </button>
            <button class="btn-action secondary" @click="openForm('lead')">
              <span class="btn-icon">+</span> Add Agent
            </button>
            <div class="divider-v"></div>
            <button class="btn-action calculator-btn" @click="showCalc = true">
              <span class="emoji-icon"></span> Calculator
            </button>
          </div>
        </div>
      </div>

      <div class="DataTabs">
        <div class="stats-grid">
          <div 
            class="stat-card clickable-expansion hover-animate" 
            v-for="stat in metrics" 
            :key="stat.label"
            @click="expandMetric(stat)"
          >
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
        </div>

        <div class="dashboard-grid">
          <div class="left-column">
            <div class="glass-card performance-section hover-animate clickable" @click="openDetails(performanceData, 'performance')">
              <div class="section-header">
                <h2>SALES PERFORMANCE</h2>
                <div class="chart-metrics">
                  <span>Conv: <strong>3.2%</strong></span>
                  <span>Avg Deal: <strong>$450k</strong></span>
                </div>
              </div>
              <div class="chart-container">
                <div v-for="(val, i) in [40, 70, 45, 90, 65, 80, 95]" :key="i" 
                     class="bar-wrapper" :title="'Day ' + i">
                  <div class="bar-fill" :style="{ height: val + '%' }"></div>
                </div>
              </div>
            </div>

            <div class="section-header mt-8">
              <h2>RECENT ACTIVITY</h2>
              <button class="text-link" @click="openDetails(activities, 'activity_all')">View All</button>
            </div>
            <div class="activity-feed hover-animate">
              <div v-for="act in activities.slice(0, 3)" :key="act.id" class="feed-item" @click="openDetails(act, 'activity')">
                <div class="feed-bullet" :class="act.type"></div>
                <div class="feed-body">
                  <p><strong>{{ act.title }}</strong> {{ act.desc }}</p>
                  <span class="time">{{ act.time }}</span>
                </div>
                <span class="chevron">›</span>
              </div>
            </div>
          </div>

          <div class="right-column">
            <div class="genealogy-card hover-animate clickable" @click="openDetails(null, 'genealogy_full')">
              <div class="section-header">
                <h2>GENEALOGY</h2>
                <button class="mini-tag">Full Page</button>
              </div>

              <div class="upline-section">
                <label>UPLINE BROKER</label>
                <div class="member-mini-item upline">
                  <div class="avatar">JD</div>
                  <div class="info">
                    <p class="name">Carl Santillan</p>
                    <p class="meta">5% Override | $2.4M Team</p>
                  </div>
                </div>
              </div>

              <div class="mini-tree-container">
                <div class="node broker">JD</div>
                <div class="tree-line"></div>
                <div class="node user active">YOU</div>
                <div class="tree-connector"></div>
                <div class="downline-row">
                  <div class="node agent"></div>
                  <div class="node agent"></div>
                  <div class="node agent"></div>
                </div>
              </div>

              <div class="downline-section">
                <label>MY TEAM ({{ downline.length }})</label>
                <div v-for="agent in downline.slice(0, 2)" :key="agent.name" 
                     class="member-mini-item">
                  <div class="agent-main-row">
                    <span class="name">{{ agent.name }}</span>
                    <span class="sales">${{ agent.sales }}k</span>
                  </div>
                </div>
              </div>
              
              <button class="add-team-btn" @click.stop="openForm('downline')">+ Add Downline Agent</button>
            </div>

            <div class="notifications-card mt-4 hover-animate clickable" @click="openDetails(reminders, 'reminders_all')">
              <h3>REMINDERS</h3>
              <div v-for="(rem, index) in reminders.slice(0, 3)" :key="index" 
                   class="notif-pill" :class="{ urgent: rem.urgent }">
                {{ rem.text }}
              </div>
              <div v-if="reminders.length > 3" class="notif-pill stack-pill">
                + {{ reminders.length - 3 }} more tasks... <span class="view-all-text">View All</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="selectedItem || selectedMetric" class="modal-overlay" @click.self="closeAllModals">
        
        <div v-if="selectedMetric" class="modal-content analytics-modal">
          <button class="close-x" @click="selectedMetric = null">✕</button>
          <div class="modal-header-detail">
            <span class="modal-icon-bg">{{ selectedMetric.icon }}</span>
            <div>
              <h2 class="modal-title">{{ selectedMetric.label }} Analysis</h2>
              <p class="modal-subtitle">Real-time performance tracking and history</p>
            </div>
          </div>
          <div class="modal-body">
            <div class="detail-summary-grid">
              <div class="summary-box">
                <label>Current Value</label>
                <div class="val">{{ selectedMetric.value }}</div>
              </div>
              <div class="summary-box">
                <label>Growth (MTD)</label>
                <div class="val text-green">{{ selectedMetric.trend }}</div>
              </div>
              <div class="summary-box">
                <label>Target Progress</label>
                <div class="progress-bar-container">
                  <div class="progress-fill" style="width: 75%;"></div>
                </div>
              </div>
            </div>
            <div class="detail-table-container">
              <h3>Recent Breakdown</h3>
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>Source / Property</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="n in 3" :key="n">
                    <td>Metropolis Subdivision - Unit {{ 100 + n }}</td>
                    <td>Apr {{ 20 + n }}, 2026</td>
                    <td><span class="status-pill">Verified</span></td>
                    <td>₱ 150,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="action-btn primary">Export Report</button>
            <button class="action-btn outline" @click="selectedMetric = null">Close</button>
          </div>
        </div>

        <div v-else-if="selectedItem" class="modal-content detail-modal">
          <button class="close-x" @click="closeDetails">✕</button>
          
          <div v-if="modalType === 'performance'">
             <h2 class="modal-title">Sales Performance History</h2>
             <div class="stats-row">
                <div class="stat"><label>Daily Peak</label><div class="val">$95k</div></div>
                <div class="stat"><label>Avg Daily</label><div class="val">$62k</div></div>
                <div class="stat"><label>Monthly Projection</label><div class="val">$1.8M</div></div>
             </div>
             <div class="chart-container large">
                <div v-for="(val, i) in [40, 70, 45, 90, 65, 80, 95]" :key="i" class="bar-wrapper">
                  <div class="bar-fill" :style="{ height: val + '%' }"></div>
                </div>
             </div>
             <p class="mt-8 long-desc">Detailed analytics showing consistent growth over the last 7 business days. Your conversion rate is 0.5% higher than the brokerage average.</p>
          </div>

          <div v-if="modalType === 'activity'">
            <span class="category-tag">{{ selectedItem.type.toUpperCase() }}</span>
            <h2 class="modal-title">{{ selectedItem.title }}</h2>
            <div class="modal-grid">
              <div class="detail-box"><label>Status</label><p>Completed</p></div>
              <div class="detail-box"><label>Timestamp</label><p>{{ selectedItem.time }}</p></div>
            </div>
            <div class="description-area mt-4">
              <label>Full Details</label>
              <p class="long-desc">{{ selectedItem.longDesc }}</p>
            </div>
          </div>

          <div v-if="modalType === 'activity_all'">
            <h2 class="modal-title">Activity Timeline</h2>
            <div class="activity-feed mt-4">
              <div v-for="act in activities" :key="act.id" class="feed-item">
                <div class="feed-bullet" :class="act.type"></div>
                <div class="feed-body">
                  <p><strong>{{ act.title }}</strong> {{ act.desc }}</p>
                  <span class="time">{{ act.time }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="modalType === 'genealogy_full'">
            <h2 class="modal-title">Network Organization</h2>
            <div class="stats-row">
               <div class="stat"><label>Direct Agents</label><div class="val">{{ downline.length }}</div></div>
               <div class="stat"><label>Team Volume</label><div class="val">$1.2M</div></div>
            </div>
            <div class="agent-list-expanded">
               <div v-for="agent in downline" :key="agent.name" class="member-mini-item clickable">
                  <div class="avatar">{{ agent.name.charAt(0) }}</div>
                  <div class="info">
                    <p class="name">{{ agent.name }} - {{ agent.rank }}</p>
                    <p class="meta">Sales: ${{ agent.sales }}k | Override: {{ agent.override }}%</p>
                  </div>
               </div>
            </div>
          </div>

          <div v-if="modalType === 'reminders_all'">
            <h2 class="modal-title">Task Checklist</h2>
            <div class="reminder-list-full mt-4">
               <div v-for="(rem, i) in reminders" :key="i" class="notif-pill" :class="{ urgent: rem.urgent }">
                  <div class="flex-between">
                    <span>{{ rem.text }}</span>
                    <button class="mini-tag">Mark Done</button>
                  </div>
               </div>
            </div>
          </div>

          <div v-if="modalType === 'agent'">
            <div class="agent-modal-header">
              <div class="large-avatar">{{ selectedItem.name.charAt(0) }}</div>
              <div>
                <h2 class="modal-title">{{ selectedItem.name }}</h2>
                <p class="rank-label">{{ selectedItem.rank }}</p>
              </div>
            </div>
            <div class="stats-row">
              <div class="stat"><label>Total Sales</label><div class="val">${{ selectedItem.sales }}k</div></div>
              <div class="stat"><label>Override %</label><div class="val">{{ selectedItem.override }}%</div></div>
              <div class="stat"><label>Active Deals</label><div class="val">{{ selectedItem.deals }}</div></div>
            </div>
            <div class="action-grid-modal">
              <button class="modal-btn">Assign Lead</button>
              <button class="modal-btn outline">Message Agent</button>
            </div>
          </div>

        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const agentName = ref('Kenji Bad BoyBoy')
const selectedItem = ref<any>(null)
const selectedMetric = ref<any>(null)
const modalType = ref('')
const showCalc = ref(false)

// Data
const metrics = ref([
  { label: 'TOTAL LISTINGS', value: '42', trend: '+12%', sub: 'vs last month', type: 'positive' },
  { label: 'COMMISSION (NET)', value: '$38,420', trend: '85%', sub: 'Target: $45k', type: 'positive' },
  { label: 'TEAM SALES', value: '$1.2M', trend: '+5.4%', sub: 'Downline contrib.', type: 'positive' },
  { label: 'ACTIVE DEALS', value: '8', trend: '3', sub: 'Pending approval', type: 'neutral' }
])

const performanceData = ref({ title: "Performance Data", id: "perf-1" });

const activities = ref([
  { id: 1, type: 'money', title: 'Commission Released', desc: 'for Unit 401 Summer Ph2', time: '2 hours ago', longDesc: 'The gross commission of $5,400 has been verified. 5% override for upline has been deducted. Net $4,800 is now available in your wallet.' },
  { id: 2, type: 'lead', title: 'New Lead Assigned', desc: 'Angela Bermudez', time: '5 hours ago', longDesc: 'Lead: Angela Bermudez. Source: FB Marketplace. Interested in: 3BR Single Attached Houses in Cebu City.' },
  { id: 3, type: 'lead', title: 'Showing Scheduled', desc: 'for Oceanview Villa', time: '1 day ago', longDesc: 'Client: Ayala. Scheduled for Saturday 10:00 AM.' }
])

const reminders = ref([
  { text: 'Follow-up: Client Ayala (Due)', urgent: true },
  { text: 'Expiring: Oceanview Villa (3d)', urgent: false },
  { text: 'Submit Tax Documents', urgent: false },
  { text: 'Call Joseph Maureal regarding Q2 goals', urgent: false },
  { text: 'Review new listing agreement', urgent: false }
])

const downline = ref([
  { name: 'Angelo Manlangit', rank: 'Senior Agent', sales: 250, deals: 4, override: 3 },
  { name: 'Mariz Castanos', rank: 'Junior Agent', sales: 120, deals: 2, override: 1.5 },
  { name: 'Ryan Retutal', rank: 'Senior Agent', sales: 410, deals: 7, override: 3.5 }
])

// Modal Logic
watch([selectedItem, selectedMetric], ([item, metric]) => {
  document.body.style.overflow = (item || metric) ? 'hidden' : ''
})

const expandMetric = (stat: any) => { selectedMetric.value = stat }

const openDetails = (item: any, type: string) => {
  selectedItem.value = item || { id: 'temp' }
  modalType.value = type
}

const closeDetails = () => { selectedItem.value = null }
const closeAllModals = () => { selectedItem.value = null; selectedMetric.value = null }
const openForm = (type: string) => alert(`Opening ${type} form...`)
</script>

<style scoped>
@import "@/style.css";

/* RE-USING YOUR CSS BASE + NEW ENHANCEMENTS */
.dashboard-container { 
  display: flex; 
  min-height: 100vh; 
  background: var(--color-background-gray); 
  /* font-family removed to inherit Poppins from style.css body */
}
.main-content { flex: 1; display: flex; flex-direction: column; }
.welcome-section { background: white; padding: 1.5rem 2.5rem; border-bottom: 1px solid #e1e4e8; }
.header-flex { display: flex; justify-content: space-between; align-items: center; }
.welcome-section h1 { font-size: 1.6rem; color: #1a1a1a; margin: 0; }
.subtitle { color: #666; font-size: 0.85rem; margin-top: 4px; }
.text-blue { color: var(--color-maurealty-blue); font-weight: 600; }

.DataTabs { padding: 2rem 2.5rem; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
.stat-card { background: white; padding: 1.5rem; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); cursor: pointer; }
.amount { font-size: 1.8rem; font-weight: 800; color: #1a1a1a; margin: 10px 0; }

/*QUICK ACTIONS */
.quick-actions-top { display: flex; align-items: center; gap: 10px; }

.btn-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-action.primary { background: var(--color-maurealty-blue); color: white; }
.btn-action.primary:hover { opacity: 0.9; transform: translateY(-1px); }

.btn-action.secondary { background: var(--color-maurealty-green); color: white; }
.btn-action.secondary:hover { opacity: 0.9; transform: translateY(-1px); }

.btn-action.calculator-btn {
  background: white;
  border: 1px solid #e1e4e8;
  color: #555;
  padding: 8px 14px;
}
.btn-action.calculator-btn:hover { background: #f8f9fa; border-color: #cbd5e0; }

.btn-icon { font-size: 1.1rem; line-height: 1; font-weight: 400; }
.divider-v { width: 1px; height: 24px; background: #e1e4e8; margin: 0 5px; }

/* HOVER ANIMATION FOR ALL CARDS */
.hover-animate {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.hover-animate:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0,0,0,0.08);
}
.clickable { cursor: pointer; }

/* GRID LAYOUT */
.dashboard-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }

/* PERFORMANCE CHART */
.glass-card { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.03); }
.chart-container { height: 180px; display: flex; align-items: flex-end; gap: 12px; padding-top: 20px; }
.chart-container.large { height: 300px; padding: 20px 0; }
.bar-wrapper { flex: 1; background: #f0f2f5; border-radius: 6px; height: 100%; position: relative; overflow: hidden; }
.bar-fill { position: absolute; bottom: 0; width: 100%; background: linear-gradient(180deg, var(--color-maurealty-blue), #2980b9); transition: height 1s ease; }

/* ACTIVITY FEED */
.activity-feed { background: white; border-radius: 16px; overflow: hidden; border: 1px solid #edf2f7; }
.feed-item { display: flex; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #f0f2f5; cursor: pointer; transition: 0.2s; }
.feed-item:hover { background: #f8faff; }
.feed-bullet { width: 10px; height: 10px; border-radius: 50%; margin-right: 15px; }
.feed-bullet.money { background: var(--color-maurealty-green); }
.feed-bullet.lead { background: var(--color-maurealty-blue); }

/* GENEALOGY SIDEBAR */
.genealogy-card { background: var(--color-maurealty-blue); color: white; border-radius: 20px; padding: 1.5rem; }
.upline-section label, .downline-section label { font-size: 0.65rem; color: rgba(255,255,255,0.5); letter-spacing: 1px; }
.avatar { width: 35px; height: 35px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
.mini-tree-container { display: flex; flex-direction: column; align-items: center; padding: 1.5rem 0; }
.node { width: 40px; height: 25px; border-radius: 4px; font-size: 0.6rem; font-weight: bold; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.2); }
.node.user { background: var(--color-maurealty-green); width: 60px; margin: 5px 0; }
.tree-line { width: 2px; height: 10px; background: rgba(255,255,255,0.3); }
.tree-connector { width: 80%; height: 2px; background: rgba(255,255,255,0.3); }
.downline-row { display: flex; gap: 15px; margin-top: 5px; }

/* REMINDERS STACK */
.stack-pill {
  border: 1px dashed #cbd5e0;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.view-all-text { color: var(--color-maurealty-blue); font-weight: 700; font-size: 0.7rem; }

/* MODAL SYSTEM STYLES */
.modal-overlay { 
  position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
  background: rgba(10, 61, 98, 0.7); backdrop-filter: blur(8px); 
  display: flex; align-items: center; justify-content: center; z-index: 9999;
  padding: 2rem 0;
}
.modal-content { 
  background: white; border-radius: 24px; padding: 2.5rem; 
  position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  animation: slideUp 0.3s ease-out; 
}
.analytics-modal { width: 85%; max-width: 850px; }
.detail-modal { width: 90%; max-width: 600px; max-height: 85vh; overflow-y: auto; }

.close-x { 
  position: absolute; top: 20px; right: 20px; background: #f0f2f5; 
  border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; z-index: 10;
}

/* MODAL INTERNAL ELEMENTS */
.modal-header-detail { display: flex; gap: 20px; align-items: center; margin-bottom: 30px; }
.modal-icon-bg { font-size: 2rem; background: #e8f4fd; padding: 15px; border-radius: 16px; }
.detail-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
.summary-box { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #edf2f7; }
.summary-box label { font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
.stats-row { display: flex; justify-content: space-between; background: #f8f9fa; padding: 1.5rem; border-radius: 16px; margin: 1.5rem 0; gap: 10px; }
.stat .val { font-size: 1.2rem; font-weight: 700; color: var(--color-maurealty-blue); }
.stat label { font-size: 0.65rem; color: #888; text-transform: uppercase; }

/* UTILS */
.mt-8 { margin-top: 2rem; }
.mt-4 { margin-top: 1rem; }
.text-green { color: var(--color-maurealty-green); }
.flex-between { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.notif-pill { padding: 12px; background: #f0f2f5; border-radius: 8px; font-size: 0.85rem; margin-bottom: 8px; border-left: 4px solid var(--color-maurealty-blue); }
.notif-pill.urgent { background: #fff5f5; border-left-color: var(--color-maurealty-green); color: var(--color-maurealty-green); }
.mini-tag { background: var(--color-maurealty-blue); color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; cursor: pointer; }

/* ANIMATIONS */
@keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>