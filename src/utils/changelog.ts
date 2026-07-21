import { ref } from 'vue';

export const LATEST_CHANGELOG_VERSION = '2026-07-21';
const STORAGE_KEY = 'liftlogic_last_read_changelog';

function checkHasNewChangelog(): boolean {
  try {
    const lastRead = localStorage.getItem(STORAGE_KEY);
    return lastRead !== LATEST_CHANGELOG_VERSION;
  } catch (e) {
    return false;
  }
}

const hasNewChangelogState = ref<boolean>(checkHasNewChangelog());

export function useChangelog() {
  const markAsRead = () => {
    try {
      localStorage.setItem(STORAGE_KEY, LATEST_CHANGELOG_VERSION);
      hasNewChangelogState.value = false;
    } catch (e) {
      console.warn('Could not update changelog read state:', e);
    }
  };

  const refreshState = () => {
    hasNewChangelogState.value = checkHasNewChangelog();
  };

  return {
    hasNewChangelog: hasNewChangelogState,
    markAsRead,
    refreshState,
    latestVersion: LATEST_CHANGELOG_VERSION,
  };
}
