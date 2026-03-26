package com.app.controller.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.reward.RewardBadgeDTO;
import com.app.service.badge.BadgeOperationService;
import com.app.service.badge.BadgeReadService;

@RestController
@RequestMapping("/api/badges")
public class BadgeAPIController {

	@Autowired
	private BadgeReadService badgeReadService;

	@Autowired
	private BadgeOperationService badgeOperationService;

	@GetMapping("/catalog")
	public ResponseEntity<List<RewardBadgeDTO>> getBadgeCatalog() {
		return ResponseEntity.ok(badgeReadService.getBadgeCatalog());
	}

	@GetMapping("/user")
	public ResponseEntity<List<RewardBadgeDTO>> getUserBadges(
		@RequestParam(value = "nickname", required = false) String nickname
	) {
		badgeOperationService.evaluateAndGrantBadgesByNickname(nickname);
		return ResponseEntity.ok(badgeReadService.getUserBadges(nickname));
	}
}
