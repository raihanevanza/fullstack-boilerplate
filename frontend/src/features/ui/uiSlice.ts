import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getLang, type Lang } from '@/i18n/core';

interface UiState {
  // Desktop: expanded (true) or icon-only sidebar
  sidebarOpen: boolean;
  // Mobile: off-canvas drawer visibility
  drawerOpen: boolean;
  language: Lang;
}

const initialState: UiState = {
  sidebarOpen: true,
  drawerOpen: false,
  language: getLang(),
};

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
    setLanguage(state, action: PayloadAction<Lang>) {
      state.language = action.payload;
    },
  },
});

export const { toggleSidebar, setDrawerOpen, setLanguage } = uiSlice.actions;
export default uiSlice.reducer;
