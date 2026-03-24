package com.app.dao.reward.impl;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.reward.RewardDAO;
import com.app.dto.reward.RewardBoxSummary;
import com.app.dto.reward.RewardRoadmapItem;
import com.app.dto.reward.RewardShopItem;
import com.app.dto.reward.RewardWeeklyStats;
import com.app.dto.reward.RewardWalletCoupon;

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
}
