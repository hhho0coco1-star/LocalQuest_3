package com.app.service.badge.impl;

import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.dao.badge.BadgeReadDAO;
import com.app.dto.reward.RewardBadgeDTO;
import com.app.service.badge.BadgeReadService;

@Service
public class BadgeReadServiceImpl implements BadgeReadService {

	@Autowired
	private BadgeReadDAO badgeReadDAO;

	@Override
	public List<RewardBadgeDTO> getBadgeCatalog() {
		List<RewardBadgeDTO> rows = badgeReadDAO.findBadgeCatalog();
		return rows == null ? Collections.emptyList() : rows;
	}

	@Override
	public List<RewardBadgeDTO> getUserBadges(String nickname) {
		if (nickname == null || nickname.trim().isEmpty()) {
			return Collections.emptyList();
		}

		List<RewardBadgeDTO> rows = badgeReadDAO.findUserBadgesByNickname(nickname.trim());
		return rows == null ? Collections.emptyList() : rows;
	}
}
