package com.app.dto.push;

import lombok.Data;

@Data
public class PushTestNotificationRequest {
    private String notificationType;
    private String title;
    private String body;
    private String targetUrl;
}
