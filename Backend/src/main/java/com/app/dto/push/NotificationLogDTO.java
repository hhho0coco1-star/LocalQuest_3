package com.app.dto.push;

import java.util.Date;

import lombok.Data;

@Data
public class NotificationLogDTO {
    private Long notificationId;
    private Integer userId;
    private Long subscriptionId;
    private String notificationType;
    private String title;
    private String body;
    private String targetUrl;
    private String sendStatus;
    private String failReason;
    private Date sentAt;
    private Date clickedAt;
    private Date createdAt;
}