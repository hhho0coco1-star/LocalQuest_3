package com.app.dao.inquiry.impl;

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
}
