package com.app.dto.businesscouponrequest;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class BusinessCouponRequestHistoryDTO {

    private Long historyId;
    private Long requestId;
    private String actionType;
    private String actionRole;
    private Integer actionByUserId;

    private Integer requestVersion;
    private String commentText;

    private String snapshotCouponName;
    private String snapshotCouponDesc;
    private Integer snapshotPricePoint;
    private Integer snapshotStock;
    private String snapshotTargetStatus;

    private LocalDateTime createdAt;
    private String actionByNickname;
}
