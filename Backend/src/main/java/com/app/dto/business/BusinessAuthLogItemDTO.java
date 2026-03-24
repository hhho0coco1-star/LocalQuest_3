package com.app.dto.business;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class BusinessAuthLogItemDTO {
    private int logId;
    private int businessId;
    private int locationId;
    private String locationName;
    private int userId;
    private String authType;
    private Long paymentAmount;
    private Long settlementAmount;
    private LocalDateTime createdAt;
}
