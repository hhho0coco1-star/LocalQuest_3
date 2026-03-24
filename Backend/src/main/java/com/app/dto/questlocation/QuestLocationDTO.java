package com.app.dto.questlocation;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class QuestLocationDTO {
    private int questLocationId;
    private int questId;
    private int locationId;
    private int visitOrder;
    private LocalDateTime createdAt;
}
