package com.app.dao.badge;

import java.util.List;

import com.app.dto.reward.RewardBadgeDTO;

public interface BadgeReadDAO {

	List<RewardBadgeDTO> findBadgeCatalog();

	List<RewardBadgeDTO> findUserBadgesByNickname(String nickname);

	List<RewardBadgeDTO> findUserBadgesByUserId(int userId);
}
