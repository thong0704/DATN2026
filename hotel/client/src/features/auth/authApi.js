import { api } from '../api/apiSlice';

export const authApi = api.injectEndpoints({
  endpoints: (b) => ({
    register: b.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    verifyRegistration: b.mutation({
      query: (body) => ({ url: '/auth/verify-registration', method: 'POST', body }),
    }),
    resendVerificationCode: b.mutation({
      query: (body) => ({ url: '/auth/resend-verification-code', method: 'POST', body }),
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
      query: ({ email, code, password }) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: { email, code, password },
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
  useVerifyRegistrationMutation,
  useResendVerificationCodeMutation,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useUploadAvatarMutation,
} = authApi;
