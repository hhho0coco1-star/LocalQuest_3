package com.app.service.userquestprogress.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.userquestprogress.UserQuestProgressDAO;
import com.app.dto.userquestprogress.UserQuestProgressDTO;
import com.app.service.userquestprogress.UserQuestProgressService;

@Service
public class UserQuestProgressServiceImpl implements UserQuestProgressService {

    @Autowired
    private UserQuestProgressDAO dao;

    @Override
    @Transactional
    public int saveUserQuestProgress(UserQuestProgressDTO userQuestProgress) {
        return dao.saveUserQuestProgress(userQuestProgress);
    }
}
