package com.app.controller.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.reward.RewardBoxSummary;
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
}
