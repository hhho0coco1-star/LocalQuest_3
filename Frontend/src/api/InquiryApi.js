import api from './AxiosInstance';

export const inquiryApi = {
  createInquiry: (payload) => api.post('/api/inquiries', payload),
  getMyInquiries: () => api.get('/api/inquiries/me'),
};

