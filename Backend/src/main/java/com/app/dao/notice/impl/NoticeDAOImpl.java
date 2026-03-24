package com.app.dao.notice.impl;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.notice.NoticeDAO;
import com.app.dto.notice.NoticeDTO;

@Repository
public class NoticeDAOImpl implements NoticeDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int saveNotice(NoticeDTO notice) {
        int result = sqlSessionTemplate.insert("notice_mapper.saveNotice", notice);
        return result;
    }
}
