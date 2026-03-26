import api from './AxiosInstance';

export const businessApi = {
  getMyBusinessOverview: () => api.get('/api/businesses/me')
};

