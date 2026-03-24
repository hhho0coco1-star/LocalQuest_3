package com.app.service.business.impl;

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
    @Transactional
    public int saveBusiness(BusinessDTO business) {
        return dao.saveBusiness(business);
    }
}
