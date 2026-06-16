import { api } from '../api/apiSlice';

export const wishlistApi = api.injectEndpoints({
  endpoints: (b) => ({
    getWishlist: b.query({
      query: () => '/wishlist',
      providesTags: ['Wishlist'],
    }),
    toggleWishlist: b.mutation({
      query: (hotelId) => ({
        url: '/wishlist/toggle',
        method: 'POST',
        body: { hotelId },
      }),
      invalidatesTags: ['Wishlist', 'Auth'],
    }),
  }),
});

export const {
  useGetWishlistQuery,
  useToggleWishlistMutation,
} = wishlistApi;
