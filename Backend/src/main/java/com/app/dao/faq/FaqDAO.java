package com.app.dao.faq;

import java.util.List;

import com.app.dto.faq.FaqDTO;

public interface FaqDAO {
	// 1. FAQ 등록 (관리자용)
    int saveFaq(FaqDTO faq);

    // 2-1. FAQ 전체 목록 조회
    List<FaqDTO> getFaqList();

    // 2-2. 카테고리별 FAQ 목록 조회
    List<FaqDTO> getFaqByCategory(String category);

    // 2-3. FAQ 상세 조회
    FaqDTO getFaqById(int faqId);

    // 2-4. 조회수 증가
    void updateViewCount(int faqId);

    // 3. FAQ 수정 (관리자용)
    int updateFaq(FaqDTO faq);

    // 4. FAQ 삭제 (관리자용)
    int deleteFaq(int faqId);
}
