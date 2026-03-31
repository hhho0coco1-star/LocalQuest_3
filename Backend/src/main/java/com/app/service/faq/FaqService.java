package com.app.service.faq;

import java.util.List;

import com.app.dto.faq.FaqDTO;

public interface FaqService {
	// 1. FAQ 등록 (관리자용)
    int registerFaq(FaqDTO faq);

    // 2-1. FAQ 전체 목록 조회
    List<FaqDTO> findAllFaq();

    // 2-2. 카테고리별 FAQ 목록 조회
    List<FaqDTO> findFaqByCategory(String category);

    // 2-3. FAQ 상세 조회 (조회수 증가 없이 관리자 화면용 조회)
    FaqDTO findFaqById(int faqId);

    // 2-4. FAQ 상세 조회 (조회수 증가 포함)
    FaqDTO findFaqDetail(int faqId);

    // 3. FAQ 수정 (관리자용)
    int modifyFaq(FaqDTO faq);

    // 4. FAQ 삭제 (관리자용)
    int removeFaq(int faqId);
}
