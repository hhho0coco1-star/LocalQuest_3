package com.app.dto.userquest;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class UserQuestDTO {
    private int userQuestId;
    private int userId;
    private int questId;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
}
