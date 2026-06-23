import { api } from '../api/apiSlice';

export const contentApi = api.injectEndpoints({
  endpoints: (b) => ({
    listArticles: b.query({
      query: (params = {}) => ({ url: '/articles', params }),
      providesTags: ['Article'],
    }),
    getArticle: b.query({
      query: (slug) => `/articles/${slug}`,
      providesTags: (r, e, slug) => [{ type: 'Article', id: slug }],
    }),
    listAllArticlesAdmin: b.query({
      query: () => '/admin/articles',
      providesTags: ['Article'],
    }),
    createArticle: b.mutation({
      query: (body) => ({ url: '/articles', method: 'POST', body }),
      invalidatesTags: ['Article'],
    }),
    updateArticle: b.mutation({
      query: ({ id, ...body }) => ({ url: `/articles/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Article'],
    }),
    deleteArticle: b.mutation({
      query: (id) => ({ url: `/articles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Article'],
    }),
    uploadArticleCover: b.mutation({
      query: (formData) => ({ url: '/articles/upload-cover', method: 'POST', body: formData }),
    }),
    
    listPublicBanners: b.query({
      query: (params = {}) => ({ url: '/banners', params }),
      providesTags: ['Banner'],
    }),
    listBannersAdmin: b.query({
      query: (params = {}) => ({ url: '/admin/banners', params }),
      providesTags: ['Banner'],
    }),
    createBanner: b.mutation({
      query: (body) => ({ url: '/banners', method: 'POST', body }),
      invalidatesTags: ['Banner'],
    }),
    updateBanner: b.mutation({
      query: ({ id, ...body }) => ({ url: `/banners/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Banner'],
    }),
    deleteBanner: b.mutation({
      query: (id) => ({ url: `/banners/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Banner'],
    }),
    uploadBannerImage: b.mutation({
      query: (formData) => ({ url: '/banners/upload-image', method: 'POST', body: formData }),
    }),
    
    submitContact: b.mutation({
      query: (body) => ({ url: '/contact', method: 'POST', body }),
    }),
    listContacts: b.query({
      query: () => '/contact',
      providesTags: ['Contact'],
    }),
    markContactRead: b.mutation({
      query: (id) => ({ url: `/contact/${id}/read`, method: 'PUT' }),
      invalidatesTags: ['Contact'],
    }),
    deleteContact: b.mutation({
      query: (id) => ({ url: `/contact/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Contact'],
    }),
  }),
});

export const {
  useListArticlesQuery,
  useGetArticleQuery,
  useListAllArticlesAdminQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
  useUploadArticleCoverMutation,
  useListPublicBannersQuery,
  useListBannersAdminQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useUploadBannerImageMutation,
  useSubmitContactMutation,
  useListContactsQuery,
  useMarkContactReadMutation,
  useDeleteContactMutation,
} = contentApi;
