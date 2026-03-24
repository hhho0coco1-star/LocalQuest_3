import api from './AxiosInstance';

export const inquiryApi = {
  getMyInquiries: () => api.get('/api/inquiries/me'),
};

