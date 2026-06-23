import { api } from '../api/apiSlice';

export const paymentsApi = api.injectEndpoints({
  endpoints: (b) => ({
    createIntent: b.mutation({
      query: (body) => ({ url: '/payments/create-intent', method: 'POST', body }),
    }),
    confirmPayment: b.mutation({
      query: (body) => ({ url: '/payments/confirm', method: 'POST', body }),
      invalidatesTags: ['Booking', 'Payment'],
    }),
    getPaymentForBooking: b.query({
      query: (bookingId) => `/payments/booking/${bookingId}`,
      providesTags: ['Payment'],
    }),
    refund: b.mutation({
      query: ({ bookingId, ...body }) => ({
        url: `/payments/refund/${bookingId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Booking', 'Payment'],
    }),

    
    listInvoices: b.query({
      query: (params = {}) => ({ url: '/payments/admin/list', params }),
      providesTags: ['Payment'],
    }),
    getInvoice: b.query({
      query: (id) => `/payments/invoice/${id}`,
      providesTags: (res, err, id) => [{ type: 'Payment', id }],
    }),
    markInvoicePaid: b.mutation({
      query: (id) => ({ url: `/payments/admin/${id}/mark-paid`, method: 'PATCH' }),
      invalidatesTags: ['Payment', 'Booking'],
    }),
    myInvoices: b.query({
      query: () => '/payments/my',
      providesTags: ['Payment'],
    }),
  }),
});

export const {
  useCreateIntentMutation,
  useConfirmPaymentMutation,
  useGetPaymentForBookingQuery,
  useRefundMutation,
  useListInvoicesQuery,
  useGetInvoiceQuery,
  useMarkInvoicePaidMutation,
  useMyInvoicesQuery,
} = paymentsApi;
