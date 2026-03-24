package com.app.dto.push;

import lombok.Data;

@Data
public class PushSettingRequest {
    private Boolean pushAgree;
    private Boolean marketingAgree;
    private Boolean lunchPushAgree;
    private Boolean dinnerPushAgree;
    private Boolean weekendPushAgree;
    private String preferredTimezone;
}
