package com.app.service.userrank.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.userrank.UserRankDAO;
import com.app.dto.userrank.UserRankDTO;
import com.app.service.userrank.UserRankService;

@Service
public class UserRankServiceImpl implements UserRankService {

    @Autowired
    private UserRankDAO dao;

    @Override
    @Transactional
    public int saveUserRank(UserRankDTO userRank) {
        return dao.saveUserRank(userRank);
    }
}
