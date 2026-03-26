package com.app.service.notice.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.notice.NoticeDAO;
import com.app.dto.notice.NoticeDTO;
import com.app.service.notice.NoticeService;

@Service
public class NoticeServiceImpl implements NoticeService {

    @Autowired
    private NoticeDAO noticeDAO;

 // 1. 공지사항 등록
    @Override
    @Transactional
    public int registerNotice(NoticeDTO notice) {
        return noticeDAO.saveNotice(notice);
    }

    // 2-1. 목록 조회
    @Override
    public List<NoticeDTO> findNoticeList() {
        return noticeDAO.getNoticeList();
    }

    // 2-2. 상세 조회 (조회수 증가 로직 포함)
    @Override
    @Transactional
    public NoticeDTO findNoticeDetail(int noticeId) {
        // 1. 조회수 1 증가 (DB 업데이트)
        noticeDAO.updateViewCount(noticeId);
        
        // 2. 상세 데이터 가져오기
        return noticeDAO.getNoticeById(noticeId);
    }

    // 3. 수정
    @Override
    @Transactional
    public int modifyNotice(NoticeDTO notice) {
        return noticeDAO.updateNotice(notice);
    }

    // 4. 삭제
    @Override
    @Transactional
    public int removeNotice(int noticeId) {
        return noticeDAO.deleteNotice(noticeId);
    }
}
