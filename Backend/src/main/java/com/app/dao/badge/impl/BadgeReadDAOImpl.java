package com.app.dao.badge.impl;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.badge.BadgeReadDAO;
import com.app.dto.reward.RewardBadgeDTO;

@Repository
public class BadgeReadDAOImpl implements BadgeReadDAO {

	@Autowired
	private SqlSessionTemplate sqlSessionTemplate;

	@Override
	public List<RewardBadgeDTO> findBadgeCatalog() {
		return sqlSessionTemplate.selectList("badge_read_mapper.findBadgeCatalog");
	}

	@Override
	public List<RewardBadgeDTO> findUserBadgesByNickname(String nickname) {
		return sqlSessionTemplate.selectList("badge_read_mapper.findUserBadgesByNickname", nickname);
	}
}
