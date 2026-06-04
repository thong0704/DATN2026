import { api } from '../api/apiSlice';

export const notifApi = api.injectEndpoints({
  endpoints: (b) => ({
    listNotifications: b.query({
      query: () => '/notifications',
      providesTags: ['Notification'],
    }),
    markRead: b.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PUT' }),
      invalidatesTags: ['Notification'],
    }),
    markAllRead: b.mutation({
      query: () => ({ url: '/notifications/read-all', method: 'PUT' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const { useListNotificationsQuery, useMarkReadMutation, useMarkAllReadMutation } = notifApi;
