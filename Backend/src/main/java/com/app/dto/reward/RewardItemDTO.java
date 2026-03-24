package com.app.dto.reward;

import java.util.Date;

import lombok.Data;

@Data
public class RewardItemDTO {

	private int rewardItemId;
    private String name;
    private String description;
    private int pricePoint;
    private int stock;
    private String status; // 'ON_SALE', 'SOLD_OUT', 'HIDDEN'
    private Date createdAt;
    
}
