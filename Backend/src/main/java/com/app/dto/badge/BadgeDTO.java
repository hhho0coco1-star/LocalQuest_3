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
    private LocalDateTime createdAt;
}
