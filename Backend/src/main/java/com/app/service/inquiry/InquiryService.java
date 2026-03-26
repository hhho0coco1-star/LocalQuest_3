package com.app.service.inquiry;

import java.util.List;
import java.util.Map;

import com.app.dto.inquiry.InquiryDTO;

public interface InquiryService {
    int registerInquiry(InquiryDTO inquiry);        // 등록
    List<InquiryDTO> findInquiryList(int userId);    // 목록 조회
    InquiryDTO findInquiryById(int inquiryId);       // 상세 조회
    int modifyInquiry(InquiryDTO inquiry);          // 수정
    int removeInquiry(int inquiryId);                // 삭제
    List<InquiryDTO> findAdminInquiryList(Map<String, Object> params);
    int saveInquiryAnswer(InquiryDTO inquiry);
}
