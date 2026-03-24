package com.app.dao.graderange.impl;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.graderange.GradeRangeDAO;
import com.app.dto.graderange.GradeRangeDTO;

@Repository
public class GradeRangeDAOImpl implements GradeRangeDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int saveGradeRange(GradeRangeDTO gradeRange) {
        int result = sqlSessionTemplate.insert("graderange_mapper.saveGradeRange", gradeRange);
        return result;
    }
}
