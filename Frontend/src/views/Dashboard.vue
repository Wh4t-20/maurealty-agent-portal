<template>
  <div class="dashboard-container">
    <!-- Main Content -->
    <div class="main-content">

      <div class="welcome-section">
        <h1>Welcome back, {{ agentName }}</h1>
      </div>

      <div class = "DataTabs">
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <h3>RECEIVABLES</h3>
            <div class="amount">$ 10,000</div>
          </div>
          
          <div class="stat-card">
            <h3>TOTAL SALES</h3>
            <div class="amount">$ 700,000</div>
          </div>
          
          <div class="stat-card">
            <h3>QUOTA</h3>
            <div class="amount">$ 700,000 / $ 1,000,000</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{width: '70%'}"></div>
            </div>
            <div class="percentage">70%</div>
            <button class="update-btn">Update Quota</button>
          </div>
        </div>

        <!-- Sales Performance -->
        <div class="sales-section">
          <h2>SALES PERFORMANCE</h2>
          <div class="chart-placeholder">
            <!-- Chart would go here -->
            <div class="mock-chart"></div>
          </div>
        </div>

        <!-- Level Up Section -->
        <div class="levelup-section">
          <h2>LEVEL UP</h2>
          <div class="levelup-card">
            <div class="total-sales">TOTAL SALES: $ 700,000.00</div>
            <div class="next-promo">
              Reach $ 1,000,000.00 to reach next promotion
            </div>
            <div class="current-rank">
              CURRENT RANK: #5 Kenji Bad BoyBoy
            </div>
          </div>
        </div>

        <div class="support-note">
          Any issues?
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const agentName = ref('{[ Agent.Frontname ]}')
</script>

<style scoped>
.dashboard-container {
  display: flex;
  min-height: 100vh;
  background: #f6f7fb;
  font-family: 'Poppins', sans-serif;
}

.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #0A3D62 0%, #0A3D62 100%);
  color: white;
  display: flex;
  flex-direction: column;
}

.company-brand {
  display: flex;
  flex-direction: column;
  align-items: center;   /* centers horizontally */
  text-align: center;
}

.company-brand h1 {
  font-size: 1.8rem;
  margin: 0;
  color: #e74c3c;
}

.company-brand h2 {
  font-size: 1.4rem;
  margin: 0;
  margin-bottom: 1rem;
}

.logo {
  margin-bottom: 40px;
  margin-top: 20px;
  width: 200px;    
}

.profile-pic {
  width: 100px;           /* adjust size as needed */
  height: 100px;
  border-radius: 50%;    /* makes it circular */
  object-fit: cover;
  margin-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #fff; /* optional: adds a white border ring */
}

.agent-name {
  font-size: 1rem;
  color: white;
}

.agent-rank {
  font-size: 1rem;
  text-align: center;
  color: white;
}

.sidebar-nav {
  width: 280px;
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
}

.nav-item {
  text-decoration: none;
  color: white;
  padding: 10px;
  width: 100%;
  border-radius: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  transition: 0.3s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.23);
}

.SidebarFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  margin-bottom: 10px;
}

.settings-btn {
  display: flex;
  background: transparent;
  color: white;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
  margin-right: 10px;
}

.settings-btn img {
  width: 24px;
  height: 24px;
}

.signout-btn {
  display: flex;
  background: transparent;
  color: white;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
  margin-left: 10px;
  gap: 5px;
}

.signout-btn img {
  display: flex;
  width: 18px;
  height: 18px;
  margin-top: auto;
  margin-bottom: 2.5px;
}

.settings-btn:hover,
.signout-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.main-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.DataTabs {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.welcome-section {
  width: 100%;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: 0.3s;
  margin-bottom: 1.5rem;
  padding: 1.5rem 2rem;
}

.welcome-section h1 {
  padding: 1.5rem;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-card h3 {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
}

.progress-bar {
  background: #ecf0f1;
  height: 8px;
  border-radius: 4px;
  margin: 1rem 0;
  overflow: hidden;
}

.progress-fill {
  background: #27ae60;
  height: 100%;
  transition: width 0.3s;
}

.percentage {
  text-align: center;
  font-weight: 600;
  color: #27ae60;
}

.update-btn {
  width: 100%;
  background: #3498db;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 0.5rem;
}

.sales-section,
.levelup-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.sales-section h2,
.levelup-section h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.chart-placeholder {
  height: 200px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mock-chart {
  width: 90%;
  height: 80%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 4px;
}

.levelup-card {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  padding: 1rem;
  border-radius: 8px;
}

.total-sales {
  font-weight: 600;
  color: #856404;
  margin-bottom: 0.5rem;
}

.next-promo {
  color: #856404;
  margin-bottom: 0.5rem;
}

.current-rank {
  font-weight: 600;
  color: #e74c3c;
}

.support-note {
  text-align: center;
  color: #7f8c8d;
  margin-top: 2rem;
}
</style>