package com.app.service.inquiry.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.inquiry.InquiryDAO;
import com.app.dto.inquiry.InquiryDTO;
import com.app.service.inquiry.InquiryService;

@Service
public class InquiryServiceImpl implements InquiryService {

    @Autowired
    private InquiryDAO inquiryDAO;
    
 // 1. 등록 (추가)
    @Override
    @Transactional
    public int registerInquiry(InquiryDTO inquiry) {
        // 추가적인 비즈니스 로직 (예: 욕설 필터링 등)을 여기서 수행 가능
        return inquiryDAO.saveInquiry(inquiry);
    }

    // 2. 본인의 문의 목록 조회
    @Override
    public List<InquiryDTO> findInquiryList(int userId) {
        return inquiryDAO.getInquiryList(userId);
    }

    // 3. 문의 상세 조회
    @Override
    public InquiryDTO findInquiryById(int inquiryId) {
        return inquiryDAO.getInquiryById(inquiryId);
    }

    // 4. 문의 수정
    @Override
    @Transactional
    public int modifyInquiry(InquiryDTO inquiry) {
        // [비즈니스 로직] 수정 전, 이미 답변이 달린 글인지 체크하는 로직을 넣으면 좋습니다.
        // DAO의 XML 쿼리에서 이미 STATUS='PENDING' 조건을 걸었으므로 
        // 결과가 0이면 수정 실패(이미 답변 완료 혹은 글 없음)로 판단합니다.
        return inquiryDAO.updateInquiry(inquiry);
    }

    // 5. 문의 삭제
    @Override
    @Transactional
    public int removeInquiry(int inquiryId) {
        return inquiryDAO.deleteInquiry(inquiryId);
    }
}
