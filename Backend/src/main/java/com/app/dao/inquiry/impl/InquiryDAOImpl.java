package com.app.dao.inquiry.impl;

import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.inquiry.InquiryDAO;
import com.app.dto.inquiry.InquiryDTO;

@Repository
public class InquiryDAOImpl implements InquiryDAO {

    private static final String NAMESPACE = "inquiry_mapper";

	@Autowired
	private SqlSessionTemplate sqlSessionTemplate;

	@Override
	public int saveInquiry(InquiryDTO inquiry) {
		int result = sqlSessionTemplate.insert(NAMESPACE + ".saveInquiry", inquiry);
		return result;
	}

    // 2. 목록 조회 (Read - List)
    @Override
    public List<InquiryDTO> getInquiryList(int userId) {
        return sqlSessionTemplate.selectList(NAMESPACE + ".getInquiryList", userId);
    }

    // 3. 상세 조회 (Read - One)
    @Override
    public List<InquiryDTO> getAdminInquiryList(Map<String, Object> params) {
        return sqlSessionTemplate.selectList(NAMESPACE + ".getAdminInquiryList", params);
    }

    @Override
    public InquiryDTO getInquiryById(int inquiryId) {
        return sqlSessionTemplate.selectOne(NAMESPACE + ".getInquiryById", inquiryId);
    }

    // 4. 수정 (Update)
    @Override
    public int updateInquiry(InquiryDTO inquiry) {
        return sqlSessionTemplate.update(NAMESPACE + ".updateInquiry", inquiry);
    }

    // 5. 삭제 (Delete)
    @Override
    public int deleteInquiry(int inquiryId) {
        return sqlSessionTemplate.delete(NAMESPACE + ".deleteInquiry", inquiryId);
    }
    @Override
    public int saveInquiryAnswer(InquiryDTO inquiry) {
        return sqlSessionTemplate.update(NAMESPACE + ".saveInquiryAnswer", inquiry);
    }
}
