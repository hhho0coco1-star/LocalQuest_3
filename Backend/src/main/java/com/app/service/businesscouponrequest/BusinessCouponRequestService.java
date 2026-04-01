package com.app.service.businesscouponrequest;

import java.util.List;
import java.util.Map;

import com.app.dto.businesscouponrequest.BusinessCouponRequestDTO;
import com.app.dto.businesscouponrequest.BusinessCouponRequestHistoryDTO;

public interface BusinessCouponRequestService {

    List<BusinessCouponRequestDTO> getBusinessCouponRequestList(Map<String, Object> params);

    BusinessCouponRequestDTO getBusinessCouponRequestById(long requestId);

    List<BusinessCouponRequestHistoryDTO> getBusinessCouponRequestHistoryList(long requestId);

    boolean createBusinessCouponRequest(BusinessCouponRequestDTO request);

    boolean updateBusinessCouponRequest(BusinessCouponRequestDTO request, Integer actionByUserId);

    boolean resubmitBusinessCouponRequest(BusinessCouponRequestDTO request, Integer actionByUserId);

    boolean holdBusinessCouponRequest(long requestId, Integer actionByUserId, String holdReason);

    boolean acceptBusinessCouponRequest(long requestId, Integer actionByUserId, Long approvedRewardItemId);

    boolean cancelBusinessCouponRequest(long requestId, Integer actionByUserId, String commentText);
}
