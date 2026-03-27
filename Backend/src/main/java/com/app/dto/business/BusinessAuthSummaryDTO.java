package com.app.dto.business;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class BusinessAuthSummaryDTO {
    private int businessId;
    private Integer totalAuthCount;
    private Integer qrAuthCount;
    private Integer receiptAuthCount;
    private Long totalPaymentAmount;
    private Long totalSettlementAmount;
    private LocalDateTime lastAuthAt;
    private Integer uniqueUserCount;
    private Integer uniqueLocationCount;
}
