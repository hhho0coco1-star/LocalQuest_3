package com.app.service.badge.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.badge.BadgeDAO;
import com.app.dto.badge.BadgeDTO;
import com.app.service.badge.BadgeService;

@Service
public class BadgeServiceImpl implements BadgeService {

    @Autowired
    private BadgeDAO dao;

    @Override
    @Transactional
    public int saveBadge(BadgeDTO badge) {
        return dao.saveBadge(badge);
    }
}
