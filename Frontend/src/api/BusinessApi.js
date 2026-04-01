import api from './AxiosInstance';

export const businessApi = {
  getMyBusinessOverview: (params = null) => api.get('/api/businesses/me', params ? { params } : undefined),
  getMyBusinessQr: (params = null) => api.get('/api/businesses/me/qr', params ? { params } : undefined),
  getMyBusinessQrImage: (params = null) =>
    api.get('/api/businesses/me/qr/image', {
      responseType: 'blob',
      ...(params ? { params } : {})
    }),
  updateMyBusiness: (payload) => api.post('/api/businesses/me', payload),
  getMyCouponRequests: (params) => api.get('/api/businesses/me/coupon-requests', { params }),
  getMyCouponRequestDetail: (requestId) => api.get(`/api/businesses/me/coupon-requests/${requestId}`),
  holdMyCouponRequest: (requestId, holdReason) =>
    api.post(`/api/businesses/me/coupon-requests/${requestId}/hold`, { holdReason }),
  acceptMyCouponRequest: (requestId) =>
    api.post(`/api/businesses/me/coupon-requests/${requestId}/accept`)
};

