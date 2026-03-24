package com.app.dao.questlocation.impl;

import java.util.Locale;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.questlocation.QuestLocationDAO;
import com.app.dto.questlocation.QuestLocationDTO;

@Repository
public class QuestLocationDAOImpl implements QuestLocationDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int saveQuestLocation(QuestLocationDTO questLocation) {
        try {
            return sqlSessionTemplate.insert("questlocation_mapper.saveQuestLocation", questLocation);
        } catch (Exception e) {
            if (isQuestLocationSequenceUnavailable(e)) {
                return sqlSessionTemplate.insert("questlocation_mapper.saveQuestLocationWithoutSequence", questLocation);
            }
            throw e;
        }
    }

    @Override
    public int deleteQuestLocationsByQuestId(int questId) {
        return sqlSessionTemplate.delete("questlocation_mapper.deleteQuestLocationsByQuestId", questId);
    }

    private boolean isQuestLocationSequenceUnavailable(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                String upperMessage = message.toUpperCase(Locale.ROOT);
                if (upperMessage.contains("ORA-02289")
                    || upperMessage.contains("SEQ_LQ_QUEST_LOCATION_PK")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }
}
