package com.app.dto.push;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class PushSubscriptionDTO {
    private Long subscriptionId;
    private Integer userId;
    private String endpoint;
    private String p256dhKey;
    private String authKey;
    private String deviceType;
    private String browserName;
    private String userAgent;
    private String isActive;
    private LocalDateTime lastSuccessAt;
    private LocalDateTime lastFailAt;
    private Integer failCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
