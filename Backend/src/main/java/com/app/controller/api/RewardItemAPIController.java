package com.app.controller.api;

import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.reward.RewardBadgeDTO;
import com.app.dto.reward.RewardBoxSummary;
import com.app.dto.reward.RewardExchangeRequestDTO;
import com.app.dto.reward.RewardExchangeResultDTO;
import com.app.dto.reward.RewardShopItem;
import com.app.dto.reward.RewardWeeklyStats;
import com.app.dto.reward.RewardWalletCoupon;
import com.app.service.reward.RewardService;

@RestController
@RequestMapping("/api/rewards")
public class RewardItemAPIController {

	@Autowired
	private RewardService rewardService;

	@GetMapping("/summary")
	public ResponseEntity<RewardBoxSummary> getRewardBoxSummary(
		@RequestParam(value = "nickname", required = false) String nickname
	) {
		String normalizedNickname = nickname == null ? null : nickname.trim();
		RewardBoxSummary summary = rewardService.getRewardBoxSummary(normalizedNickname);

		if (summary == null) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(summary);
	}

	@GetMapping("/wallet")
	public ResponseEntity<List<RewardWalletCoupon>> getRewardWallet(
		@RequestParam(value = "nickname", required = false) String nickname
	) {
		String normalizedNickname = nickname == null ? null : nickname.trim();
		return ResponseEntity.ok(rewardService.getRewardWallet(normalizedNickname));
	}

	@GetMapping("/items")
	public ResponseEntity<List<RewardShopItem>> getRewardShopItems() {
		return ResponseEntity.ok(rewardService.getRewardShopItems());
	}

	@GetMapping("/weekly")
	public ResponseEntity<RewardWeeklyStats> getRewardWeeklyStats(
		@RequestParam(value = "nickname", required = false) String nickname
	) {
		String normalizedNickname = nickname == null ? null : nickname.trim();
		return ResponseEntity.ok(rewardService.getRewardWeeklyStats(normalizedNickname));
	}

	@GetMapping("/badges")
	public ResponseEntity<List<RewardBadgeDTO>> getRewardBadges(
		@RequestParam(value = "nickname", required = false) String nickname
	) {
		String normalizedNickname = nickname == null ? null : nickname.trim();
		return ResponseEntity.ok(rewardService.getRewardBadges(normalizedNickname));
	}

	@PostMapping("/exchange")
	public ResponseEntity<?> exchangeReward(@RequestBody RewardExchangeRequestDTO request) {
		if (request == null || request.getUserId() == null || request.getRewardItemId() == null) {
			return ResponseEntity.badRequest().body(Collections.singletonMap("message", "교환 요청 정보가 누락되었습니다."));
		}

		try {
			RewardExchangeResultDTO result = rewardService.exchangeReward(
				request.getUserId().intValue(),
				request.getRewardItemId().longValue()
			);
			return ResponseEntity.ok(result);
		} catch (NoSuchElementException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("message", e.getMessage()));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Collections.singletonMap("message", e.getMessage()));
		} catch (IllegalStateException e) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body(Collections.singletonMap("message", e.getMessage()));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(Collections.singletonMap("message", "리워드 교환 처리 중 오류가 발생했습니다."));
		}
	}
}
