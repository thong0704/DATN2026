import { createSlice } from '@reduxjs/toolkit';

const persisted = JSON.parse(localStorage.getItem('auth') || 'null');

const initialState = persisted || { user: null, accessToken: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, accessToken } = action.payload;
      if (user !== undefined) state.user = user;
      if (accessToken !== undefined) state.accessToken = accessToken;
      localStorage.setItem('auth', JSON.stringify(state));
    },
    setUser(state, action) {
      state.user = action.payload;
      localStorage.setItem('auth', JSON.stringify(state));
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      localStorage.removeItem('auth');
    },
  },
});

export const { setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (s) => s.auth.user;
export const selectAccessToken = (s) => s.auth.accessToken;
