package com.app.dto.pointhistory;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class PointHistoryDTO {
    private int pointHistoryId;
    private int userId;
    private int pointAmount;
    private String category;
    private String description;
    private LocalDateTime createdAt;
}
