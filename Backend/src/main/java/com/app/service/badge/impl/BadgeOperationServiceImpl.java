package com.app.service.badge.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.badge.BadgeOperationDAO;
import com.app.dto.badge.BadgeMetricsDTO;
import com.app.dto.reward.RewardBadgeDTO;
import com.app.dto.user.User;
import com.app.service.badge.BadgeOperationService;

@Service
public class BadgeOperationServiceImpl implements BadgeOperationService {

	private static final List<BadgeRule> BADGE_RULES = List.of(
		new BadgeRule(
			"첫 걸음",
			"퀘스트를 처음 완료한 사용자",
			"퀘스트 누적 1회 완료",
			"badge_first_step",
			1, 0, 0, 0, 0
		),
		new BadgeRule(
			"꾸준한 탐험가",
			"퀘스트를 꾸준히 수행한 사용자",
			"퀘스트 누적 5회 완료",
			"badge_quest_runner",
			5, 0, 0, 0, 0
		),
		new BadgeRule(
			"로컬 단골",
			"퀘스트를 많이 완료한 사용자",
			"퀘스트 누적 20회 완료",
			"badge_local_regular",
			20, 0, 0, 0, 0
		),
		new BadgeRule(
			"동네 탐험가",
			"다양한 퀘스트를 경험한 사용자",
			"서로 다른 장소 5곳 방문 완료",
			"badge_local_explorer",
			0, 5, 0, 0, 0
		),
		new BadgeRule(
			"첫 리뷰어",
			"첫 리뷰를 작성한 사용자",
			"리뷰 누적 1회 작성",
			"badge_first_reviewer",
			0, 0, 1, 0, 0
		),
		new BadgeRule(
			"신뢰 리뷰어",
			"리뷰를 꾸준히 작성한 사용자",
			"리뷰 누적 5회 작성",
			"badge_trusted_reviewer",
			0, 0, 5, 0, 0
		),
		new BadgeRule(
			"첫 교환 달성",
			"리워드 상점에서 첫 교환을 완료한 사용자",
			"리워드 교환 누적 1회",
			"badge_first_exchange",
			0, 0, 0, 1, 0
		),
		new BadgeRule(
			"포인트 마스터",
			"리워드 포인트 사용 누적이 높은 사용자",
			"누적 사용 포인트 3000P 이상",
			"badge_point_master",
			0, 0, 0, 0, 3000
		)
	);

	@Autowired
	private BadgeOperationDAO badgeOperationDAO;

	@Override
	@Transactional
	public List<RewardBadgeDTO> evaluateAndGrantBadges(int userId) {
		if (userId <= 0) {
			return Collections.emptyList();
		}

		User user = badgeOperationDAO.findActiveUserByUserId(userId);
		if (user == null) {
			return Collections.emptyList();
		}

		BadgeMetrics metrics = loadMetrics(userId);
		List<RewardBadgeDTO> newlyAwardedBadges = new ArrayList<>();

		for (int idx = 0; idx < BADGE_RULES.size(); idx++) {
			BadgeRule rule = BADGE_RULES.get(idx);
			if (!rule.matches(metrics)) {
				continue;
			}

			String badgeCategory = resolveBadgeCategory(rule.getIconUrl());
			String badgeDifficulty = resolveBadgeDifficulty(rule.getIconUrl());
			String triggerType = resolveTriggerType(rule.getIconUrl());
			int displayOrder = idx + 1;

			Integer badgeId = badgeOperationDAO.findBadgeIdByName(rule.getName());
			if (badgeId == null) {
				RewardBadgeDTO badge = new RewardBadgeDTO();
				badge.setName(rule.getName());
				badge.setDescription(rule.getDescription());
				badge.setConditionText(rule.getConditionText());
				badge.setIconUrl(rule.getIconUrl());
				badge.setBadgeCategory(badgeCategory);
				badge.setBadgeDifficulty(badgeDifficulty);
				badge.setTriggerType(triggerType);
				badge.setDisplayOrder(Integer.valueOf(displayOrder));
				badge.setIsActive("Y");
				badgeOperationDAO.insertBadge(badge);
				badgeId = badgeOperationDAO.findBadgeIdByName(rule.getName());
			}

			if (badgeId == null) {
				continue;
			}

			Map<String, Object> params = Map.of("userId", userId, "badgeId", badgeId.intValue());
			if (badgeOperationDAO.existsUserBadge(params) > 0) {
				continue;
			}

			badgeOperationDAO.insertUserBadge(params);

			RewardBadgeDTO awarded = new RewardBadgeDTO();
			awarded.setBadgeId(badgeId.longValue());
			awarded.setName(rule.getName());
			awarded.setDescription(rule.getDescription());
			awarded.setConditionText(rule.getConditionText());
			awarded.setIconUrl(rule.getIconUrl());
			awarded.setBadgeCategory(badgeCategory);
			awarded.setBadgeDifficulty(badgeDifficulty);
			awarded.setTriggerType(triggerType);
			awarded.setDisplayOrder(Integer.valueOf(displayOrder));
			awarded.setIsActive("Y");
			awarded.setEarnedAt(new Date());
			newlyAwardedBadges.add(awarded);
		}

		return newlyAwardedBadges;
	}

	@Override
	@Transactional
	public List<RewardBadgeDTO> evaluateAndGrantBadgesByNickname(String nickname) {
		if (nickname == null || nickname.trim().isEmpty()) {
			return Collections.emptyList();
		}

		User user = badgeOperationDAO.findActiveUserByNickname(nickname.trim());
		if (user == null || user.getUserId() <= 0) {
			return Collections.emptyList();
		}

		return evaluateAndGrantBadges(user.getUserId());
	}

	@Override
	public BadgeMetricsDTO getBadgeMetrics(int userId) {
		BadgeMetricsDTO response = new BadgeMetricsDTO();
		if (userId <= 0) {
			return response;
		}

		User user = badgeOperationDAO.findActiveUserByUserId(userId);
		if (user == null) {
			return response;
		}

		BadgeMetrics metrics = loadMetrics(userId);
		response.setCompletedQuestCount(metrics.completedQuestCount);
		response.setDistinctVisitedLocationCount(metrics.distinctVisitedLocationCount);
		response.setReviewCount(metrics.reviewCount);
		response.setRewardExchangeCount(metrics.rewardExchangeCount);
		response.setUsedPointSum(metrics.usedPointSum);
		return response;
	}

	private BadgeMetrics loadMetrics(int userId) {
		BadgeMetrics metrics = new BadgeMetrics();
		metrics.completedQuestCount = badgeOperationDAO.countCompletedQuestByUserId(userId);
		metrics.distinctVisitedLocationCount = badgeOperationDAO.countDistinctVisitedLocationByUserId(userId);
		metrics.reviewCount = badgeOperationDAO.countReviewByUserId(userId);
		metrics.rewardExchangeCount = badgeOperationDAO.countRewardExchangeByUserId(userId);
		metrics.usedPointSum = badgeOperationDAO.sumUsedPointByUserId(userId);
		return metrics;
	}

	private String resolveBadgeCategory(String iconUrl) {
		String key = normalizeIconKey(iconUrl);
		if ("badge_local_explorer".equals(key)) {
			return "EXPLORE";
		}
		if ("badge_first_reviewer".equals(key) || "badge_trusted_reviewer".equals(key)) {
			return "COMPLETE";
		}
		if ("badge_first_exchange".equals(key) || "badge_exchange_runner".equals(key) || "badge_point_master".equals(key)) {
			return "BENEFIT";
		}
		return "HABIT";
	}

	private String resolveBadgeDifficulty(String iconUrl) {
		String key = normalizeIconKey(iconUrl);
		if ("badge_local_regular".equals(key) || "badge_point_master".equals(key)) {
			return "HARD";
		}
		if ("badge_quest_runner".equals(key)
			|| "badge_local_explorer".equals(key)
			|| "badge_trusted_reviewer".equals(key)
			|| "badge_exchange_runner".equals(key)) {
			return "MID";
		}
		return "EASY";
	}

	private String resolveTriggerType(String iconUrl) {
		String key = normalizeIconKey(iconUrl);
		if ("badge_first_reviewer".equals(key) || "badge_trusted_reviewer".equals(key)) {
			return "REVIEW_CREATE";
		}
		if ("badge_first_exchange".equals(key) || "badge_exchange_runner".equals(key) || "badge_point_master".equals(key)) {
			return "REWARD_EXCHANGE";
		}
		return "QUEST_COMPLETE";
	}

	private String normalizeIconKey(String iconUrl) {
		return iconUrl == null ? "" : iconUrl.trim().toLowerCase();
	}

	private static final class BadgeMetrics {
		private int completedQuestCount;
		private int distinctVisitedLocationCount;
		private int reviewCount;
		private int rewardExchangeCount;
		private int usedPointSum;
	}

	private static final class BadgeRule {
		private final String name;
		private final String description;
		private final String conditionText;
		private final String iconUrl;
		private final int requiredCompletedQuestCount;
		private final int requiredDistinctVisitedLocationCount;
		private final int requiredReviewCount;
		private final int requiredRewardExchangeCount;
		private final int requiredUsedPointSum;

		private BadgeRule(
			String name,
			String description,
			String conditionText,
			String iconUrl,
			int requiredCompletedQuestCount,
			int requiredDistinctVisitedLocationCount,
			int requiredReviewCount,
			int requiredRewardExchangeCount,
			int requiredUsedPointSum
		) {
			this.name = name;
			this.description = description;
			this.conditionText = conditionText;
			this.iconUrl = iconUrl;
			this.requiredCompletedQuestCount = requiredCompletedQuestCount;
			this.requiredDistinctVisitedLocationCount = requiredDistinctVisitedLocationCount;
			this.requiredReviewCount = requiredReviewCount;
			this.requiredRewardExchangeCount = requiredRewardExchangeCount;
			this.requiredUsedPointSum = requiredUsedPointSum;
		}

		private boolean matches(BadgeMetrics metrics) {
			boolean questSatisfied = requiredCompletedQuestCount <= 0 || metrics.completedQuestCount >= requiredCompletedQuestCount;
			boolean locationSatisfied = requiredDistinctVisitedLocationCount <= 0
				|| metrics.distinctVisitedLocationCount >= requiredDistinctVisitedLocationCount;
			boolean reviewSatisfied = requiredReviewCount <= 0 || metrics.reviewCount >= requiredReviewCount;
			boolean exchangeSatisfied = requiredRewardExchangeCount <= 0 || metrics.rewardExchangeCount >= requiredRewardExchangeCount;
			boolean pointSatisfied = requiredUsedPointSum <= 0 || metrics.usedPointSum >= requiredUsedPointSum;

			return questSatisfied && locationSatisfied && reviewSatisfied && exchangeSatisfied && pointSatisfied;
		}

		private String getName() {
			return name;
		}

		private String getDescription() {
			return description;
		}

		private String getConditionText() {
			return conditionText;
		}

		private String getIconUrl() {
			return iconUrl;
		}
	}
}
