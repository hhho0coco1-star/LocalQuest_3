package com.app.dao.pointhistory.impl;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.pointhistory.PointHistoryDAO;
import com.app.dto.pointhistory.PointHistoryDTO;

@Repository
public class PointHistoryDAOImpl implements PointHistoryDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int savePointHistory(PointHistoryDTO pointHistory) {
        int result = sqlSessionTemplate.insert("pointhistory_mapper.savePointHistory", pointHistory);
        return result;
    }
}
