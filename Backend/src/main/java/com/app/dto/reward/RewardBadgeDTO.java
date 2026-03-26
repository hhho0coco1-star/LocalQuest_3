package com.app.dto.reward;

import java.util.Date;

import lombok.Data;

@Data
public class RewardBadgeDTO {

	private Long badgeId;
	private String name;
	private String description;
	private String conditionText;
	private String iconUrl;
	private Date earnedAt;
}
