import { api } from '../api/apiSlice';

export const couponsApi = api.injectEndpoints({
  endpoints: (b) => ({
    listMyCoupons: b.query({
      query: () => '/coupons/mine',
      providesTags: ['Coupon'],
    }),
    createCoupon: b.mutation({
      query: (body) => ({ url: '/coupons', method: 'POST', body }),
      invalidatesTags: ['Coupon'],
    }),
    updateCoupon: b.mutation({
      query: ({ id, ...body }) => ({ url: `/coupons/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Coupon'],
    }),
    deleteCoupon: b.mutation({
      query: (id) => ({ url: `/coupons/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Coupon'],
    }),
    validateCoupon: b.mutation({
      query: (body) => ({ url: '/coupons/validate', method: 'POST', body }),
    }),
  }),
});

export const {
  useListMyCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useValidateCouponMutation,
} = couponsApi;
