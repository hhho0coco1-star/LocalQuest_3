package com.app.dao.reward.impl;

import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dto.reward.RewardBadgeDTO;
import com.app.dao.reward.RewardDAO;
import com.app.dto.reward.RewardBoxSummary;
import com.app.dto.reward.RewardRoadmapItem;
import com.app.dto.reward.RewardShopItem;
import com.app.dto.reward.RewardWeeklyStats;
import com.app.dto.reward.RewardWalletCoupon;
import com.app.dto.user.User;

@Repository
public class RewardDAOImpl implements RewardDAO {

	@Autowired
	private SqlSessionTemplate sqlSessionTemplate;

	@Override
	public RewardBoxSummary findRewardBoxSummary(String nickname) {
		return sqlSessionTemplate.selectOne("reward_mapper.findRewardBoxSummary", nickname);
	}

	@Override
	public List<RewardRoadmapItem> findRewardRoadmap() {
		return sqlSessionTemplate.selectList("reward_mapper.findRewardRoadmap");
	}

	@Override
	public List<RewardShopItem> findRewardShopItems() {
		return sqlSessionTemplate.selectList("reward_mapper.findRewardShopItems");
	}

	@Override
	public RewardWeeklyStats findRewardWeeklyStats(String nickname) {
		return sqlSessionTemplate.selectOne("reward_mapper.findRewardWeeklyStats", nickname);
	}

	@Override
	public List<RewardWalletCoupon> findRewardWallet(String nickname) {
		return sqlSessionTemplate.selectList("reward_mapper.findRewardWallet", nickname);
	}

	@Override
	public User findActiveUserByUserId(int userId) {
		return sqlSessionTemplate.selectOne("reward_mapper.findActiveUserByUserId", userId);
	}

	@Override
	public RewardShopItem findRewardShopItemById(long rewardItemId) {
		return sqlSessionTemplate.selectOne("reward_mapper.findRewardShopItemById", rewardItemId);
	}

	@Override
	public int deductUserPoint(int userId, int usedPoint) {
		Map<String, Object> params = Map.of(
			"userId", userId,
			"usedPoint", usedPoint
		);
		return sqlSessionTemplate.update("reward_mapper.deductUserPoint", params);
	}

	@Override
	public int decreaseRewardItemStock(long rewardItemId) {
		Map<String, Object> params = Map.of("rewardItemId", rewardItemId);
		return sqlSessionTemplate.update("reward_mapper.decreaseRewardItemStock", params);
	}

	@Override
	public int insertRewardExchange(Map<String, Object> params) {
		return sqlSessionTemplate.insert("reward_mapper.insertRewardExchange", params);
	}

	@Override
	public int insertPointHistory(Map<String, Object> params) {
		return sqlSessionTemplate.insert("reward_mapper.insertPointHistory", params);
	}

	@Override
	public int countUserRewardExchange(int userId) {
		Integer count = sqlSessionTemplate.selectOne("reward_mapper.countUserRewardExchange", userId);
		return count == null ? 0 : count.intValue();
	}

	@Override
	public int sumUserUsedPoint(int userId) {
		Integer sum = sqlSessionTemplate.selectOne("reward_mapper.sumUserUsedPoint", userId);
		return sum == null ? 0 : sum.intValue();
	}

	@Override
	public Integer findBadgeIdByName(String badgeName) {
		return sqlSessionTemplate.selectOne("reward_mapper.findBadgeIdByName", badgeName);
	}

	@Override
	public int insertBadge(RewardBadgeDTO badge) {
		return sqlSessionTemplate.insert("reward_mapper.insertBadge", badge);
	}

	@Override
	public int existsUserBadge(int userId, int badgeId) {
		Map<String, Object> params = Map.of(
			"userId", userId,
			"badgeId", badgeId
		);
		Integer count = sqlSessionTemplate.selectOne("reward_mapper.existsUserBadge", params);
		return count == null ? 0 : count.intValue();
	}

	@Override
	public int insertUserBadge(int userId, int badgeId) {
		Map<String, Object> params = Map.of(
			"userId", userId,
			"badgeId", badgeId
		);
		return sqlSessionTemplate.insert("reward_mapper.insertUserBadge", params);
	}

	@Override
	public RewardBadgeDTO findBadgeById(int badgeId) {
		return sqlSessionTemplate.selectOne("reward_mapper.findBadgeById", badgeId);
	}

	@Override
	public List<RewardBadgeDTO> findUserBadgesByNickname(String nickname) {
		return sqlSessionTemplate.selectList("reward_mapper.findUserBadgesByNickname", nickname);
	}

	@Override
	public RewardWalletCoupon findWalletCouponByExchangeId(long exchangeId) {
		return sqlSessionTemplate.selectOne("reward_mapper.findWalletCouponByExchangeId", exchangeId);
	}
}
