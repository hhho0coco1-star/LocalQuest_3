package com.app.dao.userquestprogress.impl;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.userquestprogress.UserQuestProgressDAO;
import com.app.dto.userquestprogress.UserQuestProgressDTO;

@Repository
public class UserQuestProgressDAOImpl implements UserQuestProgressDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int saveUserQuestProgress(UserQuestProgressDTO userQuestProgress) {
        int result = sqlSessionTemplate.insert("userquestprogress_mapper.saveUserQuestProgress", userQuestProgress);
        return result;
    }

    @Override
    public int initializeProgressByQuestId(int userQuestId, int questId) {
        Map<String, Object> params = new HashMap<>();
        params.put("userQuestId", userQuestId);
        params.put("questId", questId);
        return sqlSessionTemplate.insert("userquestprogress_mapper.initializeProgressByQuestId", params);
    }

    @Override
    public int upsertCompletedProgress(int userQuestId, int questLocationId, Date completedAt) {
        Map<String, Object> params = new HashMap<>();
        params.put("userQuestId", userQuestId);
        params.put("questLocationId", questLocationId);
        params.put("completedAt", completedAt);
        return sqlSessionTemplate.update("userquestprogress_mapper.upsertCompletedProgress", params);
    }

    @Override
    public int deleteProgressByUserQuestId(int userQuestId) {
        return sqlSessionTemplate.delete("userquestprogress_mapper.deleteProgressByUserQuestId", userQuestId);
    }

    @Override
    public int deleteUserQuestProgressByUserQuestId(int userQuestId) {
        return sqlSessionTemplate.delete("userquestprogress_mapper.deleteUserQuestProgressByUserQuestId", userQuestId);
    }
}
