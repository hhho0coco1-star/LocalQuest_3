package com.app.dto.inquiry;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class InquiryDTO {
    private int inquiryId;
    private int userId;
    private String title;
    private String content;
    private String status;
    private String answerContent;
    private LocalDateTime answeredAt;
    private LocalDateTime createdAt;
}
