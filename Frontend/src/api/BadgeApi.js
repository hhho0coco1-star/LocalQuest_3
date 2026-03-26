import api from "./AxiosInstance";

export const badgeApi = {
  getBadgeCatalog: () => {
    return api.get("/api/badges/catalog");
  },

  getUserBadges: (nickname) => {
    const params = {};
    if (nickname && nickname.trim()) {
      params.nickname = nickname.trim();
    }

    return api.get("/api/badges/user", { params });
  },
};
