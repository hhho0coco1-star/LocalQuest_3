package com.app.dto.reward;

import java.util.List;

import lombok.Data;

@Data
public class RewardExchangeResultDTO {

	private Long exchangeId;
	private Long rewardItemId;
	private String itemName;
	private Integer usedPoint;
	private Integer remainingPoint;
	private Integer updatedStock;
	private String itemStatus;
	private RewardWalletCoupon walletCoupon;
	private List<RewardBadgeDTO> newlyAwardedBadges;
}
