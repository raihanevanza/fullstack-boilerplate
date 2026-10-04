import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getLang, type Lang } from '@/i18n/core';

export interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface UiState {
  // Desktop: expanded (true) or icon-only sidebar
  sidebarOpen: boolean;
  // Mobile: off-canvas drawer visibility
  drawerOpen: boolean;
  toasts: Toast[];
  language: Lang;
}

const initialState: UiState = {
  sidebarOpen: true,
  drawerOpen: false,
  toasts: [],
  language: getLang(),
};

let nextToastId = 1;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setDrawerOpen(state, action: PayloadAction<boolean>) {
      state.drawerOpen = action.payload;
    },
    showToast: {
      reducer(state, action: PayloadAction<Toast>) {
        state.toasts.push(action.payload);
      },
      prepare(message: string, type: Toast['type'] = 'success') {
        return { payload: { id: nextToastId++, type, message } };
      },
    },
    dismissToast(state, action: PayloadAction<number>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setLanguage(state, action: PayloadAction<Lang>) {
      state.language = action.payload;
    },
  },
});

export const { toggleSidebar, setDrawerOpen, showToast, dismissToast, setLanguage } =
  uiSlice.actions;
export default uiSlice.reducer;
