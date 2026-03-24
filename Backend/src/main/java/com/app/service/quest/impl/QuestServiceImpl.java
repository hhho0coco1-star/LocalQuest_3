package com.app.service.quest.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.dao.quest.QuestDAO;
import com.app.dto.quest.QuestDTO;
import com.app.dto.quest.QuestDetailDTO;
import com.app.dto.quest.QuestMapDTO;
import com.app.service.quest.QuestService;

@Service
public class QuestServiceImpl implements QuestService {

    @Autowired
    private QuestDAO questDAO;

    @Override
    public List<QuestDTO> getAllQuests() {
        return questDAO.selectAllQuests();
    }

    @Override
    public List<QuestMapDTO> getQuestMapList() {
        return questDAO.selectQuestMapList();
    }

    @Override
    public QuestDTO getQuestById(int questId) {
        return questDAO.selectQuestById(questId);
    }

    @Override
    public QuestDetailDTO getQuestDetailById(int questId) {
        QuestDTO quest = questDAO.selectQuestById(questId);
        if (quest == null) {
            return null;
        }

        QuestDetailDTO questDetail = new QuestDetailDTO();
        questDetail.setQuestId(quest.getQuestId());
        questDetail.setTitle(quest.getTitle());
        questDetail.setDescription(quest.getDescription());
        questDetail.setCategory(quest.getCategory());
        questDetail.setRewardExp(quest.getRewardExp());
        questDetail.setRewardPoint(quest.getRewardPoint());
        questDetail.setTimeLimit(quest.getTimeLimit());
        questDetail.setStatus(quest.getStatus());
        questDetail.setCreatedAt(quest.getCreatedAt());
        questDetail.setLocations(questDAO.selectQuestLocationsByQuestId(questId));

        return questDetail;
    }

    @Override
    public boolean registerQuest(QuestDTO quest) {
        return questDAO.insertQuest(quest) == 1;
    }

    @Override
    public boolean changeQuestStatus(int questId, String status) {
        Map<String, Object> params = new HashMap<>();
        params.put("questId", questId);
        params.put("status", status);
        return questDAO.updateQuestStatus(params) == 1;
    }
    
    @Override
    public boolean updateQuest(QuestDTO quest) {
        return questDAO.updateQuest(quest) > 0;
    }
    
    @Override
    public List<QuestDTO> getSearchQuests(Map<String, Object> params) {
        return questDAO.selectSearchQuests(params);
    }
}
