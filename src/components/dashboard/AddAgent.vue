<template>
  <div class="form-modal">
    <h2>Invite New Agent</h2>
    <input type="email" placeholder="Agent Email Address" class="form-input" />
    <select class="form-input">
      <option>Junior Agent</option>
      <option>Senior Agent</option>
    </select>
    <button class="btn-action secondary">Send Invitation</button>
  </div>
</template>

<style scoped>
.form-modal { padding: 2rem; display: flex; flex-direction: column; gap: 15px; }
.form-input { padding: 10px; border: 1px solid #ddd; border-radius: 8px; }
</style>