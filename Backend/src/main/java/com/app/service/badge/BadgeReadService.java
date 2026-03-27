package com.app.service.badge;

import java.util.List;

import com.app.dto.reward.RewardBadgeDTO;

public interface BadgeReadService {

	List<RewardBadgeDTO> getBadgeCatalog();

	List<RewardBadgeDTO> getUserBadges(String nickname);

	List<RewardBadgeDTO> getUserBadgesByUserId(int userId);
}
