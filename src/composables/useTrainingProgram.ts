import { ref, reactive, watch, computed } from 'vue';
import { doc, getDoc, collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import useAuth from './useAuth';
import useSettings from './useSettings';
import type { TrainingProgram, LoggedWorkout, WorkoutDay, EnhancedWorkoutDay } from '@/types';

export default function useTrainingProgram() {
    const { user } = useAuth();
    const { settings, saveSettings } = useSettings();

    const allPrograms = ref<TrainingProgram[]>([]);

    const isProgramLoading = ref(false);
    const programLoadingError = ref<string | null>(null);

    const activeProgram = reactive<TrainingProgram>({
        id: null,
        programName: '',
        description: '',
        workoutDays: [],
    });

    const programWorkoutsHistory = ref<LoggedWorkout[]>([]);
    const isLoadingHistory = ref(false);
    const historyError = ref<string | null>(null);

    // Draft workout state
    const activeDraft = ref<{ programId: string; dayId: string; dayName: string; setsCount: number } | null>(null);
    const isLoadingDraft = ref(false);

    const clearActiveProgram = () => {
        activeProgram.id = null;
        activeProgram.programName = '';
        activeProgram.description = '';
        activeProgram.workoutDays = [];
        programWorkoutsHistory.value = [];
        historyError.value = null;
        activeDraft.value = null;
    };

    const loadActiveProgram = async () => {
        if (!user.value || !user.value.uid) {
            clearActiveProgram();
            isProgramLoading.value = false;
            return;
        }
        isProgramLoading.value = true;
        programLoadingError.value = null;

        try {
            let targetProgramId = settings.value.activeProgramId;

            // MIGRATION: Check for legacy program if no activeProgramId
            if (!targetProgramId) {
                const legacyId = 'user_active_main_program';
                const legacyRef = doc(db, 'users', user.value.uid, 'trainingPrograms', legacyId);
                const legacySnap = await getDoc(legacyRef);

                if (legacySnap.exists()) {
                    targetProgramId = legacyId;
                    await saveSettings({ activeProgramId: legacyId });
                }
            }

            // If still no ID, try to find any program
            if (!targetProgramId) {
                await fetchAllPrograms();
                if (allPrograms.value.length > 0 && allPrograms.value[0].id) {
                    targetProgramId = allPrograms.value[0].id;
                    await saveSettings({ activeProgramId: targetProgramId });
                }
            }

            // Load the program
            if (targetProgramId) {
                const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', targetProgramId);
                const programSnap = await getDoc(programDocRef);

                if (programSnap.exists()) {
                    const data = programSnap.data() as Omit<TrainingProgram, 'id'>;
                    activeProgram.id = programSnap.id;
                    activeProgram.programName = data.programName || 'Your Active Routine';
                    activeProgram.description = data.description || '';
                    activeProgram.workoutDays = Array.isArray(data.workoutDays) ? data.workoutDays : [];
                } else {
                    clearActiveProgram();
                }
            } else {
                clearActiveProgram();
            }
        } catch (e: any) {
            console.error("useTrainingProgram: Error loading active program:", e);
            programLoadingError.value = "Failed to load your active routine.";
            clearActiveProgram();
        } finally {
            isProgramLoading.value = false;
        }
    };

    const fetchAllPrograms = async () => {
        if (!user.value || !user.value.uid) {
            allPrograms.value = [];
            return;
        }
        try {
            const programsCollectionRef = collection(db, 'users', user.value.uid, 'trainingPrograms');
            const q = query(programsCollectionRef, orderBy('programName', 'asc'));
            const querySnapshot = await getDocs(q);
            const fetchedPrograms: TrainingProgram[] = [];
            querySnapshot.forEach((docSnap) => {
                fetchedPrograms.push({ id: docSnap.id, ...docSnap.data() } as TrainingProgram);
            });
            allPrograms.value = fetchedPrograms;
        } catch (e) {
            console.error("Error fetching all programs:", e);
            allPrograms.value = [];
        }
    };

    const fetchProgramWorkoutsHistory = async () => {
        if (!user.value || !user.value.uid || !activeProgram.id) {
            programWorkoutsHistory.value = [];
            isLoadingHistory.value = false;
            return;
        }
        isLoadingHistory.value = true;
        historyError.value = null;
        const fetchedHistory: LoggedWorkout[] = [];
        try {
            const historyCollectionRef = collection(db, 'users', user.value.uid, 'loggedWorkouts');
            const q = query(historyCollectionRef, orderBy('date', 'desc'));
            const querySnapshot = await getDocs(q);

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data() as Omit<LoggedWorkout, 'id'>;
                if (data.trainingProgramIdUsed === activeProgram.id) {
                    fetchedHistory.push({ id: docSnap.id, ...data });
                }
            });
            programWorkoutsHistory.value = fetchedHistory;
        } catch (e: any) {
            console.error("Error fetching program workout history:", e);
            historyError.value = "Failed to load workout insights: " + e.message;
            programWorkoutsHistory.value = [];
        } finally {
            isLoadingHistory.value = false;
        }
    };

    const checkForDraftWorkout = async () => {
        if (!user.value?.uid || !activeProgram.id) {
            return;
        }

        isLoadingDraft.value = true;

        try {
            // Check for draft for any day in the active program
            for (const day of activeProgram.workoutDays) {
                const draftId = `draft_${activeProgram.id}_${day.id}`;
                const draftRef = doc(db, 'users', user.value.uid, 'draftWorkouts', draftId);

                const draftSnap = await getDoc(draftRef);

                if (draftSnap.exists()) {
                    const draftData = draftSnap.data();
                    const setsCount = draftData.workoutLog?.length || 0;

                    // Show draft if it has sets OR if workout has started (not just overview)
                    if (setsCount > 0 || (draftData.workoutPhase && draftData.workoutPhase !== 'overview')) {
                        activeDraft.value = {
                            programId: activeProgram.id,
                            dayId: day.id,
                            dayName: draftData.dayName || day.dayName,
                            setsCount: setsCount
                        };
                        isLoadingDraft.value = false;
                        return; // Found a draft, stop checking
                    }
                }
            }
            activeDraft.value = null;
        } catch (error) {
            console.error('Error checking for draft workout:', error);
        } finally {
            isLoadingDraft.value = false;
        }
    };

    const deleteDraftWorkout = async () => {
        if (!user.value?.uid || !activeDraft.value) return;

        // We need to reconstruct the draftId to delete it
        // draft_programId_dayId
        const { programId, dayId } = activeDraft.value;
        const draftId = `draft_${programId}_${dayId}`;

        try {
            const { deleteDoc } = await import('firebase/firestore');
            const draftRef = doc(db, 'users', user.value.uid, 'draftWorkouts', draftId);
            await deleteDoc(draftRef);
            activeDraft.value = null; // Clear local state
        } catch (error) {
            console.error('Failed to delete draft workout:', error);
            throw error; // Re-throw so UI can handle it if needed
        }
    };

    // --- Computed Helpers ---

    const sortedWorkoutDays = computed((): WorkoutDay[] => {
        if (!activeProgram.workoutDays) return [];
        return [...activeProgram.workoutDays].sort((a, b) => a.order - b.order);
    });

    const ensureDateObject = (dateInput: Timestamp | Date): Date => {
        if (dateInput instanceof Timestamp) {
            return dateInput.toDate();
        }
        return new Date(dateInput.getTime());
    };

    const enhancedWorkoutDays = computed<EnhancedWorkoutDay[]>(() => {
        if (!activeProgram.id || sortedWorkoutDays.value.length === 0) return [];

        const localSortedWorkoutDays = sortedWorkoutDays.value;
        const historyNewestFirst = programWorkoutsHistory.value;
        const historyOldestFirst = [...historyNewestFirst].slice().reverse();

        const skipCounts = new Map<string, number>();
        localSortedWorkoutDays.forEach(day => skipCounts.set(day.id, 0));
        let lastCompletedDayIdInStrictSequence: string | null = null;

        if (localSortedWorkoutDays.length > 0) {
            for (const log of historyOldestFirst) {
                const loggedDayInProgram = localSortedWorkoutDays.find(d => d.id === log.workoutDayIdUsed);

                if (!loggedDayInProgram) {
                    if (lastCompletedDayIdInStrictSequence === log.workoutDayIdUsed) {
                        lastCompletedDayIdInStrictSequence = null;
                    }
                    continue;
                }

                let expectedNextDayIdInStrictSequence: string | null = null;
                if (lastCompletedDayIdInStrictSequence === null) {
                    expectedNextDayIdInStrictSequence = localSortedWorkoutDays[0]?.id || null;
                } else {
                    const lastCompletedIndex = localSortedWorkoutDays.findIndex(d => d.id === lastCompletedDayIdInStrictSequence);
                    if (lastCompletedIndex === -1) {
                        lastCompletedDayIdInStrictSequence = null;
                        expectedNextDayIdInStrictSequence = localSortedWorkoutDays[0]?.id || null;
                    } else {
                        const nextIndex = (lastCompletedIndex + 1) % localSortedWorkoutDays.length;
                        expectedNextDayIdInStrictSequence = localSortedWorkoutDays[nextIndex]?.id || null;
                    }
                }

                if (log.workoutDayIdUsed === expectedNextDayIdInStrictSequence) {
                    if (expectedNextDayIdInStrictSequence) {
                        skipCounts.set(expectedNextDayIdInStrictSequence, 0);
                    }
                    lastCompletedDayIdInStrictSequence = log.workoutDayIdUsed;
                } else {
                    if (expectedNextDayIdInStrictSequence) {
                        skipCounts.set(
                            expectedNextDayIdInStrictSequence,
                            (skipCounts.get(expectedNextDayIdInStrictSequence) || 0) + 1
                        );
                    }
                    skipCounts.set(log.workoutDayIdUsed, 0);
                    lastCompletedDayIdInStrictSequence = log.workoutDayIdUsed;
                }
            }
        }

        const lastCompletionDateMap = new Map<string, Date>();
        if (historyNewestFirst.length > 0) {
            const processedDayIds = new Set<string>();
            for (const log of historyNewestFirst) {
                if (localSortedWorkoutDays.some(d => d.id === log.workoutDayIdUsed)) {
                    if (!processedDayIds.has(log.workoutDayIdUsed)) {
                        lastCompletionDateMap.set(log.workoutDayIdUsed, ensureDateObject(log.date));
                        processedDayIds.add(log.workoutDayIdUsed);
                    }
                    if (processedDayIds.size === localSortedWorkoutDays.length) break;
                }
            }
        }

        const lastOverallCompletedLog = historyNewestFirst.length > 0 ? historyNewestFirst[0] : null;
        let nextRecommendedDayIdBasedOnOverallLast: string | null = null;

        if (localSortedWorkoutDays.length > 0) {
            if (lastOverallCompletedLog && localSortedWorkoutDays.some(d => d.id === lastOverallCompletedLog.workoutDayIdUsed)) {
                const lastDayIndex = localSortedWorkoutDays.findIndex(d => d.id === lastOverallCompletedLog!.workoutDayIdUsed);
                nextRecommendedDayIdBasedOnOverallLast = localSortedWorkoutDays[(lastDayIndex + 1) % localSortedWorkoutDays.length].id;
            } else {
                nextRecommendedDayIdBasedOnOverallLast = localSortedWorkoutDays[0].id;
            }
        }

        return localSortedWorkoutDays.map(day => {
            return {
                ...day,
                isNextRecommended: day.id === nextRecommendedDayIdBasedOnOverallLast,
                isLastDoneOverall: lastOverallCompletedLog ? day.id === lastOverallCompletedLog.workoutDayIdUsed : false,
                skipIndicatorCount: skipCounts.get(day.id) || 0,
                lastCompletedThisDayDate: lastCompletionDateMap.get(day.id) || null,
            };
        });
    });

    const lastDoneDayOverallDisplay = computed(() => {
        if (programWorkoutsHistory.value.length > 0) {
            const lastLog = programWorkoutsHistory.value[0];
            const dayDetails = sortedWorkoutDays.value.find(d => d.id === lastLog.workoutDayIdUsed);
            const dayName = lastLog.workoutDayNameUsed || dayDetails?.dayName || 'Workout';
            return { name: dayName, date: ensureDateObject(lastLog.date) };
        }
        return null;
    });

    const nextRecommendedDayObject = computed(() => {
        if (enhancedWorkoutDays.value.length === 0) return null;
        return enhancedWorkoutDays.value.find(d => d.isNextRecommended) || null;
    });

    const nextRecommendedDayNameDisplay = computed(() => {
        return nextRecommendedDayObject.value?.dayName || (sortedWorkoutDays.value[0]?.dayName || null);
    });

    // --- Watchers ---

    // Watch user and activeProgramId from settings (NOT activeProgram.id to avoid circular dependency)
    watch([user, () => settings.value.activeProgramId], async ([currentUser, currentActiveId], [oldUser, oldActiveId]) => {
        if (currentUser && currentUser.uid) {
            const userChanged = oldUser?.uid !== currentUser.uid;
            const programIdChanged = currentActiveId !== oldActiveId;

            // Load program if user changed, if activeProgramId changed, or if we don't have a program loaded yet
            if (userChanged || programIdChanged || !activeProgram.id) {
                await loadActiveProgram();
                if (activeProgram.id) {
                    await checkForDraftWorkout();
                }
            }
        } else {
            isProgramLoading.value = false;
            programLoadingError.value = null;
            clearActiveProgram();
            activeDraft.value = null;
        }
    }, { immediate: true });

    watch(() => activeProgram.id, (newProgramId, oldProgramId) => {
        if (newProgramId) {
            if (newProgramId !== oldProgramId || programWorkoutsHistory.value.length === 0) {
                fetchProgramWorkoutsHistory();
            }
        } else {
            programWorkoutsHistory.value = [];
        }
    }, { immediate: true });

    return {
        isProgramLoading,
        programLoadingError,
        activeProgram,
        programWorkoutsHistory,
        isLoadingHistory,
        historyError,
        activeDraft,
        isLoadingDraft,
        enhancedWorkoutDays,
        lastDoneDayOverallDisplay,
        nextRecommendedDayObject,
        nextRecommendedDayNameDisplay,
        sortedWorkoutDays,
        allPrograms,
        fetchAllPrograms,
        loadActiveProgram,
        checkForDraftWorkout,
        deleteDraftWorkout,
        formatDate: (date: Date | null | undefined): string => {
            if (!date) return '';
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
    };
}

