import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    darkMode: localStorage.getItem('darkMode') === 'true',
    sidebarOpen: true,
    loading: {}
  },
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
      if (state.darkMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    },
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setLoading: (state, action) => { state.loading[action.payload.key] = action.payload.value; }
  }
});

export const { toggleDarkMode, toggleSidebar, setLoading } = uiSlice.actions;
export default uiSlice.reducer;
