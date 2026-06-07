<template>
    <div class="min-h-screen bg-gray-200  ">
      <header class="w-full bg-gradient-to-r from-[#A9D6FF70] to-white shadow-md sticky top-0 z-20">
          <div class="flex justify-between items-center px-10 py-10">
            <h1 class="text-3xl font-bold text-maurealty-blue">
              PROFILE
            </h1>
          </div>
      </header>

      <div class="flex items-center justify-center p-6 mt-10">
        <div class="bg-gray-100 w-full max-w-6xl rounded-2xl shadow-md p-10 flex gap-10">
          <div class="flex items-center justify-center">
            <img
              src="@/assets/images/profile.png"
              alt="Profile"
              class="w-80 h-80 object-cover rounded-full border-4 border-white shadow"
            />
          </div>
  
          <!--face-->
          <div class="flex-1 space-y-3">
            <!-- NAME -->
            <div class = "mt-10">
              <label class="text-blue-800 font-medium text-sm block">Last Name, First Name, Middle Name</label>
              <p class="w-full font-medium text-lg tracking-wider " >
                SANTILLAN, CARL BENEDICT 
              </p>
            </div>
  
            <!--  SEX / AGE / DOB -->
            <div class="grid grid-cols-3 gap-5">
              <div>
                <label class="text-blue-800 font-medium text-sm block">Sex</label>
                <p class="w-full font-medium text-base tracking-wider " >
                  MALE 
                </p>
              </div>
  
            <div>
              <label class="text-blue-800 font-medium text-sm block">Age</label>
              <p class="w-full font-medium text-base tracking-wider " >
                21 
              </p>
            </div>
  
            <div>
              <label class="text-blue-800 font-medium text-sm block">Date of Birth</label>
              <p class="w-full font-medium text-base tracking-wider " >
                SEPTEMBER 18, 2005 
              </p>
            </div>
          </div>
  
            <!-- ADDRESS -->
            <div>
              <label class="text-blue-800 font-medium text-sm block">Address</label>
              <p class="w-full font-normal text-base tracking-wider " >
                LILO-AN CEBU
              </p>
            </div>
  
            <!-- CONTACT / EMAIL / HIRE -->
            <div class="grid grid-cols-3 gap-5">
              <div>
                <label class="text-blue-800 font-medium text-sm block">Contact No.</label>
                <p class="w-full font-normal text-base tracking-wider " >
                  0999-999-9999
                </p>
              </div>
  
            <div>
              <label class="text-blue-800 font-medium text-sm block">Email Address</label>
              <p class="w-full font-normal text-base tracking-wider " >
                ctsantillan@gmail.com
              </p>
            </div>
  
            <div>
              <label class="text-blue-800 font-medium text-sm block">Hire Date</label>
              <p class="w-full font-normal text-base tracking-wider " >
                SEPTEMBER 18, 2023
              </p>
            </div>
          </div>
  
            <!-- AGENT ID / POSITION -->
            <div class="grid grid-cols-3 gap-5">
              <div>
                <label class="text-blue-800 font-medium text-sm block">Agent ID</label>
                <p class="w-full font-medium text-base tracking-wider " >
                1
                </p>
              </div>
  
              <div>
                <label class="text-blue-800 font-medium text-sm block">Position</label>
                <p class="w-full font-medium text-base tracking-wider " >
                SPECIALIST
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
<script setup lang="ts">
// replaces the default user image with this if ever no pfp uploaded yet
import placeholder from '@/assets/images/default_placeholder.png'

</script>
  
  <style scoped>
  
  </style>