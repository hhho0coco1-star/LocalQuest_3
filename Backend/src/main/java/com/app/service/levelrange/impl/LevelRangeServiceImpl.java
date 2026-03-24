package com.app.service.levelrange.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.levelrange.LevelRangeDAO;
import com.app.dto.levelrange.LevelRangeDTO;
import com.app.service.levelrange.LevelRangeService;

@Service
public class LevelRangeServiceImpl implements LevelRangeService {

    @Autowired
    private LevelRangeDAO dao;

    @Override
    @Transactional
    public int saveLevelRange(LevelRangeDTO levelRange) {
        return dao.saveLevelRange(levelRange);
    }
}
