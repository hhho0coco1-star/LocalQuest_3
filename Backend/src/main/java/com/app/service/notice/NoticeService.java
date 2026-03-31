package com.app.service.notice;

import java.util.List;

import com.app.dto.notice.NoticeDTO;

public interface NoticeService {
	// 1. 공지사항 등록
    int registerNotice(NoticeDTO notice);

    // 2-1. 공지사항 목록 조회 (고정글 우선)
    List<NoticeDTO> findNoticeList();

    // 2-2. 공지사항 상세 조회 (조회수 증가 포함)
    NoticeDTO findNoticeDetail(int noticeId);

    // 2-3. 관리자 상세 조회 (조회수 증가 없음)
    NoticeDTO findNoticeById(int noticeId);

    // 3. 공지사항 수정
    int modifyNotice(NoticeDTO notice);

    // 4. 공지사항 삭제
    int removeNotice(int noticeId);
}
