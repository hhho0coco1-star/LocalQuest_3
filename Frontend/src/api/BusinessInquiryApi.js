import api from './AxiosInstance';

export const businessInquiryApi = {
  getLatestInquiry: (userId) => api.get('/api/business-inquiries/latest', { params: { userId } }),
  createInquiry: (payload) => api.post('/api/business-inquiries', payload),
};
