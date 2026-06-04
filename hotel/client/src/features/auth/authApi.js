import { api } from '../api/apiSlice';

export const authApi = api.injectEndpoints({
  endpoints: (b) => ({
    register: b.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: b.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    logout: b.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    me: b.query({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
    updateProfile: b.mutation({
      query: (body) => ({ url: '/auth/update-profile', method: 'PUT', body }),
      invalidatesTags: ['Auth'],
    }),
    changePassword: b.mutation({
      query: (body) => ({ url: '/auth/change-password', method: 'PUT', body }),
    }),
    forgotPassword: b.mutation({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: b.mutation({
      query: ({ token, password }) => ({
        url: `/auth/reset-password/${token}`,
        method: 'PUT',
        body: { password },
      }),
    }),
    uploadAvatar: b.mutation({
      query: (formData) => ({ url: '/auth/upload-avatar', method: 'POST', body: formData }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useUploadAvatarMutation,
} = authApi;
