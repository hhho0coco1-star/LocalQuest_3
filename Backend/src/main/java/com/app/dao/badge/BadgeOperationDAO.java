package com.app.dao.badge;

import java.util.Map;

import com.app.dto.reward.RewardBadgeDTO;
import com.app.dto.user.User;

public interface BadgeOperationDAO {

	User findActiveUserByUserId(int userId);

	User findActiveUserByNickname(String nickname);

	int countCompletedQuestByUserId(int userId);

	int countDistinctVisitedLocationByUserId(int userId);

	int countReviewByUserId(int userId);

	int countRewardExchangeByUserId(int userId);

	int sumUsedPointByUserId(int userId);

	Integer findBadgeIdByName(String badgeName);

	int insertBadge(RewardBadgeDTO badge);

	int existsUserBadge(Map<String, Object> params);

	int insertUserBadge(Map<String, Object> params);
}
