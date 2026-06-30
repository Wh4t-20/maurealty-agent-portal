<template>
    <div class="w-full h-screen bg-background-gray dark:bg-background-dark-gray flex flex-col overflow-hidden p-10">
        <main class="relative custom-scrollbar w-full h-auto bg-white dark:bg-black border border-maurealty-blue/25 rounded-2xl shadow-lg py-7 px-10 overflow-y-scroll">
            
            <header class="relative">
                <h1 class="text-4xl max-w-19/20 font-extrabold text-maurealty-blue dark:text-maurealty-light-blue mb-4 ml-5 uppercase">
                    SETTINGS
                </h1>

                <hr width="100%" class="mb-4 text-maurealty-blue/30 dark:text-maurealty-light-blue/30">
            </header>

            <div class="flex flex-col mt-10 ml-5 gap-8">
                <section class="flex flex-col gap-2">
                    <h1 class="text-3xl max-w-19/20 font-extrabold text-maurealty-blue dark:text-maurealty-light-blue mb-4 uppercase">USER DEFAULTS</h1>
                    
                    <div class="text-lg flex items-center gap-4 dark:text-white">
                        <span class="whitespace-nowrap">Default Currency:</span>
                        <div class="w-auto"> 
                            <ConfigDropdown 
                                :choices="Object.keys(currencySymbols)" 
                                :modelValue="configs.userDefaultCurrency"
                                @update:modelValue="(val) => updateSetting('userDefaultCurrency', val)" 
                            />
                        </div>
                        <span class="whitespace-nowrap"> ({{ currencySymbols[configs.userDefaultCurrency] }}) </span>
                    </div>

                    <div class="text-lg flex items-center gap-4 dark:text-white">
                        <span class="whitespace-nowrap">Default Unit:</span>
                        <div class="w-auto"> 
                            <ConfigDropdown 
                                :choices="Object.keys(areaUnits)" 
                                :modelValue="configs.userDefaultAreaUnit" 
                                @update:modelValue="(val) => updateSetting('userDefaultAreaUnit', val)" 
                            />
                        </div>
                        <span class="whitespace-nowrap"> ({{ areaUnits[configs.userDefaultAreaUnit] }}) </span>
                    </div>
                </section>

                <section class="flex flex-col gap-2">
                    <h1 class="text-3xl max-w-19/20 font-extrabold text-maurealty-blue dark:text-maurealty-light-blue mb-4 uppercase">GRAPHICS</h1>
                    
                    <div class="text-lg flex items-center gap-4 dark:text-white">
                        <span class="whitespace-nowrap">Disable Animations:</span>
                        <ConfigToggleSlider 
                            :modelValue="configs.disableAnimations"
                            @update:modelValue="(val) => updateSetting('disableAnimations', val)" 
                        />
                    </div>

                    <div class="text-lg flex items-center gap-4 dark:text-white">
                        <span class="whitespace-nowrap">Enable Dark Mode:</span>
                        <ConfigToggleSlider 
                            :modelValue="configs.darkThemeEnabled"
                            @update:modelValue="(val) => updateSetting('darkThemeEnabled', val)" 
                        />
                    </div>
                </section>
            </div>

            <div class="flex col-span-2 justify-end gap-4 mt-8">
                <button type="button" @click="goBack" class="px-4 py-1.5 border border-maurealty-blue dark:border-maurealty-light-blue text-maurealty-blue dark:text-maurealty-light-blue font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer">
                    CANCEL
                </button>
                <button type="button" @click="saveCurrentSettings" class="px-4 py-1.5 bg-maurealty-blue text-white font-bold rounded-xl shadow-md hover:bg-opacity-90 hover:bg-[#045fa3] active:bg-white active:text-maurealty-blue dark:text-maurealty-light-blue border border-maurealty-blue transition flex items-center gap-2 cursor-pointer">
                    <span>★</span> SAVE SETTINGS
                </button>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { currencySymbols, areaUnits } from '@/utils/conversion';
import ConfigDropdown from '@/components/settings/configDropdown.vue';
import ConfigToggleSlider from '@/components/settings/configToggleSlider.vue';
import { useSettings } from '@/utils/useSettings';
import { agentService } from '@/services/agentService';

const { configs, updateSetting } = useSettings();

onMounted(async () => {
    console.log(configs);
});

const saveCurrentSettings = async () => {
    try {
        const agentID = await agentService.getCurrentAgentID();

        if (!agentID) {
            console.error('Error fetching agent id');
        }

        const response = await agentService.updateConfigs(agentID, configs);
        if (!response.success) {
            console.error('Could not update Configs');
        }

        console.log('Settings updated successfully!');
    } catch (error) {
      console.error('Failed to save current settings:', error);
      return null;
    }
    
}

// goes back to previous page
function goBack() {
  window.history.back()
}
</script>