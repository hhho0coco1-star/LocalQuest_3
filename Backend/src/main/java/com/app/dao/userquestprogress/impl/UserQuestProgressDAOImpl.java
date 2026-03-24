package com.app.dao.userquestprogress.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dto.locationqr.UserQuestQrVerificationTargetDTO;
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

    @Override
    public List<UserQuestQrVerificationTargetDTO> findQrVerificationTargets(int userId, int locationId) {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("locationId", locationId);
        return sqlSessionTemplate.selectList("userquestprogress_mapper.findQrVerificationTargets", params);
    }

    @Override
    public int completeUserQuestProgress(UserQuestProgressDTO userQuestProgress) {
        return sqlSessionTemplate.update("userquestprogress_mapper.completeUserQuestProgress", userQuestProgress);
    }

    @Override
    public int countIncompleteProgressByUserQuestId(int userQuestId) {
        Integer count = sqlSessionTemplate.selectOne("userquestprogress_mapper.countIncompleteProgressByUserQuestId", userQuestId);
        return count == null ? 0 : count;
    }
}
