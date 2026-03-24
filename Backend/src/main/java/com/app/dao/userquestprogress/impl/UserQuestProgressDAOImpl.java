package com.app.dao.userquestprogress.impl;

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
    public int deleteUserQuestProgressByUserQuestId(int userQuestId) {
        return sqlSessionTemplate.delete("userquestprogress_mapper.deleteUserQuestProgressByUserQuestId", userQuestId);
    }
}
