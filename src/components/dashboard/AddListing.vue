<template>
  <div class="form-modal">
    <h2>Add New Property Listing</h2>
    <input type="text" placeholder="Property Name" class="form-input" />
    <input type="number" placeholder="Price" class="form-input" />
    <button class="btn-action primary">Submit Listing</button>
  </div>
</template>

<style scoped>
.form-modal { padding: 2rem; display: flex; flex-direction: column; gap: 15px; }
.form-input { padding: 10px; border: 1px solid #ddd; border-radius: 8px; }
</style>