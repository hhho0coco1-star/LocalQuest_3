package com.app.controller.api;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.auth.SessionAuthKeys;
import com.app.dto.badge.BadgeMetricsDTO;
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

	@GetMapping("/me")
	public ResponseEntity<?> getMyBadgeDashboard(HttpSession session) {
		Integer loginUserId = resolveLoginUserId(session);
		if (loginUserId == null || loginUserId <= 0) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(messageBody("로그인한 사용자만 배지 정보를 조회할 수 있습니다."));
		}

		badgeOperationService.evaluateAndGrantBadges(loginUserId);

		List<RewardBadgeDTO> catalog = badgeReadService.getBadgeCatalog();
		List<RewardBadgeDTO> earnedBadges = badgeReadService.getUserBadgesByUserId(loginUserId);
		BadgeMetricsDTO metrics = badgeOperationService.getBadgeMetrics(loginUserId);

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("catalog", catalog);
		response.put("earnedBadges", earnedBadges);
		response.put("metrics", metrics);

		return ResponseEntity.ok(response);
	}

	private Integer resolveLoginUserId(HttpSession session) {
		if (session == null) {
			return null;
		}

		Object sessionUserId = session.getAttribute(SessionAuthKeys.USER_ID);
		if (sessionUserId instanceof Number) {
			return ((Number) sessionUserId).intValue();
		}

		if (sessionUserId instanceof String) {
			try {
				return Integer.parseInt(((String) sessionUserId).trim());
			} catch (NumberFormatException e) {
				return null;
			}
		}

		return null;
	}

	private Map<String, String> messageBody(String message) {
		Map<String, String> response = new LinkedHashMap<>();
		response.put("message", message);
		return response;
	}
}
