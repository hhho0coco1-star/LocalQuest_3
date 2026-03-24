package com.app.dao.reward;

import java.util.List;
import java.util.Map;

import com.app.dto.reward.RewardBadgeDTO;
import com.app.dto.reward.RewardBoxSummary;
import com.app.dto.reward.RewardRoadmapItem;
import com.app.dto.reward.RewardShopItem;
import com.app.dto.reward.RewardWeeklyStats;
import com.app.dto.reward.RewardWalletCoupon;
import com.app.dto.user.User;

public interface RewardDAO {

	RewardBoxSummary findRewardBoxSummary(String nickname);

	List<RewardRoadmapItem> findRewardRoadmap();

	List<RewardShopItem> findRewardShopItems();

	RewardWeeklyStats findRewardWeeklyStats(String nickname);

	List<RewardWalletCoupon> findRewardWallet(String nickname);

	User findActiveUserByUserId(int userId);

	RewardShopItem findRewardShopItemById(long rewardItemId);

	int deductUserPoint(int userId, int usedPoint);

	int decreaseRewardItemStock(long rewardItemId);

	int insertRewardExchange(Map<String, Object> params);

	int insertPointHistory(Map<String, Object> params);

	int countUserRewardExchange(int userId);

	int sumUserUsedPoint(int userId);

	Integer findBadgeIdByName(String badgeName);

	int insertBadge(RewardBadgeDTO badge);

	int existsUserBadge(int userId, int badgeId);

	int insertUserBadge(int userId, int badgeId);

	RewardBadgeDTO findBadgeById(int badgeId);

	List<RewardBadgeDTO> findUserBadgesByNickname(String nickname);

	RewardWalletCoupon findWalletCouponByExchangeId(long exchangeId);
}
