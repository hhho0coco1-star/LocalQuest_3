package com.app.dto.business;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class BusinessDTO {
    private int businessId;
    private int userId;
    private String businessName;
    private String zipCode;
    private String address;
    private String addressDetail;
    private String phone;
    private String description;
    private LocalDateTime createdAt;
}
