package com.app.service.faq.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.faq.FaqDAO;
import com.app.dto.faq.FaqDTO;
import com.app.service.faq.FaqService;

@Service
public class FaqServiceImpl implements FaqService {

    @Autowired
    private FaqDAO faqDAO;

    // 1. FAQ 등록
    @Override
    @Transactional
    public int registerFaq(FaqDTO faq) {
        return faqDAO.saveFaq(faq);
    }

    // 2-1. 전체 목록 조회
    @Override
    public List<FaqDTO> findAllFaq() {
        return faqDAO.getFaqList();
    }

    // 2-2. 카테고리별 목록 조회
    @Override
    public List<FaqDTO> findFaqByCategory(String category) {
        return faqDAO.getFaqByCategory(category);
    }

    // 2-3. 상세 조회 (조회수 증가 없이 관리자 화면용 조회)
    @Override
    public FaqDTO findFaqById(int faqId) {
        return faqDAO.getFaqById(faqId);
    }

    // 2-4. 상세 조회 (비즈니스 로직: 조회수 증가 후 데이터 가져오기)
    @Override
    @Transactional
    public FaqDTO findFaqDetail(int faqId) {
        // 1. 조회수 1 증가
        faqDAO.updateViewCount(faqId);
        
        // 2. 상세 데이터 조회 후 반환
        return faqDAO.getFaqById(faqId);
    }

    // 3. 수정
    @Override
    @Transactional
    public int modifyFaq(FaqDTO faq) {
        return faqDAO.updateFaq(faq);
    }

    // 4. 삭제
    @Override
    @Transactional
    public int removeFaq(int faqId) {
        return faqDAO.deleteFaq(faqId);
    }
}
