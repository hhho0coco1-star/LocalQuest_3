package com.app.dto.userquest;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class UserQuestSummaryDTO {
    private Integer userQuestId;
    private Integer userId;
    private Integer questId;
    private boolean accepted;
    private String questStatus;
    private LocalDateTime startedAt;
    private LocalDateTime dueAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;

    private String title;
    private String description;
    private String category;
    private Integer rewardExp;
    private Integer rewardPoint;
    private Integer timeLimit;

    private Integer totalLocationCount;
    private Integer completedLocationCount;
    private Integer progressPercent;

    private String status;
    private boolean expired;
    private Long remainingSeconds;
}
