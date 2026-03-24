package com.app.dto.questreview;

import java.util.Date;

import lombok.Data;

@Data
public class QuestReviewListItemDTO {
    private int reviewId;
    private int userId;
    private int questId;
    private int rating;
    private String content;
    private Date createdAt;
    private String authorName;
}
