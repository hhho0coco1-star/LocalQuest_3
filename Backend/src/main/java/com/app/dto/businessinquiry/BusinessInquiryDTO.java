package com.app.dto.businessinquiry;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class BusinessInquiryDTO {
    private int inquiryId;
    private int userId;
    private String title;
    private String content;
    private String status;
    private String zipCode;
    private String address;
    private String addressDetail;
    private String phone;
    private LocalDateTime createdAt;
}
