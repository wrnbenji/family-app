import { create } from 'zustand';

type AppState = { householdId?: string; setHouseholdId: (id?: string) => void };
export const useAppState = create<AppState>((set) => ({
  householdId: undefined,
  setHouseholdId: (id) => set({ householdId: id }),
}));
