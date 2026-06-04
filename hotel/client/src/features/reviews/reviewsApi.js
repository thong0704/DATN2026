import { api } from '../api/apiSlice';

export const reviewsApi = api.injectEndpoints({
  endpoints: (b) => ({
    hotelReviews: b.query({
      query: (hotelId) => `/reviews/hotel/${hotelId}`,
      providesTags: ['Review'],
    }),
    createReview: b.mutation({
      query: (body) => ({ url: '/reviews', method: 'POST', body }),
      invalidatesTags: ['Review', 'Hotel'],
    }),
    updateReview: b.mutation({
      query: ({ id, ...body }) => ({ url: `/reviews/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Review'],
    }),
    deleteReview: b.mutation({
      query: (id) => ({ url: `/reviews/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Review'],
    }),
    respondReview: b.mutation({
      query: ({ id, text }) => ({ url: `/reviews/${id}/respond`, method: 'PUT', body: { text } }),
      invalidatesTags: ['Review'],
    }),
    approveReview: b.mutation({
      query: ({ id, isApproved }) => ({
        url: `/reviews/${id}/approve`,
        method: 'PUT',
        body: { isApproved },
      }),
      invalidatesTags: ['Review'],
    }),
  }),
});

export const {
  useHotelReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useRespondReviewMutation,
  useApproveReviewMutation,
} = reviewsApi;
