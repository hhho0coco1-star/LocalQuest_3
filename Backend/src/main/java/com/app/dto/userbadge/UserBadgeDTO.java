package com.app.dto.userbadge;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class UserBadgeDTO {
    private int userBadgeId;
    private int userId;
    private int badgeId;
    private LocalDateTime earnedAt;
}
