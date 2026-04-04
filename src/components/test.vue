<template>
  <div class="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md border border-green-200">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-blue-800">DEVELOPERS</h2>
      <div class="flex items-center space-x-3">
        <input
          type="text"
          placeholder="Search Developer"
          class="border border-blue-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button class="bg-blue-800 text-white px-4 py-1 rounded hover:bg-blue-700 flex items-center space-x-1">
          <span>+</span>
          <span>Add Developer</span>
        </button>
        <img
          src="https://via.placeholder.com/40"
          alt="user"
          class="w-10 h-10 rounded-full border"
        />
      </div>
    </div>

    <!-- Developer Info Card -->
    <div class="p-4 border rounded-lg shadow-sm grid grid-cols-2 gap-4 items-start">
      <!-- Profile Image & Name -->
      <div class="col-span-2 flex items-center space-x-4 mb-2">
        <img
          src="https://via.placeholder.com/60"
          alt="profile"
          class="w-16 h-16 rounded-full border"
        />
        <div>
          <h3 class="text-lg font-semibold">Ayala Land Inc.</h3>
          <span class="bg-green-200 text-green-800 px-2 py-0.5 rounded text-sm">Active</span>
        </div>
        <button class="ml-auto p-1 border rounded hover:bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M16 3l5 5M16 3h5v5"/>
          </svg>
        </button>
      </div>

      <!-- Contact Info -->
      <div>
        <label class="block text-sm font-medium mb-1">Contact Number:</label>
        <input type="text" class="w-full border border-blue-200 rounded px-3 py-1 bg-blue-50" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Location:</label>
        <input type="text" class="w-full border border-blue-200 rounded px-3 py-1 bg-blue-50" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Email:</label>
        <input type="text" class="w-full border border-blue-200 rounded px-3 py-1 bg-blue-50" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Office Days:</label>
        <input type="text" class="w-full border border-blue-200 rounded px-3 py-1 bg-blue-50" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Recent Projects:</label>
        <div class="flex flex-wrap gap-2 mb-2">
          <span class="bg-gray-200 px-2 py-1 rounded text-sm">Ayala</span>
          <span class="bg-gray-200 px-2 py-1 rounded text-sm">Ayala</span>
          <span class="bg-gray-200 px-2 py-1 rounded text-sm">Ayala</span>
          <button class="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center">+</button>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Office Hours:</label>
        <input type="text" class="w-full border border-blue-200 rounded px-3 py-1 bg-blue-50" />
      </div>

      <!-- Action Buttons -->
      <div class="col-span-2 flex justify-end space-x-3 mt-4">
        <button class="px-4 py-2 border rounded hover:bg-gray-100">CANCEL</button>
        <button class="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-700 flex items-center space-x-1">
          <span>★</span>
          <span>SAVE EDIT</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// You can add reactive state or props for the developer info
</script>
