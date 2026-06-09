import { api } from '../api/apiSlice';

export const holidayPricingApi = api.injectEndpoints({
  endpoints: (b) => ({
    listHolidayPricing: b.query({
      query: (params) => ({ url: '/holiday-pricing', params }),
      providesTags: (result) =>
        result?.data?.holidays
          ? [
              ...result.data.holidays.map(({ _id }) => ({ type: 'HolidayPricing', id: _id })),
              { type: 'HolidayPricing', id: 'LIST' },
            ]
          : [{ type: 'HolidayPricing', id: 'LIST' }],
    }),
    createHolidayPricing: b.mutation({
      query: (body) => ({ url: '/holiday-pricing', method: 'POST', body }),
      invalidatesTags: [{ type: 'HolidayPricing', id: 'LIST' }],
    }),
    updateHolidayPricing: b.mutation({
      query: ({ id, ...body }) => ({ url: `/holiday-pricing/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'HolidayPricing', id },
        { type: 'HolidayPricing', id: 'LIST' },
      ],
    }),
    deleteHolidayPricing: b.mutation({
      query: (id) => ({ url: `/holiday-pricing/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'HolidayPricing', id: 'LIST' }],
    }),
    applyAllHolidayPricing: b.mutation({
      query: (body) => ({ url: '/holiday-pricing/apply-all', method: 'POST', body }),
      invalidatesTags: [{ type: 'HolidayPricing', id: 'LIST' }],
    }),
  }),
});

export const {
  useListHolidayPricingQuery,
  useCreateHolidayPricingMutation,
  useUpdateHolidayPricingMutation,
  useDeleteHolidayPricingMutation,
  useApplyAllHolidayPricingMutation,
} = holidayPricingApi;
