import { api } from '../api/apiSlice';

export const hotelsApi = api.injectEndpoints({
  endpoints: (b) => ({
    listHotels: b.query({
      query: (params = {}) => ({ url: '/hotels', params }),
      providesTags: ['Hotel'],
    }),
    searchHotels: b.query({
      query: (params) => ({ url: '/hotels/search', params }),
    }),
    getHotelBySlug: b.query({
      query: (slug) => `/hotels/${slug}`,
      providesTags: (r, e, slug) => [{ type: 'Hotel', id: slug }],
    }),
    getHotelById: b.query({
      query: (id) => `/hotels/id/${id}`,
    }),
    getAvailableRoomsAt: b.query({
      query: ({ id, checkIn, checkOut, adults = 1, children = 0 }) => ({
        url: `/hotels/${id}/rooms`,
        params: { checkIn, checkOut, adults, children },
      }),
    }),
    getHotelReviews: b.query({
      query: (id) => `/hotels/${id}/reviews`,
      providesTags: ['Review'],
    }),
    createHotel: b.mutation({
      query: (body) => ({ url: '/hotels', method: 'POST', body }),
      invalidatesTags: ['Hotel'],
    }),
    updateHotel: b.mutation({
      query: ({ id, ...body }) => ({ url: `/hotels/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Hotel'],
    }),
    deleteHotel: b.mutation({
      query: (id) => ({ url: `/hotels/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Hotel'],
    }),
    uploadHotelImages: b.mutation({
      query: ({ id, formData }) => ({
        url: `/hotels/${id}/images`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Hotel'],
    }),
  }),
});

export const {
  useListHotelsQuery,
  useSearchHotelsQuery,
  useGetHotelBySlugQuery,
  useGetHotelByIdQuery,
  useGetAvailableRoomsAtQuery,
  useGetHotelReviewsQuery,
  useCreateHotelMutation,
  useUpdateHotelMutation,
  useDeleteHotelMutation,
  useUploadHotelImagesMutation,
} = hotelsApi;
