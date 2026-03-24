package com.app.service.pointhistory.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.pointhistory.PointHistoryDAO;
import com.app.dto.pointhistory.PointHistoryDTO;
import com.app.service.pointhistory.PointHistoryService;

@Service
public class PointHistoryServiceImpl implements PointHistoryService {

    @Autowired
    private PointHistoryDAO dao;

    @Override
    @Transactional
    public int savePointHistory(PointHistoryDTO pointHistory) {
        return dao.savePointHistory(pointHistory);
    }
}
