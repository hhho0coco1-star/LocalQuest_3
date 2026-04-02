package com.app.dao.businesscouponrequest.impl;

import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.businesscouponrequest.BusinessCouponRequestDAO;
import com.app.dto.businesscouponrequest.BusinessCouponRequestDTO;
import com.app.dto.businesscouponrequest.BusinessCouponRequestHistoryDTO;

@Repository
public class BusinessCouponRequestDAOImpl implements BusinessCouponRequestDAO {

    private static final String NAMESPACE = "businesscouponrequest_mapper";

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public List<BusinessCouponRequestDTO> getBusinessCouponRequestList(Map<String, Object> params) {
        return sqlSessionTemplate.selectList(NAMESPACE + ".getBusinessCouponRequestList", params);
    }

    @Override
    public BusinessCouponRequestDTO getBusinessCouponRequestById(long requestId) {
        return sqlSessionTemplate.selectOne(NAMESPACE + ".getBusinessCouponRequestById", requestId);
    }

    @Override
    public int saveBusinessCouponRequest(BusinessCouponRequestDTO request) {
        return sqlSessionTemplate.insert(NAMESPACE + ".saveBusinessCouponRequest", request);
    }

    @Override
    public int updateBusinessCouponRequest(BusinessCouponRequestDTO request) {
        return sqlSessionTemplate.update(NAMESPACE + ".updateBusinessCouponRequest", request);
    }

    @Override
    public int resubmitBusinessCouponRequest(BusinessCouponRequestDTO request) {
        return sqlSessionTemplate.update(NAMESPACE + ".resubmitBusinessCouponRequest", request);
    }

    @Override
    public int holdBusinessCouponRequest(Map<String, Object> params) {
        return sqlSessionTemplate.update(NAMESPACE + ".holdBusinessCouponRequest", params);
    }

    @Override
    public int acceptBusinessCouponRequest(Map<String, Object> params) {
        return sqlSessionTemplate.update(NAMESPACE + ".acceptBusinessCouponRequest", params);
    }

    @Override
    public int cancelBusinessCouponRequest(Map<String, Object> params) {
        return sqlSessionTemplate.update(NAMESPACE + ".cancelBusinessCouponRequest", params);
    }

    @Override
    public List<BusinessCouponRequestHistoryDTO> getBusinessCouponRequestHistoryList(long requestId) {
        return sqlSessionTemplate.selectList(NAMESPACE + ".getBusinessCouponRequestHistoryList", requestId);
    }

    @Override
    public int saveBusinessCouponRequestHistory(BusinessCouponRequestHistoryDTO history) {
        return sqlSessionTemplate.insert(NAMESPACE + ".saveBusinessCouponRequestHistory", history);
    }
}
