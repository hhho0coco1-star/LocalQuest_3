package com.app.dao.levelrange.impl;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.levelrange.LevelRangeDAO;
import com.app.dto.levelrange.LevelRangeDTO;

@Repository
public class LevelRangeDAOImpl implements LevelRangeDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int saveLevelRange(LevelRangeDTO levelRange) {
        int result = sqlSessionTemplate.insert("levelrange_mapper.saveLevelRange", levelRange);
        return result;
    }
}
