import { reactive } from 'vue';
import defaultSettings from '@/assets/defaultSettings.json';

// 1. Initialize the reactive state as the flat settings object directly
const state = reactive({ ...defaultSettings.configs });

export function useSettings() {
    const loadSettings = () => {
        const stored = localStorage.getItem('app_user_settings');
        if (stored) {
        const parsed = JSON.parse(stored);
        
        // Safety check: If the local storage still has the old {"configs": {...}} wrapper, 
        // extract the inner object. Otherwise, use it as-is.
        const flatSettings = parsed.configs ? parsed.configs : parsed;
        
        // Update all properties in the reactive state at once
        Object.assign(state, flatSettings);
        }
    };

    const updateSetting = <K extends keyof typeof defaultSettings.configs>(
        key: K, 
        value: typeof defaultSettings.configs[K]
    ) => {
        // Update local reactive state
        (state as any)[key] = value;
        
        // Save the flat object directly to local storage
        localStorage.setItem('app_user_settings', JSON.stringify(state));
    };

    // Initialize on first import
    loadSettings();

    return {
        configs: state, // This now returns the flat object directly!
        updateSetting,
        loadSettings
    };
}