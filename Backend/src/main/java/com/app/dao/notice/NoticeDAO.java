package com.app.dao.notice;

import java.util.List;

import com.app.dto.notice.NoticeDTO;

public interface NoticeDAO {
	// 1. 공지사항 등록 (관리자)
    int saveNotice(NoticeDTO notice);

    // 2-1. 공지사항 목록 조회 (고정글 우선 정렬)
    List<NoticeDTO> getNoticeList();

    // 2-2. 공지사항 상세 조회
    NoticeDTO getNoticeById(int noticeId);

    // 2-3. 조회수 1 증가
    void updateViewCount(int noticeId);

    // 3. 공지사항 수정 (관리자)
    int updateNotice(NoticeDTO notice);

    // 4. 공지사항 삭제 (관리자)
    int deleteNotice(int noticeId);
}
