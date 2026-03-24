package com.app.dao.userquest.impl;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.userquest.UserQuestDAO;
import com.app.dto.userquest.UserQuestDTO;
import com.app.dto.userquest.UserQuestSummaryDTO;

@Repository
public class UserQuestDAOImpl implements UserQuestDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int saveUserQuest(UserQuestDTO userQuest) {
        int result = sqlSessionTemplate.insert("userquest_mapper.saveUserQuest", userQuest);
        return result;
    }

    @Override
    public UserQuestDTO findUserQuestByUserIdAndQuestId(UserQuestDTO userQuest) {
        return sqlSessionTemplate.selectOne("userquest_mapper.findUserQuestByUserIdAndQuestId", userQuest);
    }

    @Override
    public int updateUserQuestForAccept(UserQuestDTO userQuest) {
        return sqlSessionTemplate.update("userquest_mapper.updateUserQuestForAccept", userQuest);
    }

    @Override
    public int completeUserQuest(UserQuestDTO userQuest) {
        return sqlSessionTemplate.update("userquest_mapper.completeUserQuest", userQuest);
    }

    @Override
    public List<UserQuestSummaryDTO> findUserQuestSummariesByUserId(int userId) {
        return sqlSessionTemplate.selectList("userquest_mapper.findUserQuestSummariesByUserId", userId);
    }
}
