<template>
    <div class="w-full h-screen bg-background-gray flex flex-col overflow-hidden p-10">
        <main class="relative custom-scrollbar size-full bg-white border border-maurealty-blue/25 rounded-2xl shadow-lg py-7 px-10 overflow-y-scroll">
            
            <header class="relative">
                <h1 class="text-4xl max-w-19/20 font-extrabold text-maurealty-blue mb-4 ml-5">
                    SETTINGS
                </h1>

                <hr width="100%" class="mb-4 text-maurealty-blue/30">
            </header>

            <div class="flex flex-col mt-10 ml-5">
                <section class="">
                    <h1 class="text-2xl max-w-19/20 font-extrabold text-maurealty-blue mb-4">USER DEFAULTS</h1>
                    
                </section>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import userSettings from '@/assets/testsettings.json';

const configs = ref<any>(userSettings.configs);
</script>