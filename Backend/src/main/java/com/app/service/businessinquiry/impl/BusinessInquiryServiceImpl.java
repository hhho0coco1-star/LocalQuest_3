package com.app.service.businessinquiry.impl;

import java.util.List;
import java.util.Map;

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
    public List<BusinessInquiryDTO> getBusinessInquiryList(Map<String, Object> params) {
        return dao.getBusinessInquiryList(params);
    }

    @Override
    public BusinessInquiryDTO getBusinessInquiryById(int inquiryId) {
        return dao.getBusinessInquiryById(inquiryId);
    }

    @Override
    @Transactional
    public boolean saveBusinessInquiry(BusinessInquiryDTO businessInquiry) {
        return dao.saveBusinessInquiry(businessInquiry) > 0;
    }

    @Override
    @Transactional
    public boolean updateBusinessInquiryStatus(int inquiryId, String status) {
        Map<String, Object> params = new java.util.HashMap<>();
        params.put("inquiryId", inquiryId);
        params.put("status", status);
        return dao.updateBusinessInquiryStatus(params) > 0;
    }

    @Override
    @Transactional
    public boolean deleteBusinessInquiry(int inquiryId) {
        return dao.deleteBusinessInquiry(inquiryId) > 0;
    }
}
