package com.app.dao.businessinquiry.impl;

import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.businessinquiry.BusinessInquiryDAO;
import com.app.dto.businessinquiry.BusinessInquiryDTO;

@Repository
public class BusinessInquiryDAOImpl implements BusinessInquiryDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    private static final String NAMESPACE = "businessinquiry_mapper";

    @Override
    public List<BusinessInquiryDTO> getBusinessInquiryList(Map<String, Object> params) {
        return sqlSessionTemplate.selectList(NAMESPACE + ".getBusinessInquiryList", params);
    }

    @Override
    public BusinessInquiryDTO getBusinessInquiryById(int inquiryId) {
        return sqlSessionTemplate.selectOne(NAMESPACE + ".getBusinessInquiryById", inquiryId);
    }

    @Override
    public int saveBusinessInquiry(BusinessInquiryDTO businessInquiry) {
        return sqlSessionTemplate.insert(NAMESPACE + ".saveBusinessInquiry", businessInquiry);
    }

    @Override
    public int updateBusinessInquiryStatus(Map<String, Object> params) {
        return sqlSessionTemplate.update(NAMESPACE + ".updateBusinessInquiryStatus", params);
    }

    @Override
    public int deleteBusinessInquiry(int inquiryId) {
        return sqlSessionTemplate.delete(NAMESPACE + ".deleteBusinessInquiry", inquiryId);
    }
}
