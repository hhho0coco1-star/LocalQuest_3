package com.app.dto.userquest;

import java.util.Date;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class UserQuestSummaryDTO {
    private int questId;
    private Integer userQuestId;
    private boolean accepted;
    private String questStatus;
    private String title;
    private String description;
    private String category;
    private Integer rewardExp;
    private Integer rewardPoint;
    private String status;
    private Integer timeLimit;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private boolean expired;
    private Long remainingSeconds;
}
