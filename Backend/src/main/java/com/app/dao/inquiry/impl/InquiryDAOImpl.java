package com.app.dao.inquiry.impl;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.inquiry.InquiryDAO;
import com.app.dto.inquiry.InquiryDTO;

@Repository
public class InquiryDAOImpl implements InquiryDAO {

	@Autowired
	private SqlSessionTemplate sqlSessionTemplate;

	@Override
	public int saveInquiry(InquiryDTO inquiry) {
		int result = sqlSessionTemplate.insert("inquiry_mapper.saveInquiry", inquiry);
		return result;
	}

    // 2. 목록 조회 (Read - List)
    @Override
    public List<InquiryDTO> getInquiryList(int userId) {
        return sqlSessionTemplate.selectList("inquiry_mapper.getInquiryList", userId);
    }

    // 3. 상세 조회 (Read - One)
    @Override
    public InquiryDTO getInquiryById(int inquiryId) {
        return sqlSessionTemplate.selectOne("inquiry_mapper.getInquiryById", inquiryId);
    }

    // 4. 수정 (Update)
    @Override
    public int updateInquiry(InquiryDTO inquiry) {
        return sqlSessionTemplate.update("inquiry_mapper.updateInquiry", inquiry);
    }

    // 5. 삭제 (Delete)
    @Override
    public int deleteInquiry(int inquiryId) {
        return sqlSessionTemplate.delete("inquiry_mapper.deleteInquiry", inquiryId);
    }
}
