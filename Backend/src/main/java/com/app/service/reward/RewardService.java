package com.app.service.reward;

import java.util.List;

import com.app.dto.reward.RewardBadgeDTO;
import com.app.dto.reward.RewardBoxSummary;
import com.app.dto.reward.RewardExchangeResultDTO;
import com.app.dto.reward.RewardShopItem;
import com.app.dto.reward.RewardWeeklyStats;
import com.app.dto.reward.RewardWalletCoupon;

public interface RewardService {

	RewardBoxSummary getRewardBoxSummary(String nickname);

	List<RewardShopItem> getRewardShopItems();

	RewardWeeklyStats getRewardWeeklyStats(String nickname);

	List<RewardWalletCoupon> getRewardWallet(String nickname);

	RewardExchangeResultDTO exchangeReward(int userId, long rewardItemId);

	List<RewardBadgeDTO> getRewardBadges(String nickname);
}
