<template>
    <div class="absolute h-screen w-full z-5 bg-black/25 backdrop-blur-sm py-30 px-40">
        <div class="bg-white size-full rounded-3xl border border-gray-400 p-10">

            <header>
                <h1 class="text-4xl max-w-19/20 font-extrabold text-maurealty-blue mb-4 ml-5">
                    ADD NEW DEVELOPER
                </h1>

                <hr width="100%" class="mb-4 text-maurealty-blue/30">
            </header>

            <form @submit.prevent="saveDeveloper" class="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-5 mx-5">
                
                <section class="flex flex-col gap-4 justify-start">
                    <div class="flex items-center gap-5 w-full">
                        <label class="block text-2xl font-bold text-maurealty-blue mb-1">Name:</label>
                        <input type="text" placeholder="e.g. MauRealty Developer" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                    </div>

                    <div class="flex items-center gap-5 w-full">
                        <label class="block text-2xl font-bold text-maurealty-blue mb-1">Location:</label>
                        <input type="text" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                    </div>

                    <hr width="100%" class="my-4 text-maurealty-blue/30">

                    <div class="grid grid-cols-2 gap-x-3 w-full">
                        <h1 class="col-span-2 block text-2xl font-bold text-maurealty-blue mb-2">Contact details</h1>
                        <span class="justify-items-center">
                          <label class="block text-lg font-bold text-maurealty-blue mb-1">Phone No.</label>
                            <input type="text" placeholder="(+63)900-000-0000" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                        </span>
                        <span class="justify-items-center">
                          <label class="block text-lg font-bold text-maurealty-blue mb-1">Email</label>
                            <input type="email" placeholder="developer@email.com" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                        </span>
                    </div>

                    <hr width="100%" class="my-4 text-maurealty-blue/30">

                    <div class="grid grid-cols-3 gap-x-3 w-full">
                        <h1 class="col-span-3 block text-2xl font-bold text-maurealty-blue mb-2">Office Hours</h1>
                        <span class="justify-items-center">
                          <label class="block text-lg font-bold text-maurealty-blue mb-1">Phone No.</label>
                            <input type="text" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                        </span>
                        <span class="justify-items-center">
                          <label class="block text-lg font-bold text-maurealty-blue mb-1">Open Hours</label>
                            <input type="time" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                        </span>
                        <span class="justify-items-center">
                          <label class="block text-lg font-bold text-maurealty-blue mb-1">Closed Hours</label>
                            <input type="time" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-maurealty-blue outline-none">
                        </span>
                    </div>

                </section>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/vue';

// reminder to safeguard the non-nullable inputs pls (error message if missing part)


function saveDeveloper() {
    console.log("Saving developer");
}
</script>