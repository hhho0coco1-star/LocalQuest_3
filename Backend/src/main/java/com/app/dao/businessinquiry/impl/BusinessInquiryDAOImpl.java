package com.app.dao.businessinquiry.impl;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.businessinquiry.BusinessInquiryDAO;
import com.app.dto.businessinquiry.BusinessInquiryDTO;

@Repository
public class BusinessInquiryDAOImpl implements BusinessInquiryDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int saveBusinessInquiry(BusinessInquiryDTO businessInquiry) {
        int result = sqlSessionTemplate.insert("businessinquiry_mapper.saveBusinessInquiry", businessInquiry);
        return result;
    }
}
