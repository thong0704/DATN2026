import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logout } from '../auth/authSlice';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

// Refresh-token wrapper — if 401, try /auth/refresh-token once, then retry.
const baseQueryWithRefresh = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  if (result?.error?.status === 401) {
    const refresh = await baseQuery({ url: '/auth/refresh-token', method: 'POST' }, api, extraOptions);
    if (refresh?.data?.data?.accessToken) {
      api.dispatch(setCredentials({ accessToken: refresh.data.data.accessToken }));
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['Auth', 'Hotel', 'Room', 'Booking', 'Review', 'Payment', 'User', 'Notification', 'Admin', 'Coupon', 'Article', 'Contact', 'Banner'],
  endpoints: () => ({}),
});
