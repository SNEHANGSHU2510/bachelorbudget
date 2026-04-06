import { create } from 'zustand'

export type CurrencyInfo = {
  code: string;
  name: string;
  symbol: string;
}

export type Budget = {
  id: string;
  user_id: string;
  name: string;
  total_amount: number;
  currency: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  created_at: string;
}

interface AppState {
  activeBudget: Budget | null;
  setActiveBudget: (budget: Budget | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeBudget: null,
  setActiveBudget: (budget) => set({ activeBudget: budget }),
}))
