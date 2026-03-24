package com.app.dao.business.impl;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.business.BusinessDAO;
import com.app.dto.business.BusinessDTO;

@Repository
public class BusinessDAOImpl implements BusinessDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int saveBusiness(BusinessDTO business) {
        int result = sqlSessionTemplate.insert("business_mapper.saveBusiness", business);
        return result;
    }
}
