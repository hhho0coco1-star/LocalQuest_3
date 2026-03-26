package com.app.dao.inquiry;

import java.util.List;

import com.app.dto.inquiry.InquiryDTO;

public interface InquiryDAO {
	public int saveInquiry(InquiryDTO inquiry);

	List<InquiryDTO> getInquiryList(int userId); // 목록 조회

	InquiryDTO getInquiryById(int inquiryId); // 상세 조회

	int updateInquiry(InquiryDTO inquiry); // 수정

	int deleteInquiry(int inquiryId); // 삭제
}
