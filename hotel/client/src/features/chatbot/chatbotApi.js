import { api } from '../api/apiSlice';

export const chatbotApi = api.injectEndpoints({
  endpoints: (builder) => ({
    sendMessage: builder.mutation({
      query: (body) => ({
        url: '/chatbot',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useSendMessageMutation } = chatbotApi;
