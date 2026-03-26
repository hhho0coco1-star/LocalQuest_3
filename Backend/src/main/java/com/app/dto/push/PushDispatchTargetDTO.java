package com.app.dto.push;

import lombok.Data;

@Data
public class PushDispatchTargetDTO {
    private Integer userId;
    private Long subscriptionId;
    private String endpoint;
    private String p256dhKey;
    private String authKey;
    private String preferredTimezone;
}
