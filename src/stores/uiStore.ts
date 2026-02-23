import { create } from 'zustand';

interface UiStore {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  activeDate: string; // YYYY-MM-DD
  setActiveDate: (date: string) => void;
  viewMode: 'day' | 'week' | 'month';
  setViewMode: (mode: 'day' | 'week' | 'month') => void;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  activeDate: todayStr(),
  setActiveDate: (date) => set({ activeDate: date }),
  viewMode: 'day',
  setViewMode: (mode) => set({ viewMode: mode }),
}));
