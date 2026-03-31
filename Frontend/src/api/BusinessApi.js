import api from './AxiosInstance';

export const businessApi = {
  getMyBusinessOverview: (params = null) => api.get('/api/businesses/me', params ? { params } : undefined),
  updateMyBusiness: (payload) => api.post('/api/businesses/me', payload)
};

