import api from './AxiosInstance';

export const questApi = {
  getQuestList: () => api.get('/api/quests'),
  getQuestMapList: () => api.get('/api/quests/map'),
  getQuestDetail: (questId) => api.get(`/api/quests/${questId}`),
  getMyQuestOverview: () => api.get('/api/user-quests/me'),
  getMyQuestDetail: (userQuestId) => api.get(`/api/user-quests/me/${userQuestId}`),
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
