package com.app.service.inquiry.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.inquiry.InquiryDAO;
import com.app.dto.inquiry.InquiryDTO;
import com.app.service.inquiry.InquiryService;

@Service
public class InquiryServiceImpl implements InquiryService {

    @Autowired
    private InquiryDAO dao;

    @Override
    @Transactional
    public int saveInquiry(InquiryDTO inquiry) {
        return dao.saveInquiry(inquiry);
    }
}
