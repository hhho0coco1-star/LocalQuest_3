package com.app.dto.push;

import java.util.Date;

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
    private Date updatedAt;
    private Date createdAt;
}