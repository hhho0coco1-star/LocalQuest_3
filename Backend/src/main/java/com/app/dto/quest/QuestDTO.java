package com.app.dto.quest;

import java.util.Date;

import lombok.Data;

@Data
public class QuestDTO {

	private int questId;         // QUEST_ID
    private String title;        // TITLE
    private String description;  // DESCRIPTION
    private String category;     // CATEGORY
    private int rewardExp;       // REWARD_EXP
    private int rewardPoint;     // REWARD_POINT
    private Integer timeLimit;   // TIME_LIMIT
    private String status;       // STATUS (ACTIVE, INACTIVE, DELETED)
    private Date createdAt;      // CREATED_AT
    
}
