package com.app.dto.business;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class BusinessDashboardDTO {
    private long totalAuthCount;
    private long qrAuthCount;
    private long receiptAuthCount;
    private long todayAuthCount;
    private long todayQrAuthCount;
    private long todayCouponUseCount;
    private long totalPaymentAmount;
    private long totalSettlementAmount;
    private LocalDateTime lastAuthAt;
    private long authUserCount;
    private long authLocationCount;
    private List<BusinessHourlyAuthDTO> hourlyAuthCounts;
}
