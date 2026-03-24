package com.app.dto.userquest;

import java.util.Date;

import lombok.Data;

@Data
public class UserQuestSummaryDTO {
    private int userQuestId;
    private int userId;
    private int questId;
    private String questStatus;
    private Date startedAt;
    private Date completedAt;
    private Date createdAt;

    private String title;
    private String description;
    private String category;
    private int rewardExp;
    private int rewardPoint;
    private Integer timeLimit;

    private int totalLocationCount;
    private int completedLocationCount;
    private int progressPercent;
}
