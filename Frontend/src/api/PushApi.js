import api from './AxiosInstance';

export const pushApi = {
  getConfig: () => api.get('/api/push/config'),
  getSettings: () => api.get('/api/push/settings'),
  saveSettings: (payload) => api.put('/api/push/settings', payload),
  getSubscriptions: () => api.get('/api/push/subscriptions'),
  saveSubscription: (payload) => api.post('/api/push/subscriptions', payload),
  deactivateSubscription: (endpoint) =>
    api.delete('/api/push/subscriptions', { params: { endpoint } }),
  sendTest: (payload = {}) => api.post('/api/push/test', payload),
};
