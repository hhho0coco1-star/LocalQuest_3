package com.app.service.questreview.impl;

import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.questreview.QuestReviewDAO;
import com.app.dto.questreview.QuestReviewDTO;
import com.app.dto.questreview.QuestReviewListItemDTO;
import com.app.dto.reward.RewardBadgeDTO;
import com.app.service.badge.BadgeOperationService;
import com.app.service.questreview.QuestReviewService;

@Service
public class QuestReviewServiceImpl implements QuestReviewService {

    @Autowired
    private QuestReviewDAO dao;

    @Autowired
    private BadgeOperationService badgeOperationService;

    @Override
    @Transactional
    public List<RewardBadgeDTO> saveQuestReview(QuestReviewDTO questReview) {
        int result = dao.saveQuestReview(questReview);

        if (result <= 0 || questReview == null || questReview.getUserId() <= 0) {
            return Collections.emptyList();
        }

        return badgeOperationService.evaluateAndGrantBadges(questReview.getUserId());
    }

    @Override
    public List<QuestReviewListItemDTO> getQuestReviewsByQuestId(int questId) {
        return dao.selectQuestReviewsByQuestId(questId);
    }

    @Override
    public List<QuestReviewListItemDTO> getQuestReviewsByUserId(int userId) {
        return dao.selectQuestReviewsByUserId(userId);
    }

    @Override
    @Transactional
    public int updateQuestReview(QuestReviewDTO questReview) {
        return dao.updateQuestReview(questReview);
    }

    @Override
    @Transactional
    public int updateQuestReviewAsAdmin(QuestReviewDTO questReview) {
        return dao.updateQuestReviewAsAdmin(questReview);
    }

    @Override
    @Transactional
    public int removeQuestReview(int reviewId, int questId, int userId) {
        return dao.deleteQuestReview(reviewId, questId, userId);
    }

    @Override
    @Transactional
    public int removeQuestReviewAsAdmin(int reviewId, int questId) {
        return dao.deleteQuestReviewAsAdmin(reviewId, questId);
    }
}
