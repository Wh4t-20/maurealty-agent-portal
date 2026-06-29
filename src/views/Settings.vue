<template>
    <div class="w-full h-screen bg-background-gray flex flex-col overflow-hidden p-10">
        <main class="relative custom-scrollbar w-full h-auto bg-white border border-maurealty-blue/25 rounded-2xl shadow-lg py-7 px-10 overflow-y-scroll">
            
            <header class="relative">
                <h1 class="text-4xl max-w-19/20 font-extrabold text-maurealty-blue mb-4 ml-5 uppercase">
                    SETTINGS
                </h1>

                <hr width="100%" class="mb-4 text-maurealty-blue/30">
            </header>

            <div class="flex flex-col mt-10 ml-5 gap-8">
                <section class="flex flex-col gap-2">
                    <h1 class="text-3xl max-w-19/20 font-extrabold text-maurealty-blue mb-4 uppercase">USER DEFAULTS</h1>
                    
                    <div class="text-lg flex items-center gap-4">
                        <span class="whitespace-nowrap">Default Currency:</span>
                        <div class="w-auto"> 
                            <ConfigDropdown :choices="Object.keys(currencySymbols)" v-model="configs.userDefaultCurrency" />
                        </div>
                        <span class="whitespace-nowrap"> ({{ currencySymbols[configs.userDefaultCurrency] }}) </span>
                    </div>

                    <div class="text-lg flex items-center gap-4">
                        <span class="whitespace-nowrap">Default Unit:</span>
                        <div class="w-auto"> 
                            <ConfigDropdown :choices="Object.keys(areaUnits)" v-model="configs.userDefaultAreaUnit" />
                        </div>
                        <span class="whitespace-nowrap"> ({{ areaUnits[configs.userDefaultAreaUnit] }}) </span>
                    </div>
                </section>

                <section class="flex flex-col gap-2">
                    <h1 class="text-3xl max-w-19/20 font-extrabold text-maurealty-blue mb-4 uppercase">GRAPHICS</h1>
                    
                    <div class="text-lg flex items-center gap-4">
                        <span class="whitespace-nowrap">Disable Animations:</span>
                        <ConfigToggleSlider v-model="configs.disableAnimations" />
                    </div>

                    <div class="text-lg flex items-center gap-4">
                        <span class="whitespace-nowrap">Enable Dark Mode:</span>
                        <ConfigToggleSlider v-model="configs.darkThemeEnabled" />
                    </div>
                </section>
            </div>

            <div class="flex col-span-2 justify-end gap-4 mt-8">
                <button type="button" @click="goBack" class="px-4 py-1.5 border border-maurealty-blue text-maurealty-blue font-bold rounded-xl hover:bg-gray-100 transition cursor-pointer">
                    CANCEL
                </button>
                <button type="submit" class="px-4 py-1.5 bg-maurealty-blue text-white font-bold rounded-xl shadow-md hover:bg-opacity-90 hover:bg-[#045fa3] active:bg-white active:text-maurealty-blue border border-maurealty-blue transition flex items-center gap-2 cursor-pointer">
                    <span>★</span> SAVE SETTINGS
                </button>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { currencySymbols, areaUnits } from '@/utils/conversion';
import ConfigDropdown from '@/components/settings/configDropdown.vue';
import ConfigToggleSlider from '@/components/settings/configToggleSlider.vue';
import { useSettings } from '@/utils/useSettings';

const { configs, updateSetting } = useSettings();

onMounted(async () => {
    console.log(configs);
});

// goes back to previous page
function goBack() {
  window.history.back()
}
</script>