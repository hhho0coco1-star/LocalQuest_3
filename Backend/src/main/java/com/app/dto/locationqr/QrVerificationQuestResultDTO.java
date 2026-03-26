package com.app.dto.locationqr;

import lombok.Data;

@Data
public class QrVerificationQuestResultDTO {
    private Integer userQuestId;
    private Integer questId;
    private String questTitle;
    private Integer locationId;
    private String locationName;
    private Integer visitOrder;
    private String status;
    private boolean verified;
    private boolean alreadyCompleted;
    private boolean expired;
    private boolean questCompleted;
    private Integer totalCount;
    private Integer completedCount;
    private Integer remainingCount;
    private String message;
}
