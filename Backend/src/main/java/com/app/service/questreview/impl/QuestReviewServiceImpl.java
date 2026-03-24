package com.app.service.questreview.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.questreview.QuestReviewDAO;
import com.app.dto.questreview.QuestReviewDTO;
import com.app.dto.questreview.QuestReviewListItemDTO;
import com.app.service.questreview.QuestReviewService;

@Service
public class QuestReviewServiceImpl implements QuestReviewService {

    @Autowired
    private QuestReviewDAO dao;

    @Override
    @Transactional
    public int saveQuestReview(QuestReviewDTO questReview) {
        return dao.saveQuestReview(questReview);
    }

    @Override
    public List<QuestReviewListItemDTO> getQuestReviewsByQuestId(int questId) {
        return dao.selectQuestReviewsByQuestId(questId);
    }

    @Override
    @Transactional
    public int updateQuestReview(QuestReviewDTO questReview) {
        return dao.updateQuestReview(questReview);
    }

    @Override
    @Transactional
    public int removeQuestReview(int reviewId, int questId, int userId) {
        return dao.deleteQuestReview(reviewId, questId, userId);
    }
}
