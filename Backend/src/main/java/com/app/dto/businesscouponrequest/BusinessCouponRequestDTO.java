package com.app.dto.businesscouponrequest;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class BusinessCouponRequestDTO {

    private Long requestId;
    private Integer businessId;
    private Integer locationId;
    private Integer adminUserId;

    private String couponName;
    private String couponDescription;
    private Integer pricePoint;
    private Integer stock;
    private String targetStatus;

    private String requestStatus;
    private Integer requestVersion;
    private String lastHoldReason;
    private Long approvedRewardItemId;

    private LocalDateTime requestedAt;
    private LocalDateTime respondedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Integer businessUserId;
    private String businessName;
    private String locationName;
    private String locationAddress;
    private String adminNickname;
}
