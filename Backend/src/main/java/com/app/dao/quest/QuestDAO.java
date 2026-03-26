package com.app.dao.quest;

import java.util.List;
import java.util.Map;

import com.app.dto.quest.QuestDTO;
import com.app.dto.quest.QuestMapDTO;
import com.app.dto.quest.QuestLocationInfoDTO;
import com.app.dto.quest.QuestTopRatedDTO;

public interface QuestDAO {
    List<QuestDTO> selectAdminAllQuests();

    List<QuestDTO> selectAllQuests();

    List<QuestMapDTO> selectQuestMapList();

    List<QuestTopRatedDTO> selectTopRatedQuests(int limit);

    QuestDTO selectQuestById(int questId);

    List<QuestLocationInfoDTO> selectQuestLocationsByQuestId(int questId);

    int insertQuest(QuestDTO quest);

    int updateQuest(QuestDTO quest);

    int updateQuestStatus(Map<String, Object> params);

    int updateExpiredQuestsToInactive();

    int resetQuestTimerAndActivate(int questId);
    
    // 퀘스트 검색/필터
    public List<QuestDTO> selectSearchQuests(Map<String, Object> params);
    
}
