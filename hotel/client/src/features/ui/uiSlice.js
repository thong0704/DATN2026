import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,
    notifications: [],
  },
  reducers: {
    toggleSidebar(s) {
      s.sidebarOpen = !s.sidebarOpen;
    },
    addNotification(s, a) {
      s.notifications.unshift(a.payload);
      s.notifications = s.notifications.slice(0, 50);
    },
    setNotifications(s, a) {
      s.notifications = a.payload;
    },
  },
});

export const { toggleSidebar, addNotification, setNotifications } = uiSlice.actions;
export default uiSlice.reducer;
