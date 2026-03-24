package com.app.dto.questreview;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class QuestReviewDTO {
    private int reviewId;
    private int userId;
    private int questId;
    private int rating;
    private String content;
    private LocalDateTime createdAt;
}
