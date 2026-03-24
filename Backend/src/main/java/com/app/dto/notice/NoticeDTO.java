package com.app.dto.notice;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class NoticeDTO {
    private int noticeId;
    private String title;
    private String content;
    private int viewCount;
    private int isPinned;
    private LocalDateTime createdAt;
}
