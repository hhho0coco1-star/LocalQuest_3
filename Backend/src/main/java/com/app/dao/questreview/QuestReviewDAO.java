package com.app.dao.questreview;

import java.util.List;

import com.app.dto.questreview.QuestReviewDTO;
import com.app.dto.questreview.QuestReviewListItemDTO;

public interface QuestReviewDAO {
    public int saveQuestReview(QuestReviewDTO questReview);
    public List<QuestReviewListItemDTO> selectQuestReviewsByQuestId(int questId);
    public int updateQuestReview(QuestReviewDTO questReview);
    public int deleteQuestReview(int reviewId, int questId, int userId);
}
