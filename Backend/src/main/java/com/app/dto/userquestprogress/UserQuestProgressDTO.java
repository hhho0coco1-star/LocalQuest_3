package com.app.dto.userquestprogress;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class UserQuestProgressDTO {
    private int userQuestProgressId;
    private int userQuestId;
    private int questLocationId;
    private int isCompleted;
    private LocalDateTime completedAt;
}
