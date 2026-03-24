package com.app.controller;

import com.app.dto.inquiry.InquiryDTO;
import com.app.service.inquiry.InquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inquiries") // 공통 경로 설정
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    // 1. 문의 등록 (POST)
    @PostMapping
    public ResponseEntity<String> register(@RequestBody InquiryDTO inquiryDTO) {
        // 실제 운영 시 세션이나 토큰에서 userId를 꺼내 세팅해야 함
        // inquiryDTO.setUserId(sessionUserId); 
        
        int result = inquiryService.registerInquiry(inquiryDTO);
        
        if (result > 0) {
            return ResponseEntity.ok("문의가 성공적으로 등록되었습니다.");
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("등록에 실패했습니다.");
        }
    }

    // 2. 본인의 문의 목록 조회 (GET)
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<InquiryDTO>> getList(@PathVariable int userId) {
        List<InquiryDTO> list = inquiryService.findInquiryList(userId);
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
}