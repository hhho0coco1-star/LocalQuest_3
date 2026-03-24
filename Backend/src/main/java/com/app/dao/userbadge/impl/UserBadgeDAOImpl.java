package com.app.dao.userbadge.impl;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.userbadge.UserBadgeDAO;
import com.app.dto.userbadge.UserBadgeDTO;

@Repository
public class UserBadgeDAOImpl implements UserBadgeDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int saveUserBadge(UserBadgeDTO userBadge) {
        int result = sqlSessionTemplate.insert("userbadge_mapper.saveUserBadge", userBadge);
        return result;
    }
}
