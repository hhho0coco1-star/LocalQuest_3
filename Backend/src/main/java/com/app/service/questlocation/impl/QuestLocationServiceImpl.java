package com.app.service.questlocation.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.questlocation.QuestLocationDAO;
import com.app.dto.questlocation.QuestLocationDTO;
import com.app.service.questlocation.QuestLocationService;

@Service
public class QuestLocationServiceImpl implements QuestLocationService {

    @Autowired
    private QuestLocationDAO dao;

    @Override
    @Transactional
    public int saveQuestLocation(QuestLocationDTO questLocation) {
        return dao.saveQuestLocation(questLocation);
    }
}
