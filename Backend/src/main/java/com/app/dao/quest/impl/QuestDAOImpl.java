package com.app.dao.quest.impl;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Locale;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.quest.QuestDAO;
import com.app.dto.quest.QuestDTO;
import com.app.dto.quest.QuestMapDTO;
import com.app.dto.quest.QuestLocationInfoDTO;
import com.app.dto.quest.QuestTopRatedDTO;

@Repository
public class QuestDAOImpl implements QuestDAO {

    @Autowired
    SqlSessionTemplate sqlSessionTemplate;

    private static final String NAMESPACE = "quest_mapper";

    @Override
    public List<QuestDTO> selectAdminAllQuests() {
        return sqlSessionTemplate.selectList(NAMESPACE + ".selectAdminAllQuests");
    }

    @Override
    public List<QuestDTO> selectAllQuests() {
        try {
            return sqlSessionTemplate.selectList(NAMESPACE + ".selectAllQuests");
        } catch (Exception e) {
            if (isQuestReviewStatsUnavailable(e)) {
                return sqlSessionTemplate.selectList(NAMESPACE + ".selectAllQuestsBasic");
            }
            throw e;
        }
    }

    @Override
    public List<String> selectQuestCategories() {
        return sqlSessionTemplate.selectList(NAMESPACE + ".selectQuestCategories");
    }

    @Override
    public List<QuestMapDTO> selectQuestMapList() {
        return sqlSessionTemplate.selectList(NAMESPACE + ".selectQuestMapList");
    }

    @Override
    public List<QuestTopRatedDTO> selectTopRatedQuests(int limit) {
        return sqlSessionTemplate.selectList(NAMESPACE + ".selectTopRatedQuests", limit);
    }

    @Override
    public QuestDTO selectQuestById(int questId) {
        try {
            return sqlSessionTemplate.selectOne(NAMESPACE + ".selectQuestById", questId);
        } catch (Exception e) {
            if (isQuestReviewStatsUnavailable(e)) {
                return sqlSessionTemplate.selectOne(NAMESPACE + ".selectQuestByIdBasic", questId);
            }
            throw e;
        }
    }

    @Override
    public List<QuestLocationInfoDTO> selectQuestLocationsByQuestId(int questId) {
        try {
            return sqlSessionTemplate.selectList(NAMESPACE + ".selectQuestLocationsByQuestId", questId);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    @Override
    public int insertQuest(QuestDTO quest) {
        return sqlSessionTemplate.insert(NAMESPACE + ".insertQuest", quest);
    }

    @Override
    public int updateQuest(QuestDTO quest) {
        return sqlSessionTemplate.update(NAMESPACE + ".updateQuest", quest);
    }

    @Override
    public int updateQuestStatus(Map<String, Object> params) {
        return sqlSessionTemplate.update(NAMESPACE + ".updateQuestStatus", params);
    }

    @Override
    public int updateExpiredQuestsToInactive() {
        return sqlSessionTemplate.update(NAMESPACE + ".updateExpiredQuestsToInactive");
    }

    @Override
    public int resetQuestTimerAndActivate(int questId) {
        return sqlSessionTemplate.update(NAMESPACE + ".resetQuestTimerAndActivate", questId);
    }
    
    @Override
    public List<QuestDTO> selectSearchQuests(Map<String, Object> params) {
        try {
            return sqlSessionTemplate.selectList(NAMESPACE + ".selectSearchQuests", params);
        } catch (Exception e) {
            if (isQuestReviewStatsUnavailable(e)) {
                return sqlSessionTemplate.selectList(NAMESPACE + ".selectSearchQuestsBasic", params);
            }
            throw e;
        }
    }

    private boolean isQuestReviewStatsUnavailable(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                String upperMessage = message.toUpperCase(Locale.ROOT);
                if (upperMessage.contains("LQ_QUEST_REVIEW")
                    || upperMessage.contains("ORA-00942")
                    || upperMessage.contains("ORA-00904")
                    || upperMessage.contains("AVERAGE_RATING")
                    || upperMessage.contains("REVIEW_COUNT")
                    || upperMessage.contains("RATING")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }

    private boolean isQuestLocationStorageUnavailable(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                String upperMessage = message.toUpperCase(Locale.ROOT);
                if (upperMessage.contains("LQ_QUEST_LOCATION")
                    || upperMessage.contains("LQ_LOCATION")
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
