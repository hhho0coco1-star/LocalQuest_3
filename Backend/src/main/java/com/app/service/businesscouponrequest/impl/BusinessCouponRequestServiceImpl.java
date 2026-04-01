package com.app.service.businesscouponrequest.impl;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.businesscouponrequest.BusinessCouponRequestDAO;
import com.app.dao.reward.RewardItemDAO;
import com.app.dto.businesscouponrequest.BusinessCouponRequestDTO;
import com.app.dto.businesscouponrequest.BusinessCouponRequestHistoryDTO;
import com.app.dto.reward.RewardItemDTO;
import com.app.service.businesscouponrequest.BusinessCouponRequestService;

@Service
public class BusinessCouponRequestServiceImpl implements BusinessCouponRequestService {

    private static final String STATUS_REQUESTED = "REQUESTED";
    private static final String STATUS_HOLD = "HOLD";
    private static final String STATUS_ACCEPTED = "ACCEPTED";
    private static final String STATUS_CANCELLED = "CANCELLED";
    private static final String TARGET_STATUS_ON_SALE = "ON_SALE";

    @Autowired
    private BusinessCouponRequestDAO dao;

    @Autowired
    private RewardItemDAO rewardItemDAO;

    @Override
    public List<BusinessCouponRequestDTO> getBusinessCouponRequestList(Map<String, Object> params) {
        return dao.getBusinessCouponRequestList(params);
    }

    @Override
    public BusinessCouponRequestDTO getBusinessCouponRequestById(long requestId) {
        if (requestId <= 0L) {
            return null;
        }
        return dao.getBusinessCouponRequestById(requestId);
    }

    @Override
    public List<BusinessCouponRequestHistoryDTO> getBusinessCouponRequestHistoryList(long requestId) {
        if (requestId <= 0L) {
            return Collections.emptyList();
        }
        List<BusinessCouponRequestHistoryDTO> historyList = dao.getBusinessCouponRequestHistoryList(requestId);
        return historyList == null ? Collections.emptyList() : historyList;
    }

    @Override
    @Transactional
    public boolean createBusinessCouponRequest(BusinessCouponRequestDTO request) {
        if (!isRequestValid(request)) {
            return false;
        }

        normalizeRequest(request);
        request.setRequestStatus(STATUS_REQUESTED);
        request.setRequestVersion(Integer.valueOf(1));
        request.setLastHoldReason(null);
        request.setApprovedRewardItemId(null);

        requireSingleRow(dao.saveBusinessCouponRequest(request), "Failed to create business coupon request");

        BusinessCouponRequestDTO saved = requireRequest(request.getRequestId());
        saveHistory(saved, "CREATED", "ADMIN", request.getAdminUserId(), null);
        return true;
    }

    @Override
    @Transactional
    public boolean updateBusinessCouponRequest(BusinessCouponRequestDTO request, Integer actionByUserId) {
        if (request == null || request.getRequestId() == null || request.getRequestId().longValue() <= 0L) {
            return false;
        }

        BusinessCouponRequestDTO current = dao.getBusinessCouponRequestById(request.getRequestId().longValue());
        if (current == null || isClosedStatus(current.getRequestStatus())) {
            return false;
        }

        if (request.getAdminUserId() == null) {
            request.setAdminUserId(current.getAdminUserId());
        }
        if (!isRequestValid(request)) {
            return false;
        }

        normalizeRequest(request);

        requireSingleRow(dao.updateBusinessCouponRequest(request), "Failed to update business coupon request");

        BusinessCouponRequestDTO updated = requireRequest(request.getRequestId());
        saveHistory(updated, "UPDATED", "ADMIN", normalizeActionUserId(actionByUserId, updated.getAdminUserId()), null);
        return true;
    }

    @Override
    @Transactional
    public boolean resubmitBusinessCouponRequest(BusinessCouponRequestDTO request, Integer actionByUserId) {
        if (request == null || request.getRequestId() == null || request.getRequestId().longValue() <= 0L) {
            return false;
        }

        BusinessCouponRequestDTO current = dao.getBusinessCouponRequestById(request.getRequestId().longValue());
        if (current == null || isClosedStatus(current.getRequestStatus())) {
            return false;
        }

        if (request.getAdminUserId() == null) {
            request.setAdminUserId(current.getAdminUserId());
        }
        if (!isRequestValid(request)) {
            return false;
        }

        normalizeRequest(request);

        requireSingleRow(dao.resubmitBusinessCouponRequest(request), "Failed to resubmit business coupon request");

        BusinessCouponRequestDTO updated = requireRequest(request.getRequestId());
        saveHistory(updated, "RESUBMITTED", "ADMIN", normalizeActionUserId(actionByUserId, updated.getAdminUserId()), null);
        return true;
    }

    @Override
    @Transactional
    public boolean holdBusinessCouponRequest(long requestId, Integer actionByUserId, String holdReason) {
        if (requestId <= 0L || isBlank(holdReason)) {
            return false;
        }

        BusinessCouponRequestDTO current = dao.getBusinessCouponRequestById(requestId);
        if (current == null || !isActionableBusinessRequest(current.getRequestStatus())) {
            return false;
        }

        Map<String, Object> params = new HashMap<>();
        params.put("requestId", Long.valueOf(requestId));
        params.put("holdReason", holdReason.trim());

        requireSingleRow(dao.holdBusinessCouponRequest(params), "Failed to hold business coupon request");

        BusinessCouponRequestDTO updated = requireRequest(Long.valueOf(requestId));
        saveHistory(updated, "HOLD", "BUSINESS", actionByUserId, holdReason.trim());
        return true;
    }

    @Override
    @Transactional
    public boolean acceptBusinessCouponRequest(long requestId, Integer actionByUserId, Long approvedRewardItemId) {
        if (requestId <= 0L) {
            return false;
        }

        BusinessCouponRequestDTO current = dao.getBusinessCouponRequestById(requestId);
        if (current == null || !isActionableBusinessRequest(current.getRequestStatus())) {
            return false;
        }

        Long resolvedApprovedRewardItemId = approvedRewardItemId;
        if (resolvedApprovedRewardItemId == null || resolvedApprovedRewardItemId.longValue() <= 0L) {
            resolvedApprovedRewardItemId = createRewardItemFromRequest(current);
        }

        Map<String, Object> params = new HashMap<>();
        params.put("requestId", Long.valueOf(requestId));
        params.put("approvedRewardItemId", resolvedApprovedRewardItemId);

        requireSingleRow(dao.acceptBusinessCouponRequest(params), "Failed to accept business coupon request");

        BusinessCouponRequestDTO updated = requireRequest(Long.valueOf(requestId));
        saveHistory(updated, "ACCEPTED", "BUSINESS", actionByUserId, null);
        return true;
    }

    @Override
    @Transactional
    public boolean cancelBusinessCouponRequest(long requestId, Integer actionByUserId, String commentText) {
        if (requestId <= 0L) {
            return false;
        }

        BusinessCouponRequestDTO current = dao.getBusinessCouponRequestById(requestId);
        if (current == null || isClosedStatus(current.getRequestStatus())) {
            return false;
        }

        Map<String, Object> params = new HashMap<>();
        params.put("requestId", Long.valueOf(requestId));

        requireSingleRow(dao.cancelBusinessCouponRequest(params), "Failed to cancel business coupon request");

        BusinessCouponRequestDTO updated = requireRequest(Long.valueOf(requestId));
        saveHistory(updated, "CANCELLED", "ADMIN", normalizeActionUserId(actionByUserId, updated.getAdminUserId()), trimToNull(commentText));
        return true;
    }

    private BusinessCouponRequestDTO requireRequest(Long requestId) {
        if (requestId == null || requestId.longValue() <= 0L) {
            throw new IllegalStateException("Business coupon request id is invalid");
        }

        BusinessCouponRequestDTO request = dao.getBusinessCouponRequestById(requestId.longValue());
        if (request == null) {
            throw new IllegalStateException("Business coupon request not found");
        }
        return request;
    }

    private void saveHistory(
        BusinessCouponRequestDTO snapshot,
        String actionType,
        String actionRole,
        Integer actionByUserId,
        String commentText
    ) {
        BusinessCouponRequestHistoryDTO history = new BusinessCouponRequestHistoryDTO();
        history.setRequestId(snapshot.getRequestId());
        history.setActionType(actionType);
        history.setActionRole(actionRole);
        history.setActionByUserId(actionByUserId);
        history.setRequestVersion(snapshot.getRequestVersion());
        history.setCommentText(trimToNull(commentText));
        history.setSnapshotCouponName(snapshot.getCouponName());
        history.setSnapshotCouponDesc(snapshot.getCouponDescription());
        history.setSnapshotPricePoint(snapshot.getPricePoint());
        history.setSnapshotStock(snapshot.getStock());
        history.setSnapshotTargetStatus(snapshot.getTargetStatus());

        requireSingleRow(dao.saveBusinessCouponRequestHistory(history), "Failed to save business coupon request history");
    }

    private void normalizeRequest(BusinessCouponRequestDTO request) {
        request.setCouponName(request.getCouponName().trim());
        request.setCouponDescription(trimToNull(request.getCouponDescription()));
        request.setPricePoint(Integer.valueOf(Math.max(0, safeInt(request.getPricePoint(), 0))));
        request.setStock(Integer.valueOf(Math.max(0, safeInt(request.getStock(), 0))));
        request.setTargetStatus(normalizeTargetStatus(request.getTargetStatus()));
    }

    private boolean isRequestValid(BusinessCouponRequestDTO request) {
        return request != null
            && request.getBusinessId() != null
            && request.getBusinessId().intValue() > 0
            && request.getLocationId() != null
            && request.getLocationId().intValue() > 0
            && request.getAdminUserId() != null
            && request.getAdminUserId().intValue() > 0
            && !isBlank(request.getCouponName())
            && safeInt(request.getPricePoint(), -1) >= 0
            && safeInt(request.getStock(), -1) >= 0;
    }

    private boolean isClosedStatus(String status) {
        String normalized = trimToEmpty(status).toUpperCase(Locale.ROOT);
        return STATUS_ACCEPTED.equals(normalized) || STATUS_CANCELLED.equals(normalized);
    }

    private boolean isActionableBusinessRequest(String status) {
        return STATUS_REQUESTED.equals(trimToEmpty(status).toUpperCase(Locale.ROOT));
    }

    private String normalizeTargetStatus(String targetStatus) {
        String normalized = trimToEmpty(targetStatus).toUpperCase(Locale.ROOT);
        if ("SOLD_OUT".equals(normalized) || "HIDDEN".equals(normalized) || TARGET_STATUS_ON_SALE.equals(normalized)) {
            return normalized;
        }
        return TARGET_STATUS_ON_SALE;
    }

    private Long createRewardItemFromRequest(BusinessCouponRequestDTO request) {
        RewardItemDTO rewardItem = new RewardItemDTO();
        rewardItem.setName(request.getCouponName());
        rewardItem.setDescription(request.getCouponDescription());
        rewardItem.setPricePoint(safeInt(request.getPricePoint(), 0));
        rewardItem.setStock(safeInt(request.getStock(), 0));
        rewardItem.setStatus(normalizeTargetStatus(request.getTargetStatus()));
        rewardItem.setLocationId(request.getLocationId());
        rewardItem.setRequestId(request.getRequestId());
        rewardItem.setCouponScope("BUSINESS_LOCATION");

        requireSingleRow(rewardItemDAO.saveRewardItem(rewardItem), "Failed to create reward item from business coupon request");
        if (rewardItem.getRewardItemId() <= 0) {
            throw new IllegalStateException("Approved reward item id is invalid");
        }
        return Long.valueOf(rewardItem.getRewardItemId());
    }

    private Integer normalizeActionUserId(Integer actionByUserId, Integer fallbackUserId) {
        if (actionByUserId != null && actionByUserId.intValue() > 0) {
            return actionByUserId;
        }
        return fallbackUserId;
    }

    private void requireSingleRow(int affectedRows, String message) {
        if (affectedRows != 1) {
            throw new IllegalStateException(message);
        }
    }

    private int safeInt(Integer value, int fallback) {
        return value == null ? fallback : value.intValue();
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private String trimToNull(String value) {
        String trimmed = trimToEmpty(value);
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean isBlank(String value) {
        return trimToEmpty(value).isEmpty();
    }
}
