package com.app.service.userbadge.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.userbadge.UserBadgeDAO;
import com.app.dto.userbadge.UserBadgeDTO;
import com.app.service.userbadge.UserBadgeService;

@Service
public class UserBadgeServiceImpl implements UserBadgeService {

    @Autowired
    private UserBadgeDAO dao;

    @Override
    @Transactional
    public int saveUserBadge(UserBadgeDTO userBadge) {
        return dao.saveUserBadge(userBadge);
    }
}
