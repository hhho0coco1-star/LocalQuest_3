package com.app.dao.questlocation.impl;

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
        int result = sqlSessionTemplate.insert("questlocation_mapper.saveQuestLocation", questLocation);
        return result;
    }
}
