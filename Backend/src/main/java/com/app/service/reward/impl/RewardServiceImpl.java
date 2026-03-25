package com.app.service.reward.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.reward.RewardDAO;
import com.app.dto.reward.RewardBadgeDTO;
import com.app.dto.reward.RewardBoxSummary;
import com.app.dto.reward.RewardExchangeResultDTO;
import com.app.dto.reward.RewardShopItem;
import com.app.dto.reward.RewardWeeklyStats;
import com.app.dto.reward.RewardWalletCoupon;
import com.app.dto.user.User;
import com.app.service.reward.RewardService;

@Service
public class RewardServiceImpl implements RewardService {

	private static final int WEEKLY_XP_GOAL = 700;
	private static final String DEFAULT_REWARD_STATUS = "ON_SALE";
	private static final List<RewardBadgeRule> BADGE_RULES = List.of(
		new RewardBadgeRule(
			"첫 교환 달성",
			"리워드 상점에서 첫 교환을 완료했어요.",
			"누적 교환 1회 달성",
			"badge_first_exchange",
			1,
			0
		),
		new RewardBadgeRule(
			"꾸준한 교환러",
			"리워드 상점 교환을 꾸준히 이어가고 있어요.",
			"누적 교환 3회 달성",
			"badge_exchange_runner",
			3,
			0
		),
		new RewardBadgeRule(
			"포인트 마스터",
			"리워드 상점에서 포인트를 전략적으로 사용했어요.",
			"누적 사용 포인트 3000P 달성",
			"badge_point_master",
			0,
			3000
		)
	);

	@Autowired
	private RewardDAO rewardDAO;

	@Override
	public RewardBoxSummary getRewardBoxSummary(String nickname) {
		RewardBoxSummary summary = rewardDAO.findRewardBoxSummary(nickname);
		if (summary == null) {
			return null;
		}

		int currentLevel = safeInt(summary.getCurrentLevel(), 1);
		int currentLevelMinExp = safeInt(summary.getCurrentLevelMinExp(), Math.max(0, (currentLevel - 1) * 500));
		int nextLevel = safeInt(summary.getNextLevel(), currentLevel + 1);
		int nextLevelMinExp = safeInt(summary.getNextLevelMinExp(), currentLevelMinExp + 500);
		int exp = Math.max(0, safeInt(summary.getExp(), 0));
		int point = Math.max(0, safeInt(summary.getPoint(), 0));

		if (nextLevelMinExp <= currentLevelMinExp) {
			nextLevelMinExp = currentLevelMinExp + 1;
		}

		int sectionExp = Math.max(1, nextLevelMinExp - currentLevelMinExp);
		int progressedExp = Math.max(0, exp - currentLevelMinExp);
		int progressPercent = clamp((int) Math.round((progressedExp * 100.0) / sectionExp), 0, 100);
		int nextLevelRemainXp = Math.max(nextLevelMinExp - exp, 0);

		summary.setCurrentLevel(currentLevel);
		summary.setCurrentLevelMinExp(currentLevelMinExp);
		summary.setNextLevel(nextLevel);
		summary.setNextLevelMinExp(nextLevelMinExp);
		summary.setExp(exp);
		summary.setPoint(point);
		summary.setProgressPercent(progressPercent);
		summary.setNextLevelRemainXp(nextLevelRemainXp);

		Integer nextGradeMinLevel = summary.getNextGradeMinLevel();
		if (nextGradeMinLevel == null) {
			summary.setRemainLevelToNextGrade(0);
		} else {
			summary.setRemainLevelToNextGrade(Math.max(nextGradeMinLevel - currentLevel, 0));
		}

		summary.setRoadmap(rewardDAO.findRewardRoadmap());
		return summary;
	}

	@Override
	public List<RewardShopItem> getRewardShopItems() {
		List<RewardShopItem> items = rewardDAO.findRewardShopItems();
		if (items == null || items.isEmpty()) {
			return Collections.emptyList();
		}

		for (RewardShopItem item : items) {
			item.setPricePoint(Math.max(0, safeInt(item.getPricePoint(), 0)));
			item.setStock(Math.max(0, safeInt(item.getStock(), 0)));

			String status = trimToEmpty(item.getStatus());
			if (status.isEmpty()) {
				item.setStatus(item.getStock() > 0 ? DEFAULT_REWARD_STATUS : "SOLD_OUT");
			}
		}

		return items;
	}

	@Override
	public RewardWeeklyStats getRewardWeeklyStats(String nickname) {
		if (nickname == null || nickname.trim().isEmpty()) {
			return createEmptyWeeklyStats();
		}

		RewardWeeklyStats stats = rewardDAO.findRewardWeeklyStats(nickname.trim());
		if (stats == null) {
			return createEmptyWeeklyStats();
		}

		int questDone = Math.max(0, safeInt(stats.getQuestDone(), 0));
		int gainXp = Math.max(0, safeInt(stats.getGainXp(), 0));
		int usedCoupon = Math.max(0, safeInt(stats.getUsedCoupon(), 0));
		int topPercent = clamp(Math.max(1, safeInt(stats.getTopPercent(), 100)), 1, 100);
		int weeklyProgress = clamp((int) Math.floor((gainXp * 100.0) / WEEKLY_XP_GOAL), 0, 100);

		stats.setQuestDone(questDone);
		stats.setGainXp(gainXp);
		stats.setUsedCoupon(usedCoupon);
		stats.setTopPercent(topPercent);
		stats.setWeeklyProgress(weeklyProgress);
		return stats;
	}

	@Override
	public List<RewardWalletCoupon> getRewardWallet(String nickname) {
		if (nickname == null || nickname.trim().isEmpty()) {
			return Collections.emptyList();
		}

		List<RewardWalletCoupon> coupons = rewardDAO.findRewardWallet(nickname.trim());
		if (coupons == null || coupons.isEmpty()) {
			return Collections.emptyList();
		}

		for (RewardWalletCoupon coupon : coupons) {
			normalizeWalletCoupon(coupon);
		}

		return coupons;
	}

	@Override
	public List<RewardBadgeDTO> getRewardBadges(String nickname) {
		if (nickname == null || nickname.trim().isEmpty()) {
			return Collections.emptyList();
		}

		List<RewardBadgeDTO> badges = rewardDAO.findUserBadgesByNickname(nickname.trim());
		if (badges == null || badges.isEmpty()) {
			return Collections.emptyList();
		}

		return badges;
	}

	@Override
	@Transactional
	public RewardExchangeResultDTO exchangeReward(int userId, long rewardItemId) {
		if (userId <= 0 || rewardItemId <= 0) {
			throw new IllegalArgumentException("잘못된 교환 요청입니다.");
		}

		User user = rewardDAO.findActiveUserByUserId(userId);
		if (user == null) {
			throw new NoSuchElementException("사용자 정보를 찾을 수 없습니다.");
		}

		RewardShopItem item = rewardDAO.findRewardShopItemById(rewardItemId);
		if (item == null) {
			throw new NoSuchElementException("리워드 상품 정보를 찾을 수 없습니다.");
		}

		int usedPoint = Math.max(0, safeInt(item.getPricePoint(), 0));
		if (usedPoint <= 0) {
			throw new IllegalStateException("교환할 수 없는 상품입니다.");
		}

		int currentStock = Math.max(0, safeInt(item.getStock(), 0));
		String currentStatus = trimToEmpty(item.getStatus()).toUpperCase();
		if (!DEFAULT_REWARD_STATUS.equals(currentStatus) || currentStock <= 0) {
			throw new IllegalStateException("품절되었거나 판매 중이 아닌 상품입니다.");
		}

		int deductedUserCount = rewardDAO.deductUserPoint(userId, usedPoint);
		if (deductedUserCount != 1) {
			throw new IllegalArgumentException("보유 포인트가 부족합니다.");
		}

		int updatedItemCount = rewardDAO.decreaseRewardItemStock(rewardItemId);
		if (updatedItemCount != 1) {
			throw new IllegalStateException("상품 재고가 부족합니다. 다시 시도해주세요.");
		}

		Map<String, Object> exchangeParams = new HashMap<>();
		exchangeParams.put("userId", userId);
		exchangeParams.put("rewardItemId", rewardItemId);
		exchangeParams.put("usedPoint", usedPoint);
		rewardDAO.insertRewardExchange(exchangeParams);

		long exchangeId = safeLong(exchangeParams.get("exchangeId"), 0L);

		Map<String, Object> pointHistoryParams = new HashMap<>();
		pointHistoryParams.put("userId", userId);
		pointHistoryParams.put("pointAmount", -usedPoint);
		pointHistoryParams.put("category", "REWARD_EXCHANGE");
		pointHistoryParams.put("description", "[" + trimToEmpty(item.getName()) + "] 교환");
		rewardDAO.insertPointHistory(pointHistoryParams);

		User updatedUser = rewardDAO.findActiveUserByUserId(userId);
		RewardShopItem updatedItem = rewardDAO.findRewardShopItemById(rewardItemId);

		RewardWalletCoupon walletCoupon = null;
		if (exchangeId > 0) {
			walletCoupon = rewardDAO.findWalletCouponByExchangeId(exchangeId);
			normalizeWalletCoupon(walletCoupon);
		}

		List<RewardBadgeDTO> newlyAwardedBadges = evaluateAndAwardBadges(userId);

		RewardExchangeResultDTO result = new RewardExchangeResultDTO();
		result.setExchangeId(exchangeId > 0 ? Long.valueOf(exchangeId) : null);
		result.setRewardItemId(rewardItemId);
		result.setItemName(item.getName());
		result.setUsedPoint(usedPoint);
		result.setRemainingPoint(updatedUser == null ? 0 : Math.max(0, updatedUser.getPoint()));
		result.setUpdatedStock(updatedItem == null ? Math.max(0, currentStock - 1) : Math.max(0, safeInt(updatedItem.getStock(), 0)));
		result.setItemStatus(updatedItem == null ? DEFAULT_REWARD_STATUS : trimToEmpty(updatedItem.getStatus()));
		result.setWalletCoupon(walletCoupon);
		result.setNewlyAwardedBadges(newlyAwardedBadges);
		return result;
	}

	private RewardWeeklyStats createEmptyWeeklyStats() {
		RewardWeeklyStats stats = new RewardWeeklyStats();
		stats.setQuestDone(0);
		stats.setGainXp(0);
		stats.setUsedCoupon(0);
		stats.setTopPercent(100);
		stats.setWeeklyProgress(0);
		return stats;
	}

	private List<RewardBadgeDTO> evaluateAndAwardBadges(int userId) {
		int exchangeCount = rewardDAO.countUserRewardExchange(userId);
		int totalUsedPoint = rewardDAO.sumUserUsedPoint(userId);

		if (exchangeCount <= 0) {
			return Collections.emptyList();
		}

		List<RewardBadgeDTO> newlyAwardedBadges = new ArrayList<>();
		for (RewardBadgeRule rule : BADGE_RULES) {
			if (!rule.matches(exchangeCount, totalUsedPoint)) {
				continue;
			}

			Integer badgeId = rewardDAO.findBadgeIdByName(rule.getName());
			if (badgeId == null) {
				RewardBadgeDTO badgeToCreate = new RewardBadgeDTO();
				badgeToCreate.setName(rule.getName());
				badgeToCreate.setDescription(rule.getDescription());
				badgeToCreate.setConditionText(rule.getConditionText());
				badgeToCreate.setIconUrl(rule.getIconUrl());
				rewardDAO.insertBadge(badgeToCreate);
				badgeId = rewardDAO.findBadgeIdByName(rule.getName());
			}

			if (badgeId == null) {
				continue;
			}

			if (rewardDAO.existsUserBadge(userId, badgeId.intValue()) > 0) {
				continue;
			}

			rewardDAO.insertUserBadge(userId, badgeId.intValue());

			RewardBadgeDTO earnedBadge = rewardDAO.findBadgeById(badgeId.intValue());
			if (earnedBadge == null) {
				earnedBadge = new RewardBadgeDTO();
				earnedBadge.setBadgeId(badgeId.longValue());
				earnedBadge.setName(rule.getName());
				earnedBadge.setDescription(rule.getDescription());
				earnedBadge.setConditionText(rule.getConditionText());
				earnedBadge.setIconUrl(rule.getIconUrl());
			}
			earnedBadge.setEarnedAt(new Date());
			newlyAwardedBadges.add(earnedBadge);
		}

		return newlyAwardedBadges;
	}

	private void normalizeWalletCoupon(RewardWalletCoupon coupon) {
		if (coupon == null) {
			return;
		}

		Integer daysLeft = coupon.getDaysLeft();
		if (daysLeft == null) {
			coupon.setExpire("만료일 미정");
			coupon.setUrgent(false);
			return;
		}

		if (daysLeft <= 0) {
			coupon.setExpire("오늘 만료");
		} else {
			coupon.setExpire(daysLeft + "일 남음");
		}
		coupon.setUrgent(daysLeft <= 2);
	}

	private int safeInt(Integer value, int fallback) {
		return value == null ? fallback : value.intValue();
	}

	private long safeLong(Object value, long fallback) {
		if (value == null) {
			return fallback;
		}

		if (value instanceof Number) {
			return ((Number) value).longValue();
		}

		try {
			return Long.parseLong(value.toString());
		} catch (NumberFormatException e) {
			return fallback;
		}
	}

	private String trimToEmpty(String value) {
		return value == null ? "" : value.trim();
	}

	private int clamp(int value, int min, int max) {
		return Math.max(min, Math.min(max, value));
	}

	private static class RewardBadgeRule {
		private final String name;
		private final String description;
		private final String conditionText;
		private final String iconUrl;
		private final int requiredExchangeCount;
		private final int requiredUsedPoint;

		private RewardBadgeRule(
			String name,
			String description,
			String conditionText,
			String iconUrl,
			int requiredExchangeCount,
			int requiredUsedPoint
		) {
			this.name = name;
			this.description = description;
			this.conditionText = conditionText;
			this.iconUrl = iconUrl;
			this.requiredExchangeCount = requiredExchangeCount;
			this.requiredUsedPoint = requiredUsedPoint;
		}

		private boolean matches(int exchangeCount, int totalUsedPoint) {
			boolean exchangeSatisfied = requiredExchangeCount <= 0 || exchangeCount >= requiredExchangeCount;
			boolean pointSatisfied = requiredUsedPoint <= 0 || totalUsedPoint >= requiredUsedPoint;
			return exchangeSatisfied && pointSatisfied;
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
