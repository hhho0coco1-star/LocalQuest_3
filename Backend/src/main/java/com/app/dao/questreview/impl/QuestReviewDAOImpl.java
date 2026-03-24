package com.app.dao.questreview.impl;

import java.util.Collections;
import java.util.List;
import java.util.Locale;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.questreview.QuestReviewDAO;
import com.app.dto.questreview.QuestReviewDTO;
import com.app.dto.questreview.QuestReviewListItemDTO;

@Repository
public class QuestReviewDAOImpl implements QuestReviewDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int saveQuestReview(QuestReviewDTO questReview) {
        int result = sqlSessionTemplate.insert("questreview_mapper.saveQuestReview", questReview);
        return result;
    }

    @Override
    public List<QuestReviewListItemDTO> selectQuestReviewsByQuestId(int questId) {
        try {
            return sqlSessionTemplate.selectList("questreview_mapper.selectQuestReviewsByQuestId", questId);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    @Override
    public int updateQuestReview(QuestReviewDTO questReview) {
        return sqlSessionTemplate.update("questreview_mapper.updateQuestReview", questReview);
    }

    @Override
    public int updateQuestReviewAsAdmin(QuestReviewDTO questReview) {
        return sqlSessionTemplate.update("questreview_mapper.updateQuestReviewAsAdmin", questReview);
    }

    @Override
    public int deleteQuestReview(int reviewId, int questId, int userId) {
        QuestReviewDTO questReview = new QuestReviewDTO();
        questReview.setReviewId(reviewId);
        questReview.setQuestId(questId);
        questReview.setUserId(userId);
        return sqlSessionTemplate.delete("questreview_mapper.deleteQuestReview", questReview);
    }

    @Override
    public int deleteQuestReviewAsAdmin(int reviewId, int questId) {
        QuestReviewDTO questReview = new QuestReviewDTO();
        questReview.setReviewId(reviewId);
        questReview.setQuestId(questId);
        return sqlSessionTemplate.delete("questreview_mapper.deleteQuestReviewAsAdmin", questReview);
    }

    private boolean isQuestReviewStorageUnavailable(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                String upperMessage = message.toUpperCase(Locale.ROOT);
                if (upperMessage.contains("LQ_QUEST_REVIEW")
                    || upperMessage.contains("ORA-00942")
                    || upperMessage.contains("TABLE OR VIEW DOES NOT EXIST")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }
}
