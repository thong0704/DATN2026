import { api } from '../api/apiSlice';

export const roomsApi = api.injectEndpoints({
  endpoints: (b) => ({
    availableRooms: b.query({
      query: (params) => ({ url: '/rooms/available', params }),
      providesTags: ['Room'],
    }),
    getRoom: b.query({ query: (id) => `/rooms/${id}` }),
    roomsByHotel: b.query({
      query: (hotelId) => `/rooms/hotel/${hotelId}`,
      providesTags: ['Room'],
    }),
    createRoom: b.mutation({
      query: (body) => ({ url: '/rooms', method: 'POST', body }),
      invalidatesTags: ['Room'],
    }),
    updateRoom: b.mutation({
      query: ({ id, ...body }) => ({ url: `/rooms/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Room'],
    }),
    deleteRoom: b.mutation({
      query: (id) => ({ url: `/rooms/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Room'],
    }),
    updateRoomStatus: b.mutation({
      query: ({ id, status }) => ({ url: `/rooms/${id}/status`, method: 'PUT', body: { status } }),
      invalidatesTags: ['Room'],
    }),
    uploadRoomImages: b.mutation({
      query: ({ id, formData }) => ({
        url: `/rooms/${id}/images`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Room'],
    }),
  }),
});

export const {
  useAvailableRoomsQuery,
  useGetRoomQuery,
  useRoomsByHotelQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useUpdateRoomStatusMutation,
  useUploadRoomImagesMutation,
} = roomsApi;
