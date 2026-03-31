package com.app.service.badge;

import java.util.List;

import com.app.dto.badge.BadgeMetricsDTO;
import com.app.dto.reward.RewardBadgeDTO;

public interface BadgeOperationService {

	List<RewardBadgeDTO> evaluateAndGrantBadges(int userId);

	List<RewardBadgeDTO> evaluateAndGrantBadgesByNickname(String nickname);

	BadgeMetricsDTO getBadgeMetrics(int userId);
}
