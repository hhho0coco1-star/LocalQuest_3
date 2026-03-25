package com.app.service.business.impl;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.business.BusinessDAO;
import com.app.dto.business.BusinessDTO;
import com.app.service.business.BusinessService;

@Service
public class BusinessServiceImpl implements BusinessService {

    @Autowired
    private BusinessDAO dao;

    @Override
    public List<BusinessDTO> getBusinessList(Map<String, Object> params) {
        return dao.getBusinessList(params);
    }

    @Override
    public BusinessDTO getBusinessById(int businessId) {
        return dao.getBusinessById(businessId);
    }

    @Override
    public BusinessDTO getBusinessByUserId(int userId) {
        return dao.getBusinessByUserId(userId);
    }

    @Override
    public Map<String, Object> getBusinessAuthSummary(int businessId) {
        return dao.getBusinessAuthSummary(businessId);
    }

    @Override
    @Transactional
    public boolean registerBusiness(BusinessDTO business) {
        return dao.saveBusiness(business) > 0;
    }

    @Override
    @Transactional
    public boolean updateBusiness(BusinessDTO business) {
        return dao.updateBusiness(business) > 0;
    }

    @Override
    @Transactional
    public boolean deleteBusiness(int businessId) {
        // Hard delete is intentionally disabled; use suspend/resume instead.
        return false;
    }
}
