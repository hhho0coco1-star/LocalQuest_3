import api from './AxiosInstance';

export const businessInquiryApi = {
  createInquiry: (payload) => api.post('/api/business-inquiries', payload),
};
