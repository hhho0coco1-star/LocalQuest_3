package com.app.dao.badge.impl;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.badge.BadgeDAO;
import com.app.dto.badge.BadgeDTO;

@Repository
public class BadgeDAOImpl implements BadgeDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int saveBadge(BadgeDTO badge) {
        int result = sqlSessionTemplate.insert("badge_mapper.saveBadge", badge);
        return result;
    }
}
