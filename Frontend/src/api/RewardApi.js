import api from "./AxiosInstance";

export const rewardApi = {
  getRewardSummary: (nickname) => {
    const params = {};
    if (nickname && nickname.trim()) {
      params.nickname = nickname.trim();
    }

    return api.get("/api/rewards/summary", { params });
  },

  getRewardWallet: (nickname) => {
    const params = {};
    if (nickname && nickname.trim()) {
      params.nickname = nickname.trim();
    }

    return api.get("/api/rewards/wallet", { params });
  },

  getRewardItems: () => {
    return api.get("/api/rewards/items");
  },

  getRewardWeeklyStats: (nickname) => {
    const params = {};
    if (nickname && nickname.trim()) {
      params.nickname = nickname.trim();
    }

    return api.get("/api/rewards/weekly", { params });
  },
};
