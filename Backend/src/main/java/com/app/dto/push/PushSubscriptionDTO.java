package com.app.dto.push;

import java.util.Date;

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
    private Date lastSuccessAt;
    private Date lastFailAt;
    private Integer failCount;
    private Date createdAt;
    private Date updatedAt;
}