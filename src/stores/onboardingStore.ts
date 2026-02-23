import { create } from 'zustand';

export interface OnboardingData {
  displayName: string;
  timezone: string;
  wakeTime: string;
  sleepTime: string;
  lifeAreas: Array<{ name: string; icon: string; currentPct: number; targetPct: number }>;
  currentHabits: string[];
  yearlyGoals: string[];
  monthlyGoals: string[];
  weeklyGoals: string[];
  dailyGoals: string[];
  motivationStyle: 'gentle' | 'balanced' | 'direct';
}

interface OnboardingStore {
  currentStep: number;
  totalSteps: number;
  data: Partial<OnboardingData>;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (patch: Partial<OnboardingData>) => void;
  reset: () => void;
}

const TOTAL_STEPS = 9;

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  currentStep: 1,
  totalSteps: TOTAL_STEPS,
  data: {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    wakeTime: '07:00',
    sleepTime: '23:00',
    motivationStyle: 'balanced',
    lifeAreas: [],
    currentHabits: [],
    yearlyGoals: [],
    monthlyGoals: [],
    weeklyGoals: [],
    dailyGoals: [],
  },
  setStep: (step) => set({ currentStep: Math.min(Math.max(step, 1), TOTAL_STEPS) }),
  nextStep: () =>
    set((s) => ({ currentStep: s.currentStep + 1 })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
  updateData: (patch) => set((s) => ({ data: { ...s.data, ...patch } })),
  reset: () => set({ currentStep: 1, data: {} }),
}));
