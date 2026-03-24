package com.app.dto.reward;

import java.util.Date;

import lombok.Data;

@Data
public class RewardWalletCoupon {

	private Long exchangeId;
	private String name;
	private String store;
	private String expire;
	private Boolean urgent;
	private String status;
	private Date expiredAt;
	private Integer daysLeft;
}
