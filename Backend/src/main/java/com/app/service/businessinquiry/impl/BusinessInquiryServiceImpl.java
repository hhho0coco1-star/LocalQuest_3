package com.app.service.businessinquiry.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.businessinquiry.BusinessInquiryDAO;
import com.app.dto.businessinquiry.BusinessInquiryDTO;
import com.app.service.businessinquiry.BusinessInquiryService;

@Service
public class BusinessInquiryServiceImpl implements BusinessInquiryService {

    @Autowired
    private BusinessInquiryDAO dao;

    @Override
    @Transactional
    public int saveBusinessInquiry(BusinessInquiryDTO businessInquiry) {
        return dao.saveBusinessInquiry(businessInquiry);
    }
}
