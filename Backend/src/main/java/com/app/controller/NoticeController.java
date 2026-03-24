package com.app.controller;

import com.app.dto.notice.NoticeDTO;
import com.app.service.notice.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    /**
     * 1. 공지사항 전체 목록 조회
     * GET /api/notices
     * (고정글 우선 정렬된 리스트 반환)
     */
    @GetMapping
    public ResponseEntity<List<NoticeDTO>> getNoticeList() {
        List<NoticeDTO> list = noticeService.findNoticeList();
        return ResponseEntity.ok(list);
    }

    /**
     * 2. 공지사항 상세 조회
     * GET /api/notices/10
     * (조회수 1 증가 로직 포함)
     */
    @GetMapping("/{noticeId}")
    public ResponseEntity<NoticeDTO> getNoticeDetail(@PathVariable int noticeId) {
        NoticeDTO notice = noticeService.findNoticeDetail(noticeId);
        if (notice != null) {
            return ResponseEntity.ok(notice);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 3. 공지사항 등록 (관리자용)
     * POST /api/notices
     */
    @PostMapping
    public ResponseEntity<String> register(@RequestBody NoticeDTO noticeDTO) {
        int result = noticeService.registerNotice(noticeDTO);
        if (result > 0) {
            return ResponseEntity.ok("공지사항이 성공적으로 등록되었습니다.");
        } else {
            return ResponseEntity.internalServerError().body("등록 실패");
        }
    }

    /**
     * 4. 공지사항 수정 (관리자용)
     * PUT /api/notices/10
     */
    @PutMapping("/{noticeId}")
    public ResponseEntity<String> modify(@PathVariable int noticeId, @RequestBody NoticeDTO noticeDTO) {
        noticeDTO.setNoticeId(noticeId); // URL 경로의 ID를 DTO에 주입
        int result = noticeService.modifyNotice(noticeDTO);
        if (result > 0) {
            return ResponseEntity.ok("공지사항이 수정되었습니다.");
        } else {
            return ResponseEntity.badRequest().body("수정 실패 (존재하지 않는 공지사항)");
        }
    }

    /**
     * 5. 공지사항 삭제 (관리자용)
     * DELETE /api/notices/10
     */
    @DeleteMapping("/{noticeId}")
    public ResponseEntity<String> remove(@PathVariable int noticeId) {
        int result = noticeService.removeNotice(noticeId);
        if (result > 0) {
            return ResponseEntity.ok("공지사항이 삭제되었습니다.");
        } else {
            return ResponseEntity.internalServerError().body("삭제 실패");
        }
    }
}