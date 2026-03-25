package com.app.controller;

import com.app.auth.SessionAuthKeys;
import com.app.dto.inquiry.InquiryDTO;
import com.app.service.inquiry.InquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inquiries") // 공통 경로 설정
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    // 1. 문의 등록 (POST)
    @PostMapping
    public ResponseEntity<?> register(@RequestBody InquiryDTO inquiryDTO, HttpSession session) {
        Integer loginUserId = resolveLoginUserId(session);
        if (loginUserId == null || loginUserId <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "로그인한 사용자만 문의를 등록할 수 있습니다."));
        }

        if (inquiryDTO == null) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "문의 등록 요청이 올바르지 않습니다."));
        }

        String title = trimToEmpty(inquiryDTO.getTitle());
        String content = trimToEmpty(inquiryDTO.getContent());
        if (title.isEmpty() || content.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "문의 제목과 내용을 모두 입력해주세요."));
        }

        inquiryDTO.setUserId(loginUserId);
        inquiryDTO.setTitle(title);
        inquiryDTO.setContent(content);

        int result = inquiryService.registerInquiry(inquiryDTO);

        if (result > 0) {
            return ResponseEntity.ok(Map.of("message", "문의가 성공적으로 등록되었습니다."));
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "문의 등록에 실패했습니다."));
        }
    }

    // 2. 본인의 문의 목록 조회 (GET)
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<InquiryDTO>> getList(@PathVariable int userId) {
        List<InquiryDTO> list = inquiryService.findInquiryList(userId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyInquiryList(HttpSession session) {
        Integer loginUserId = resolveLoginUserId(session);
        if (loginUserId == null || loginUserId <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "로그인한 사용자만 문의내역을 조회할 수 있습니다."));
        }

        List<InquiryDTO> list = inquiryService.findInquiryList(loginUserId);
        return ResponseEntity.ok(list);
    }

    // 3. 문의 상세 조회 (GET)
    @GetMapping("/{inquiryId}")
    public ResponseEntity<InquiryDTO> getDetail(@PathVariable int inquiryId) {
        InquiryDTO detail = inquiryService.findInquiryById(inquiryId);
        if (detail != null) {
            return ResponseEntity.ok(detail);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // 4. 문의 수정 (PUT)
    @PutMapping("/{inquiryId}")
    public ResponseEntity<String> modify(@PathVariable int inquiryId, @RequestBody InquiryDTO inquiryDTO) {
        inquiryDTO.setInquiryId(inquiryId);
        int result = inquiryService.modifyInquiry(inquiryDTO);
        
        if (result > 0) {
            return ResponseEntity.ok("문의가 수정되었습니다.");
        } else {
            // 수정 실패 시 (이미 답변이 달렸거나 글이 없는 경우)
            return ResponseEntity.badRequest().body("수정할 수 없는 상태이거나 글이 존재하지 않습니다.");
        }
    }

    // 5. 문의 삭제 (DELETE)
    @DeleteMapping("/{inquiryId}")
    public ResponseEntity<String> remove(@PathVariable int inquiryId) {
        int result = inquiryService.removeInquiry(inquiryId);
        
        if (result > 0) {
            return ResponseEntity.ok("문의가 삭제되었습니다.");
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("삭제 실패");
        }
    }

    private Integer resolveLoginUserId(HttpSession session) {
        if (session == null) {
            return null;
        }

        Object sessionUserId = session.getAttribute(SessionAuthKeys.USER_ID);
        if (sessionUserId instanceof Number) {
            return ((Number) sessionUserId).intValue();
        }

        if (sessionUserId instanceof String) {
            try {
                return Integer.parseInt(((String) sessionUserId).trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }

        return null;
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
