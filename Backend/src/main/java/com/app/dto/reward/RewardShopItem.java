package com.app.dto.reward;

import java.util.Date;

import lombok.Data;

@Data
public class RewardShopItem {

	private Long rewardItemId;
	private String name;
	private String description;
	private Integer pricePoint;
	private Integer stock;
	private String status;
	private String couponScope;
	private String storeName;
	private String storeAddress;
	private Date createdAt;
}
