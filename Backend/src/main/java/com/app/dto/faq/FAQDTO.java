package com.app.dto.faq;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class FAQDTO {
    private int faqId;
    private String category;
    private String question;
    private String answer;
    private int viewCount;
    private LocalDateTime createdAt;
}
