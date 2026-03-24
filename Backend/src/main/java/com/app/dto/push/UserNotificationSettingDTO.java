package com.app.dto.push;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class UserNotificationSettingDTO {
    private Long settingId;
    private Integer userId;
    private String pushAgree;
    private String marketingAgree;
    private String lunchPushAgree;
    private String dinnerPushAgree;
    private String weekendPushAgree;
    private String preferredTimezone;
    private LocalDateTime updatedAt;
    private LocalDateTime createdAt;
}
