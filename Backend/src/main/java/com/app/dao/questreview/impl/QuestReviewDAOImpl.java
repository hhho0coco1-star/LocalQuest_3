package com.app.dao.questreview.impl;

import java.util.List;

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
        return sqlSessionTemplate.selectList("questreview_mapper.selectQuestReviewsByQuestId", questId);
    }

    @Override
    public int updateQuestReview(QuestReviewDTO questReview) {
        return sqlSessionTemplate.update("questreview_mapper.updateQuestReview", questReview);
    }

    @Override
    public int deleteQuestReview(int reviewId, int questId, int userId) {
        QuestReviewDTO questReview = new QuestReviewDTO();
        questReview.setReviewId(reviewId);
        questReview.setQuestId(questId);
        questReview.setUserId(userId);
        return sqlSessionTemplate.delete("questreview_mapper.deleteQuestReview", questReview);
    }
}
