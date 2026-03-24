package com.app.service.graderange.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.graderange.GradeRangeDAO;
import com.app.dto.graderange.GradeRangeDTO;
import com.app.service.graderange.GradeRangeService;

@Service
public class GradeRangeServiceImpl implements GradeRangeService {

    @Autowired
    private GradeRangeDAO dao;

    @Override
    @Transactional
    public int saveGradeRange(GradeRangeDTO gradeRange) {
        return dao.saveGradeRange(gradeRange);
    }
}
