package com.app.service.questreview;

import java.util.List;

import com.app.dto.questreview.QuestReviewDTO;
import com.app.dto.questreview.QuestReviewListItemDTO;

public interface QuestReviewService {
    public int saveQuestReview(QuestReviewDTO questReview);
    public List<QuestReviewListItemDTO> getQuestReviewsByQuestId(int questId);
    public int updateQuestReview(QuestReviewDTO questReview);
    public int updateQuestReviewAsAdmin(QuestReviewDTO questReview);
    public int removeQuestReview(int reviewId, int questId, int userId);
    public int removeQuestReviewAsAdmin(int reviewId, int questId);
}
