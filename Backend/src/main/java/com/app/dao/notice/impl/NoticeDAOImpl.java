package com.app.dao.notice.impl;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.notice.NoticeDAO;
import com.app.dto.notice.NoticeDTO;

@Repository
public class NoticeDAOImpl implements NoticeDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

 // 1. 공지사항 등록
    @Override
    public int saveNotice(NoticeDTO notice) {
        return sqlSessionTemplate.insert("notice_mapper.saveNotice", notice);
    }

    // 2-1. 목록 조회
    @Override
    public List<NoticeDTO> getNoticeList() {
        return sqlSessionTemplate.selectList("notice_mapper.getNoticeList");
    }

    // 2-2. 상세 조회
    @Override
    public NoticeDTO getNoticeById(int noticeId) {
        return sqlSessionTemplate.selectOne("notice_mapper.getNoticeById", noticeId);
    }

    // 2-3. 조회수 증가
    @Override
    public void updateViewCount(int noticeId) {
        sqlSessionTemplate.update("notice_mapper.updateViewCount", noticeId);
    }

    // 3. 수정
    @Override
    public int updateNotice(NoticeDTO notice) {
        return sqlSessionTemplate.update("notice_mapper.updateNotice", notice);
    }

    // 4. 삭제
    @Override
    public int deleteNotice(int noticeId) {
        return sqlSessionTemplate.delete("notice_mapper.deleteNotice", noticeId);
    }
}
