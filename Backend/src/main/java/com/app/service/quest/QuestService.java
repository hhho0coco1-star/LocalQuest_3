package com.app.service.quest;

import java.util.List;
import java.util.Map;

import com.app.dto.quest.QuestDTO;
import com.app.dto.quest.QuestDetailDTO;
import com.app.dto.quest.QuestMapDTO;
import com.app.dto.quest.QuestLocationInfoDTO;

public interface QuestService {
    List<QuestDTO> getAdminQuestList();

    List<QuestDTO> getAllQuests();

    List<String> getQuestCategories();

    List<QuestMapDTO> getQuestMapList();

    QuestDTO getQuestById(int questId);

    QuestDetailDTO getQuestDetailById(int questId);

    boolean registerQuest(QuestDTO quest, List<QuestLocationInfoDTO> locations);
    
    // 퀘스트 수정하기
    public boolean updateQuest(QuestDTO quest, List<QuestLocationInfoDTO> locations);
    
    // 퀘스트 상태 변경하기 (활성화/비활성화/삭제)
    boolean changeQuestStatus(int questId, String status);

    void expireTimedOutQuests();
    
    // 퀘스트 검색/필터
    public List<QuestDTO> getSearchQuests(Map<String, Object> params);
}
