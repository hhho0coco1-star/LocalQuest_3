package com.app.controller;

import com.app.dto.faq.FaqDTO;
import com.app.service.faq.FaqService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faqs")
@RequiredArgsConstructor
public class FaqController {

    private final FaqService faqService;

    /**
     * 1. FAQ 목록 조회 (전체 혹은 카테고리별)
     * GET /api/faqs
     * GET /api/faqs?category=USER
     */
    @GetMapping
    public ResponseEntity<List<FaqDTO>> getFaqList(@RequestParam(required = false) String category) {
        List<List<FaqDTO>> list;
        
        // 카테고리 파라미터가 있으면 필터링 조회, 없으면 전체 조회
        if (category != null && !category.isEmpty()) {
            return ResponseEntity.ok(faqService.findFaqByCategory(category));
        } else {
            return ResponseEntity.ok(faqService.findAllFaq());
        }
    }

    /**
     * 2. FAQ 상세 조회 (조회수 증가 로직 포함)
     * GET /api/faqs/5
     */
    @GetMapping("/{faqId}")
    public ResponseEntity<FaqDTO> getFaqDetail(@PathVariable int faqId) {
        FaqDTO faq = faqService.findFaqDetail(faqId);
        if (faq != null) {
            return ResponseEntity.ok(faq);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 3. FAQ 등록 (관리자용)
     * POST /api/faqs
     */
    @PostMapping
    public ResponseEntity<String> register(@RequestBody FaqDTO faqDTO) {
        int result = faqService.registerFaq(faqDTO);
        if (result > 0) {
            return ResponseEntity.ok("FAQ가 성공적으로 등록되었습니다.");
        } else {
            return ResponseEntity.internalServerError().body("FAQ 등록 실패");
        }
    }

    /**
     * 4. FAQ 수정 (관리자용)
     * PUT /api/faqs/5
     */
    @PutMapping("/{faqId}")
    public ResponseEntity<String> modify(@PathVariable int faqId, @RequestBody FaqDTO faqDTO) {
        faqDTO.setFaqId(faqId); // 경로상의 ID를 DTO에 세팅
        int result = faqService.modifyFaq(faqDTO);
        if (result > 0) {
            return ResponseEntity.ok("FAQ가 수정되었습니다.");
        } else {
            return ResponseEntity.badRequest().body("수정 실패 (존재하지 않는 ID)");
        }
    }

    /**
     * 5. FAQ 삭제 (관리자용)
     * DELETE /api/faqs/5
     */
    @DeleteMapping("/{faqId}")
    public ResponseEntity<String> remove(@PathVariable int faqId) {
        int result = faqService.removeFaq(faqId);
        if (result > 0) {
            return ResponseEntity.ok("FAQ가 삭제되었습니다.");
        } else {
            return ResponseEntity.internalServerError().body("삭제 실패");
        }
    }
}