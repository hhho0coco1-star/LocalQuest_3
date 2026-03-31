import api from './AxiosInstance';

export const businessApi = {
  getMyBusinessOverview: (params = null) => api.get('/api/businesses/me', params ? { params } : undefined),
  getMyBusinessQr: (params = null) => api.get('/api/businesses/me/qr', params ? { params } : undefined),
  getMyBusinessQrImage: (params = null) =>
    api.get('/api/businesses/me/qr/image', {
      responseType: 'blob',
      ...(params ? { params } : {})
    }),
  updateMyBusiness: (payload) => api.post('/api/businesses/me', payload)
};

