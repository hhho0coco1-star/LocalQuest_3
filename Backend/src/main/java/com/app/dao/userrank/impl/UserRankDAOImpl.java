package com.app.dao.userrank.impl;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.userrank.UserRankDAO;
import com.app.dto.userrank.UserRankDTO;

@Repository
public class UserRankDAOImpl implements UserRankDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int saveUserRank(UserRankDTO userRank) {
        int result = sqlSessionTemplate.insert("userrank_mapper.saveUserRank", userRank);
        return result;
    }
}
