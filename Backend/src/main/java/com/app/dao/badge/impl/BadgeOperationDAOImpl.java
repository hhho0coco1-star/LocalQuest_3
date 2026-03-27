package com.app.dao.badge.impl;

import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.badge.BadgeOperationDAO;
import com.app.dto.reward.RewardBadgeDTO;
import com.app.dto.user.User;

@Repository
public class BadgeOperationDAOImpl implements BadgeOperationDAO {

	@Autowired
	private SqlSessionTemplate sqlSessionTemplate;

	@Override
	public User findActiveUserByUserId(int userId) {
		return sqlSessionTemplate.selectOne("badge_operation_mapper.findActiveUserByUserId", userId);
	}

	@Override
	public User findActiveUserByNickname(String nickname) {
		return sqlSessionTemplate.selectOne("badge_operation_mapper.findActiveUserByNickname", nickname);
	}

	@Override
	public int countCompletedQuestByUserId(int userId) {
		Integer count = sqlSessionTemplate.selectOne("badge_operation_mapper.countCompletedQuestByUserId", userId);
		return count == null ? 0 : count.intValue();
	}

	@Override
	public int countDistinctVisitedLocationByUserId(int userId) {
		Integer count = sqlSessionTemplate.selectOne("badge_operation_mapper.countDistinctVisitedLocationByUserId", userId);
		return count == null ? 0 : count.intValue();
	}

	@Override
	public int countReviewByUserId(int userId) {
		Integer count = sqlSessionTemplate.selectOne("badge_operation_mapper.countReviewByUserId", userId);
		return count == null ? 0 : count.intValue();
	}

	@Override
	public int countRewardExchangeByUserId(int userId) {
		Integer count = sqlSessionTemplate.selectOne("badge_operation_mapper.countRewardExchangeByUserId", userId);
		return count == null ? 0 : count.intValue();
	}

	@Override
	public int sumUsedPointByUserId(int userId) {
		Integer sum = sqlSessionTemplate.selectOne("badge_operation_mapper.sumUsedPointByUserId", userId);
		return sum == null ? 0 : sum.intValue();
	}

	@Override
	public Integer findBadgeIdByName(String badgeName) {
		return sqlSessionTemplate.selectOne("badge_operation_mapper.findBadgeIdByName", badgeName);
	}

	@Override
	public int insertBadge(RewardBadgeDTO badge) {
		return sqlSessionTemplate.insert("badge_operation_mapper.insertBadge", badge);
	}

	@Override
	public int existsUserBadge(Map<String, Object> params) {
		Integer count = sqlSessionTemplate.selectOne("badge_operation_mapper.existsUserBadge", params);
		return count == null ? 0 : count.intValue();
	}

	@Override
	public int insertUserBadge(Map<String, Object> params) {
		return sqlSessionTemplate.insert("badge_operation_mapper.insertUserBadge", params);
	}
}
