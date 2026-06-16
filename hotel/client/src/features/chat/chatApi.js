import { api } from '../api/apiSlice';

export const chatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getChatMessages: builder.query({
      query: (params) => ({
        url: '/chat/messages',
        params,
      }),
      providesTags: ['Chat'],
    }),
    getChatSessions: builder.query({
      query: () => '/chat/sessions',
      providesTags: ['ChatSessions'],
    }),
  }),
});

export const { useGetChatMessagesQuery, useLazyGetChatMessagesQuery, useGetChatSessionsQuery } = chatApi;
