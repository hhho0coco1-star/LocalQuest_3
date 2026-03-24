package com.app.dto.locationqr;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class UserQuestQrVerificationTargetDTO {
    private Integer userQuestProgressId;
    private Integer userQuestId;
    private Integer questId;
    private String questTitle;
    private String userQuestStatus;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Integer timeLimit;
    private Integer questLocationId;
    private Integer locationId;
    private Integer visitOrder;
    private String locationName;
    private Integer isCompleted;
    private LocalDateTime progressCompletedAt;
    private Integer totalCount;
    private Integer completedCount;
}
