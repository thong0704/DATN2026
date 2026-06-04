import { api } from '../api/apiSlice';

export const adminApi = api.injectEndpoints({
  endpoints: (b) => ({
    dashboard: b.query({
      query: (params = {}) => ({ url: '/admin/dashboard', params }),
      providesTags: ['Admin'],
    }),
    dashboardRich: b.query({
      query: (params = {}) => ({ url: '/admin/dashboard-rich', params }),
      providesTags: ['Admin'],
    }),
    revenueAnalytics: b.query({
      query: (params = {}) => {
        const p = typeof params === 'string' ? { period: params } : params;
        return { url: '/admin/analytics/revenue', params: p };
      },
    }),
    occupancyAnalytics: b.query({
      query: (params = {}) => ({ url: '/admin/analytics/occupancy', params }),
    }),
    topHotels: b.query({ query: () => '/admin/analytics/top-hotels' }),
    listUsers: b.query({
      query: (params = {}) => ({ url: '/admin/users', params }),
      providesTags: ['User'],
    }),
    updateUserRole: b.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/users/${id}/role`, method: 'PUT', body }),
      invalidatesTags: ['User'],
    }),
    updateUser: b.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/users/${id}`, method: 'PUT', body }),
      invalidatesTags: ['User'],
    }),
    createUser: b.mutation({
      query: (body) => ({ url: '/admin/users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useDashboardQuery,
  useDashboardRichQuery,
  useRevenueAnalyticsQuery,
  useOccupancyAnalyticsQuery,
  useTopHotelsQuery,
  useListUsersQuery,
  useUpdateUserRoleMutation,
  useUpdateUserMutation,
  useCreateUserMutation,
} = adminApi;
