import api from './AxiosInstance';

export const businessApi = {
  getMyBusinessOverview: () => api.get('/api/businesses/me'),
  updateMyBusiness: (payload) => api.post('/api/businesses/me', payload)
};

