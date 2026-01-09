import { ref, computed, watch } from 'vue';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useAuth from './useAuth';

export type ThemeOption = 'original' | 'system' | 'light' | 'dark';
export type TimerSoundOption = 'bell' | 'ding' | 'chime' | 'beep' | 'mute';
export type WeightUnitOption = 'lbs' | 'kg';

export interface UserSettings {
    theme: ThemeOption;
    timerSound: TimerSoundOption;
    timerVolume: number; // 0.0 to 1.0
    weightUnit: WeightUnitOption;
    defaultRestTimer: number; // in seconds
}

const defaultSettings: UserSettings = {
    theme: 'original', // Default to original (user preference)
    timerSound: 'bell', // Default to bell (file)
    timerVolume: 0.6,
    weightUnit: 'lbs',
    defaultRestTimer: 90,
};

const settings = ref<UserSettings>({ ...defaultSettings });
const isLoaded = ref(false);
const isLoading = ref(false);

const { user } = useAuth();

export default function useSettings() {

    const loadSettings = async () => {
        if (!user.value) return;
        isLoading.value = true;
        try {
            const docRef = doc(db, 'users', user.value.uid, 'settings', 'preferences');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as Partial<UserSettings>;
                settings.value = { ...defaultSettings, ...data };
            } else {
                // Init with defaults if no settings exist
                settings.value = { ...defaultSettings };
            }
            applyTheme();
        } catch (e) {
            console.error('Failed to load settings:', e);
        } finally {
            isLoaded.value = true;
            isLoading.value = false;
        }
    };

    const saveSettings = async (newSettings?: Partial<UserSettings>) => {
        if (newSettings) {
            settings.value = { ...settings.value, ...newSettings };
        }

        applyTheme();

        if (!user.value) return;
        try {
            const docRef = doc(db, 'users', user.value.uid, 'settings', 'preferences');
            await setDoc(docRef, settings.value);
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    };

    const applyTheme = () => {
        const theme = settings.value.theme;
        const root = document.documentElement;

        // Reset classes
        root.classList.remove('theme-light', 'theme-dark');

        if (theme === 'system') {
            root.removeAttribute('data-theme');
            // Optional: Listen to system changes if we want real-time system switching
        } else {
            root.setAttribute('data-theme', theme);
            root.classList.add(`theme-${theme}`);
        }
    };

    // Watch for Auth changes to load settings
    watch(user, (newUser) => {
        if (newUser) {
            loadSettings();
        } else {
            settings.value = { ...defaultSettings };
            isLoaded.value = false;
            applyTheme(); // Reset to system/default
        }
    }, { immediate: true });

    return {
        settings,
        isLoaded,
        isLoading,
        loadSettings,
        saveSettings,
        applyTheme
    };
}
