package com.app.dao.userquest.impl;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.userquest.UserQuestDAO;
import com.app.dto.userquest.UserQuestDetailDTO;
import com.app.dto.userquest.UserQuestDetailLocationDTO;
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
    public List<UserQuestSummaryDTO> findUserQuestSummariesByUserId(int userId) {
        return sqlSessionTemplate.selectList("userquest_mapper.findUserQuestSummariesByUserId", userId);
    }

    @Override
    public UserQuestDetailDTO findUserQuestDetailByUserQuestId(int userQuestId) {
        return sqlSessionTemplate.selectOne("userquest_mapper.findUserQuestDetailByUserQuestId", userQuestId);
    }

    @Override
    public List<UserQuestDetailLocationDTO> findUserQuestDetailLocationsByUserQuestId(int userQuestId) {
        return sqlSessionTemplate.selectList(
            "userquest_mapper.findUserQuestDetailLocationsByUserQuestId",
            userQuestId
        );
    }

    @Override
    public int countTotalLocationsByUserQuestId(int userQuestId) {
        Integer count = sqlSessionTemplate.selectOne(
            "userquest_mapper.countTotalLocationsByUserQuestId",
            userQuestId
        );
        return count == null ? 0 : count;
    }

    @Override
    public int countCompletedLocationsByUserQuestId(int userQuestId) {
        Integer count = sqlSessionTemplate.selectOne(
            "userquest_mapper.countCompletedLocationsByUserQuestId",
            userQuestId
        );
        return count == null ? 0 : count;
    }

    @Override
    public int updateUserQuestStatusAndCompletedAt(int userQuestId, String status, Date completedAt) {
        Map<String, Object> params = new HashMap<>();
        params.put("userQuestId", userQuestId);
        params.put("status", status);
        params.put("completedAt", completedAt);
        return sqlSessionTemplate.update("userquest_mapper.updateUserQuestStatusAndCompletedAt", params);
    }
}
