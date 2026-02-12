<template>
  <div class=" w-full accounting-container">
    <!-- MAIN CONTENT AREA -->
    <div class="main-content">
      <h1 class="page-title">ACCOUNTING</h1>

      <div class="accounting-layout">
        <!-- LEFT SIDE (CALCULATOR + NOTICES) -->
        <div class="left-side">
          <!-- Calculator -->
          <div class="card calculator">
            <h2 class="card-title">CALCULATOR</h2>

            <div class="calc-header">
              <label class="calc-label">BIR Tax Calculator:</label>
              <select class="calc-dropdown">
                <option>BIR</option>
                <option>Mortgage</option>
                <option>Taxes</option>
              </select>
            </div>

            <div class="calc-display">
              <span class="peso-symbol">₱</span>
              <input type="text" class="calc-input large" value="1,000,000,000.00" readonly />
            </div>

            <div class="calc-inputs">
              <div class="input-pair">
                <label>Mass Profits (m)</label>
                <input type="text" value="15,625,000.00" readonly />
              </div>
              <div class="input-pair">
                <label>Net Commission (c)</label>
                <input type="text" value="8.00" readonly />
              </div>
              <div class="input-pair">
                <label>Commission Tax (optional)</label>
                <input type="text" value="0.25" readonly />
              </div>
            </div>
          </div>

          <!-- Red Flag Notices -->
          <div class="card notices">
            <h2 class="card-title red">RED FLAG NOTICES</h2>
            <div class="notice">
              <span class="flag">🚩</span>
              <span class="text">Lacking Voucher</span>
              <span class="date">09/15/2025</span>
            </div>
            <div class="notice">
              <span class="flag">🚩</span>
              <span class="text">Wrong Expenses L.</span>
              <span class="date">09/15/2025</span>
            </div>
            <div class="notice">
              <span class="flag">🚩</span>
              <span class="text">Quota Due Coming</span>
              <span class="date">08/15/2025</span>
            </div>
          </div>
        </div>

        <!-- RIGHT SIDE (EXPENSES + CHECKS + RECEIPTS) -->
        <div class="right-side">
          <!-- Monthly Expenses -->
          <div class="card expenses">
            <h2 class="card-title">MONTHLY EXPENSES</h2>

            <div class="expenses-header">
              <div class="filters">
                <label>Filters:</label>
                <select class="filter-select">
                  <option>Ascending</option>
                  <option>Descending</option>
                </select>
                <select class="filter-select">
                  <option>Type</option>
                  <option>Fixed</option>
                  <option>Utilities</option>
                  <option>Taxes</option>
                </select>
              </div>
              <span class="search-icon">🔍</span>
            </div>

            <div class="expense-row">
              <span class="type">Fixed</span>
              <span class="amount">₱ 10,000,000.00</span>
            </div>
            <div class="expense-row">
              <span class="type">Utilities</span>
              <span class="amount negative">₱ 10,000,000.00</span>
            </div>
            <div class="expense-row">
              <span class="type">Taxes</span>
              <span class="amount negative">₱ 9,876,543.21</span>
            </div>
          </div>

          <!-- Checks -->
          <div class="card checks">
            <h2 class="card-title">CHECKS</h2>
            <div class="list-item">110145162157 <span class="info">ⓘ</span></div>
            <div class="list-item">103157154145 <span class="info">ⓘ</span></div>
            <div class="list-item">103141162154 <span class="info">ⓘ</span></div>
          </div>

          <!-- Receipts -->
          <div class="card receipts">
            <h2 class="card-title">RECEIPTS</h2>
            <div class="list-item">
              <span class="code">TWFltUmVhbHR5</span>
              <span class="date">09/15/2025</span>
              <span class="info">ⓘ</span>
            </div>
            <div class="list-item">
              <span class="code">QmlsbHlfKZWU</span>
              <span class="date">08/27/2025</span>
              <span class="info">ⓘ</span>
            </div>
            <div class="list-item">
              <span class="code">emVyby96ZXJv</span>
              <span class="date">06/31/2025</span>
              <span class="info">ⓘ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Future tax calculation logic can be implemented here
</script>

<style scoped>
.accounting-container {
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

/* Main Area */
.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.page-title {
  font-size: 2rem;
  color: #1e2a5a;
  margin-bottom: 1.5rem;
  font-weight: 700;
}

/* ============= GRID LAYOUT ============= */
.accounting-layout {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 1.5rem;
}

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e2a5a;
  margin-bottom: 1rem;
}

.card-title.red {
  color: #e74c3c;
}

/* ============= CALCULATOR ============= */
.calculator .calc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.calc-label {
  font-weight: 600;
  color: #2c3e50;
}

.calc-dropdown {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 4px 8px;
}

.calc-display {
  position: relative;
  margin-bottom: 1rem;
}

.peso-symbol {
  position: absolute;
  left: 12px;
  top: 8px;
  color: #2c3e50;
  font-weight: 700;
}

.calc-input.large {
  width: 100%;
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e2a5a;
  padding: 0.6rem 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-align: right;
}

.calc-inputs .input-pair {
  margin-bottom: 0.8rem;
}

.input-pair label {
  display: block;
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.3rem;
}

.input-pair input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fafafa;
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
  border: 1px solid #ddd;
  padding: 4px 6px;
  font-size: 0.85rem;
}

.search-icon {
  font-size: 1.2rem;
  cursor: pointer;
}

.expense-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
  border-bottom: 1px solid #f1f1f1;
}

.expense-row:last-child {
  border-bottom: none;
}

.type {
  font-weight: 600;
  color: #2c3e50;
}

.amount {
  font-weight: 700;
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
  border-bottom: 1px solid #f1f1f1;
  padding: 0.4rem 0;
}

.flag {
  color: red;
  font-size: 1rem;
}

.text {
  flex: 1;
  margin-left: 0.5rem;
  color: #2c3e50;
}

.date {
  font-size: 0.85rem;
  color: #7f8c8d;
}

/* ============= CHECKS & RECEIPTS ============= */
.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f1f1;
  padding: 0.5rem 0;
}

.list-item:last-child {
  border-bottom: none;
}

.info {
  color: #555;
  font-size: 0.9rem;
}

.code {
  font-family: 'Courier New', monospace;
  color: #2c3e50;
  font-size: 0.9rem;
}

.right-side .card {
  margin-bottom: 1rem;
}
</style>
