package com.app.dto.badge;

import lombok.Data;

@Data
public class BadgeMetricsDTO {
    private int completedQuestCount;
    private int distinctVisitedLocationCount;
    private int reviewCount;
    private int rewardExchangeCount;
    private int usedPointSum;
}
