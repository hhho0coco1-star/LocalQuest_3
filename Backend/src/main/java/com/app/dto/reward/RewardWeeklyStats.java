package com.app.dto.reward;

import lombok.Data;

@Data
public class RewardWeeklyStats {

	private Integer questDone;
	private Integer gainXp;
	private Integer usedCoupon;
	private Integer topPercent;
	private Integer weeklyProgress;
}
