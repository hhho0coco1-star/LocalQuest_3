import api from './AxiosInstance';

export const businessApi = {
  getMyBusinessOverview: () => api.get('/api/businesses/me'),
  getMyCouponRequests: (params) => api.get('/api/businesses/me/coupon-requests', { params }),
  getMyCouponRequestDetail: (requestId) => api.get(`/api/businesses/me/coupon-requests/${requestId}`),
  holdMyCouponRequest: (requestId, holdReason) =>
    api.post(`/api/businesses/me/coupon-requests/${requestId}/hold`, { holdReason }),
  acceptMyCouponRequest: (requestId) =>
    api.post(`/api/businesses/me/coupon-requests/${requestId}/accept`)
};

