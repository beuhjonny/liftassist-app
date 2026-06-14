import { ref, watch } from 'vue';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import useAuth from './useAuth';
import useHistoryIndex from './useHistoryIndex';

export interface StravaConfig {
  clientId: string;
  clientSecret: string;
  enablePushToStrava?: boolean;
  enablePullFromStrava?: boolean;
}

export interface StravaAuth {
  athleteName: string;
  athleteId: number | null;
  connectedAt: any;
}

const isConfigured = ref(!!import.meta.env.VITE_STRAVA_CLIENT_ID);
const isConnected = ref(false);
const athleteName = ref('');
const enablePushToStrava = ref(true);
const enablePullFromStrava = ref(true);
const isLoading = ref(false);
const error = ref<string | null>(null);
const clientId = ref(import.meta.env.VITE_STRAVA_CLIENT_ID || '');
const clientSecret = ref('');

export default function useStrava() {
  const { user } = useAuth();
  const { fetchCalendarIndex } = useHistoryIndex();

  const loadStravaStatus = async () => {
    if (!user.value) return;
    isLoading.value = true;
    error.value = null;
    try {
      // 1. Load config (preferences only)
      const configRef = doc(db, 'users', user.value.uid, 'strava', 'config');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        const data = configSnap.data() as StravaConfig;
        enablePushToStrava.value = data.enablePushToStrava !== false;
        enablePullFromStrava.value = data.enablePullFromStrava !== false;
      } else {
        enablePushToStrava.value = true;
        enablePullFromStrava.value = true;
      }
      isConfigured.value = !!import.meta.env.VITE_STRAVA_CLIENT_ID;
      clientId.value = import.meta.env.VITE_STRAVA_CLIENT_ID || '';

      // 2. Load auth
      const authRef = doc(db, 'users', user.value.uid, 'strava', 'auth');
      const authSnap = await getDoc(authRef);
      if (authSnap.exists()) {
        const data = authSnap.data() as StravaAuth;
        isConnected.value = true;
        athleteName.value = data.athleteName || 'Connected';
      } else {
        isConnected.value = false;
        athleteName.value = '';
      }
    } catch (e: any) {
      console.error('Failed to load Strava status:', e);
      error.value = e.message || 'Failed to load Strava status';
    } finally {
      isLoading.value = false;
    }
  };

  const saveCredentials = async (cId: string, cSecret: string) => {
    // Deprecated in centralized OAuth flow
  };

  const updatePreferences = async (push: boolean, pull: boolean) => {
    if (!user.value) return;
    try {
      const configRef = doc(db, 'users', user.value.uid, 'strava', 'config');
      await setDoc(configRef, {
        enablePushToStrava: push,
        enablePullFromStrava: pull
      }, { merge: true });
      enablePushToStrava.value = push;
      enablePullFromStrava.value = pull;
    } catch (e: any) {
      console.error('Failed to update Strava preferences:', e);
    }
  };

  const connect = async () => {
    if (!user.value) return;
    const cId = import.meta.env.VITE_STRAVA_CLIENT_ID;
    if (!cId) {
      error.value = 'Strava Client ID is not configured on the app.';
      return;
    }
    try {
      // Redirect to Strava authorize page
      const redirectUri = `${window.location.origin}/profile`;
      const scope = 'activity:read_all,activity:write';
      const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${cId.trim()}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${user.value.uid}`;
      window.location.href = stravaAuthUrl;
    } catch (e: any) {
      error.value = e.message || 'Failed to initialize authorization';
    }
  };

  const disconnect = async () => {
    if (!user.value) return;
    isLoading.value = true;
    error.value = null;
    try {
      const configRef = doc(db, 'users', user.value.uid, 'strava', 'config');
      const authRef = doc(db, 'users', user.value.uid, 'strava', 'auth');
      await deleteDoc(configRef);
      await deleteDoc(authRef);

      isConnected.value = false;
      athleteName.value = '';
    } catch (e: any) {
      console.error('Failed to disconnect Strava:', e);
      error.value = e.message || 'Failed to disconnect';
    } finally {
      isLoading.value = false;
    }
  };

  const exchangeCode = async (code: string) => {
    if (!functions) {
      throw new Error('Firebase Functions is not initialized');
    }
    isLoading.value = true;
    error.value = null;
    try {
      const exchangeFunc = httpsCallable<{ code: string }, { success: boolean; athleteName: string }>(
        functions,
        'exchangeStravaCode'
      );
      const res = await exchangeFunc({ code });
      if (res.data.success) {
        isConnected.value = true;
        athleteName.value = res.data.athleteName || 'Connected';
      } else {
        throw new Error('Failed to exchange code');
      }
    } catch (e: any) {
      console.error('Failed to exchange Strava authorization code:', e);
      error.value = e.message || 'Failed to exchange authorization code';
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const syncNow = async (fullSync = false) => {
    if (!functions) {
      throw new Error('Firebase Functions is not initialized');
    }
    isLoading.value = true;
    error.value = null;
    try {
      const syncFunc = httpsCallable<{ fullSync: boolean }, { success: boolean; count: number }>(
        functions,
        'syncStravaActivities'
      );
      const res = await syncFunc({ fullSync });
      if (res.data.success) {
        // Trigger local calendar index rebuild
        await fetchCalendarIndex(true);
        return res.data.count;
      } else {
        throw new Error('Failed to sync activities');
      }
    } catch (e: any) {
      console.error('Strava manual sync failed:', e);
      error.value = e.message || 'Failed to sync activities';
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  // Watch user state to reload status
  watch(user, (newUser) => {
    if (newUser) {
      loadStravaStatus();
    } else {
      isConfigured.value = false;
      isConnected.value = false;
      athleteName.value = '';
      clientId.value = '';
      clientSecret.value = '';
    }
  }, { immediate: true });

  return {
    isConfigured,
    isConnected,
    athleteName,
    enablePushToStrava,
    enablePullFromStrava,
    clientId,
    clientSecret,
    isLoading,
    error,
    loadStravaStatus,
    saveCredentials,
    updatePreferences,
    connect,
    disconnect,
    exchangeCode,
    syncNow
  };
}
