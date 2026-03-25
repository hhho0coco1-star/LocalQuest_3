import api from './AxiosInstance';

export const questApi = {
  getQuestList: () => api.get('/api/quests'),
  getQuestMapList: () => api.get('/api/quests/map'),
  getTopRatedQuests: () => api.get('/api/quests/top-rated'),
  getQuestDetail: (questId) => api.get(`/api/quests/${questId}`),
  acceptQuest: (questId) => api.post('/api/user-quests/accept', null, { params: { questId } }),
  getMyQuestOverview: () => api.get('/api/user-quests/me'),
  getMyQuestDetail: (userQuestId) => api.get(`/api/user-quests/me/${userQuestId}`),
  completeMyQuest: (userQuestId) => api.post(`/api/user-quests/me/${userQuestId}/complete`),
  cancelMyQuest: (userQuestId) => api.post(`/api/user-quests/me/${userQuestId}/cancel`),
  verifyQuestGps: (userQuestId, questLocationId, latitude, longitude) =>
    api.post(`/api/user-quests/me/${userQuestId}/locations/${questLocationId}/gps-verification`, null, {
      params: { latitude, longitude },
    }),
  verifyQuestQr: (userQuestId, questLocationId, qrAuthKey) =>
    api.post(`/api/user-quests/me/${userQuestId}/locations/${questLocationId}/qr-verification`, null, {
      params: { qrAuthKey },
    }),
  verifyQuestReceipt: (userQuestId, questLocationId, formData) =>
    api.post(
      `/api/user-quests/me/${userQuestId}/locations/${questLocationId}/receipt-verification`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    ),
  getQuestReviews: (questId) => api.get(`/api/quests/${questId}/reviews`),
  createQuestReview: (questId, payload) => api.post(`/api/quests/${questId}/reviews`, payload),
  updateQuestReview: (questId, reviewId, payload) =>
    api.put(`/api/quests/${questId}/reviews/${reviewId}`, payload),
  deleteQuestReview: (questId, reviewId, userId) =>
    api.delete(`/api/quests/${questId}/reviews/${reviewId}`, { params: { userId } }),
};
