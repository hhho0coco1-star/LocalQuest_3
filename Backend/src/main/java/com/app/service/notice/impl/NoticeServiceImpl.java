package com.app.service.notice.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.notice.NoticeDAO;
import com.app.dto.notice.NoticeDTO;
import com.app.service.notice.NoticeService;

@Service
public class NoticeServiceImpl implements NoticeService {

    @Autowired
    private NoticeDAO dao;

    @Override
    @Transactional
    public int saveNotice(NoticeDTO notice) {
        return dao.saveNotice(notice);
    }
}
