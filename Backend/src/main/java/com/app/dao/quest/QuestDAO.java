package com.app.dao.quest;

import java.util.List;
import java.util.Map;

import com.app.dto.quest.QuestDTO;
import com.app.dto.quest.QuestMapDTO;
import com.app.dto.quest.QuestLocationInfoDTO;

public interface QuestDAO {
    List<QuestDTO> selectAllQuests();

    List<QuestMapDTO> selectQuestMapList();

    QuestDTO selectQuestById(int questId);

    List<QuestLocationInfoDTO> selectQuestLocationsByQuestId(int questId);

    int insertQuest(QuestDTO quest);

    int updateQuest(QuestDTO quest);

    int updateQuestStatus(Map<String, Object> params);
    
    // 퀘스트 검색/필터
    public List<QuestDTO> selectSearchQuests(Map<String, Object> params);
    
}
