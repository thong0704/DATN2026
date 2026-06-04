import { api } from '../api/apiSlice';

export const bookingsApi = api.injectEndpoints({
  endpoints: (b) => ({
    createBooking: b.mutation({
      query: (body) => ({ url: '/bookings', method: 'POST', body }),
      invalidatesTags: ['Booking', 'Room'],
    }),
    myBookings: b.query({
      query: (params = {}) => ({ url: '/bookings/my-bookings', params }),
      providesTags: ['Booking'],
    }),
    getBooking: b.query({
      query: (id) => `/bookings/${id}`,
      providesTags: (r, e, id) => [{ type: 'Booking', id }],
    }),
    getBookingByCode: b.query({
      query: (code) => `/bookings/code/${code}`,
    }),
    cancelBooking: b.mutation({
      query: ({ id, reason }) => ({ url: `/bookings/${id}/cancel`, method: 'PUT', body: { reason } }),
      invalidatesTags: ['Booking'],
    }),
    allBookings: b.query({
      query: (params = {}) => ({ url: '/bookings', params }),
      providesTags: ['Booking'],
    }),
    updateBookingStatus: b.mutation({
      query: ({ id, status }) => ({ url: `/bookings/${id}/status`, method: 'PUT', body: { status } }),
      invalidatesTags: ['Booking'],
    }),
    bookingsByHotel: b.query({
      query: (hotelId) => `/bookings/hotel/${hotelId}`,
      providesTags: ['Booking'],
    }),
  }),
});

export const {
  useCreateBookingMutation,
  useMyBookingsQuery,
  useGetBookingQuery,
  useGetBookingByCodeQuery,
  useCancelBookingMutation,
  useAllBookingsQuery,
  useUpdateBookingStatusMutation,
  useBookingsByHotelQuery,
} = bookingsApi;
