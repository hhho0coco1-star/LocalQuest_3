package com.app.dao.business.impl;

import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.business.BusinessDAO;
import com.app.dto.business.BusinessDashboardDTO;
import com.app.dto.business.BusinessDTO;
import com.app.dto.business.BusinessHourlyAuthDTO;

@Repository
public class BusinessDAOImpl implements BusinessDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    private static final String NAMESPACE = "business_mapper";

    @Override
    public List<BusinessDTO> getBusinessList(Map<String, Object> params) {
        return sqlSessionTemplate.selectList(NAMESPACE + ".getBusinessList", params);
    }

    @Override
    public BusinessDTO getBusinessById(int businessId) {
        return sqlSessionTemplate.selectOne(NAMESPACE + ".getBusinessById", businessId);
    }

    @Override
    public BusinessDTO getBusinessByUserId(int userId) {
        return sqlSessionTemplate.selectOne(NAMESPACE + ".getBusinessByUserId", userId);
    }

    @Override
    public BusinessDashboardDTO getBusinessDashboardByBusinessId(int businessId) {
        return sqlSessionTemplate.selectOne(NAMESPACE + ".getBusinessDashboardByBusinessId", businessId);
    }

    @Override
    public List<BusinessHourlyAuthDTO> getBusinessHourlyAuthCounts(int businessId) {
        return sqlSessionTemplate.selectList(NAMESPACE + ".getBusinessHourlyAuthCounts", businessId);
    }

    @Override
    public int saveBusiness(BusinessDTO business) {
        return sqlSessionTemplate.insert(NAMESPACE + ".saveBusiness", business);
    }

    @Override
    public int updateBusiness(BusinessDTO business) {
        return sqlSessionTemplate.update(NAMESPACE + ".updateBusiness", business);
    }

    @Override
    public int deleteBusiness(int businessId) {
        return sqlSessionTemplate.delete(NAMESPACE + ".deleteBusiness", businessId);
    }
}
