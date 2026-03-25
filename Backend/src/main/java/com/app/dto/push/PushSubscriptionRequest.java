package com.app.dto.push;

import lombok.Data;

@Data
public class PushSubscriptionRequest {
    private String endpoint;
    private String p256dhKey;
    private String authKey;
    private String deviceType;
    private String browserName;
    private String userAgent;
}
