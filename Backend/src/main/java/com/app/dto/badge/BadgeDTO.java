package com.app.dto.badge;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class BadgeDTO {
    private int badgeId;
    private String name;
    private String description;
    private String conditionText;
    private String iconUrl;
    private String badgeCategory;
    private String badgeDifficulty;
    private String triggerType;
    private Integer displayOrder;
    private String isActive;
    private LocalDateTime createdAt;
}
