package com.app.dao.businesscouponrequest;

import java.util.List;
import java.util.Map;

import com.app.dto.businesscouponrequest.BusinessCouponRequestDTO;
import com.app.dto.businesscouponrequest.BusinessCouponRequestHistoryDTO;

public interface BusinessCouponRequestDAO {

    List<BusinessCouponRequestDTO> getBusinessCouponRequestList(Map<String, Object> params);

    BusinessCouponRequestDTO getBusinessCouponRequestById(long requestId);

    int saveBusinessCouponRequest(BusinessCouponRequestDTO request);

    int updateBusinessCouponRequest(BusinessCouponRequestDTO request);

    int resubmitBusinessCouponRequest(BusinessCouponRequestDTO request);

    int holdBusinessCouponRequest(Map<String, Object> params);

    int acceptBusinessCouponRequest(Map<String, Object> params);

    int cancelBusinessCouponRequest(Map<String, Object> params);

    List<BusinessCouponRequestHistoryDTO> getBusinessCouponRequestHistoryList(long requestId);

    int saveBusinessCouponRequestHistory(BusinessCouponRequestHistoryDTO history);
}
