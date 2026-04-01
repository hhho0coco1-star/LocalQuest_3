package com.app.controller.api;

import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.app.dto.business.BusinessDTO;
import com.app.dto.business.BusinessDashboardDTO;
import com.app.dto.business.BusinessOverviewDTO;
import com.app.dto.businesscouponrequest.BusinessCouponRequestDTO;
import com.app.service.business.BusinessService;
import com.app.service.businesscouponrequest.BusinessCouponRequestService;
import com.app.service.user.auth.JwtTokenProvider;

@RestController
@RequestMapping("/api/businesses")
public class BusinessAPIController {
    private static final Logger log = LoggerFactory.getLogger(BusinessAPIController.class);

    @Autowired
    private BusinessService businessService;

    @Autowired
    private BusinessCouponRequestService businessCouponRequestService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @GetMapping("/me")
    public ResponseEntity<?> getMyBusinessOverview(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        Integer userId = jwtTokenProvider.resolveUserIdFromAuthorizationHeader(authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            log.warn("Business dashboard unauthorized request. userId={}", userId);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("message", "Unauthorized"));
        }

        BusinessDTO business = businessService.getBusinessByUserId(userId.intValue());
        if (business == null) {
            log.warn("Business dashboard business not found. userId={}", userId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Collections.singletonMap("message", "Business not found"));
        }

        log.info(
            "Business dashboard request accepted. userId={}, businessId={}",
            userId,
            business.getBusinessId()
        );

        BusinessDashboardDTO dashboard = new BusinessDashboardDTO();
        dashboard.setHourlyAuthCounts(Collections.emptyList());
        try {
            BusinessDashboardDTO fetched = businessService.getBusinessDashboardByBusinessId(business.getBusinessId());
            if (fetched != null) {
                dashboard = fetched;
            }

            if (dashboard.getHourlyAuthCounts() == null) {
                dashboard.setHourlyAuthCounts(Collections.emptyList());
            }

            dashboard.setHourlyAuthCounts(
                businessService.getBusinessHourlyAuthCounts(business.getBusinessId())
            );
        } catch (Exception e) {
            if (!isAuthLogUnavailable(e)) {
                log.error(
                    "Business dashboard load failed. userId={}, businessId={}",
                    userId,
                    business.getBusinessId(),
                    e
                );
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "Failed to load business dashboard"));
            }
            log.warn(
                "Business auth log table unavailable. userId={}, businessId={}, reason={}",
                userId,
                business.getBusinessId(),
                e.getMessage()
            );
        }

        int hourlyPointCount = dashboard.getHourlyAuthCounts() == null ? 0 : dashboard.getHourlyAuthCounts().size();
        log.info(
            "Business dashboard loaded. userId={}, businessId={}, totalAuthCount={}, qrAuthCount={}, receiptAuthCount={}, hourlyPoints={}",
            userId,
            business.getBusinessId(),
            dashboard.getTotalAuthCount(),
            dashboard.getQrAuthCount(),
            dashboard.getReceiptAuthCount(),
            hourlyPointCount
        );

        BusinessOverviewDTO response = new BusinessOverviewDTO();
        response.setBusiness(business);
        response.setDashboard(dashboard);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/coupon-requests")
    public ResponseEntity<?> getMyBusinessCouponRequestList(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestParam(value = "requestStatus", required = false) String requestStatus
    ) {
        Integer userId = jwtTokenProvider.resolveUserIdFromAuthorizationHeader(authorizationHeader);
        if (!isAuthorizedUser(userId)) {
            return buildErrorResponse(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        BusinessDTO business = businessService.getBusinessByUserId(userId.intValue());
        if (business == null) {
            return buildErrorResponse(HttpStatus.NOT_FOUND, "Business not found");
        }

        Map<String, Object> params = new HashMap<>();
        params.put("businessUserId", userId);
        params.put("requestStatus", normalizeNullable(requestStatus));

        List<BusinessCouponRequestDTO> requests = businessCouponRequestService.getBusinessCouponRequestList(params);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("requests", requests == null ? Collections.emptyList() : requests);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/coupon-requests/{requestId}")
    public ResponseEntity<?> getMyBusinessCouponRequestDetail(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @PathVariable("requestId") long requestId
    ) {
        Integer userId = jwtTokenProvider.resolveUserIdFromAuthorizationHeader(authorizationHeader);
        if (!isAuthorizedUser(userId)) {
            return buildErrorResponse(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        BusinessDTO business = businessService.getBusinessByUserId(userId.intValue());
        if (business == null) {
            return buildErrorResponse(HttpStatus.NOT_FOUND, "Business not found");
        }

        BusinessCouponRequestDTO request = businessCouponRequestService.getBusinessCouponRequestById(requestId);
        if (!isRequestOwnedByBusiness(request, business, userId)) {
            return buildErrorResponse(HttpStatus.NOT_FOUND, "Coupon request not found");
        }

        return ResponseEntity.ok(buildCouponRequestDetailResponse(requestId));
    }

    @PostMapping("/me/coupon-requests/{requestId}/hold")
    public ResponseEntity<?> holdMyBusinessCouponRequest(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @PathVariable("requestId") long requestId,
        @RequestBody(required = false) Map<String, Object> payload
    ) {
        Integer userId = jwtTokenProvider.resolveUserIdFromAuthorizationHeader(authorizationHeader);
        if (!isAuthorizedUser(userId)) {
            return buildErrorResponse(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        BusinessDTO business = businessService.getBusinessByUserId(userId.intValue());
        if (business == null) {
            return buildErrorResponse(HttpStatus.NOT_FOUND, "Business not found");
        }

        BusinessCouponRequestDTO request = businessCouponRequestService.getBusinessCouponRequestById(requestId);
        if (!isRequestOwnedByBusiness(request, business, userId)) {
            return buildErrorResponse(HttpStatus.NOT_FOUND, "Coupon request not found");
        }

        String holdReason = normalizePayloadText(payload, "holdReason");
        if (holdReason == null) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, "Hold reason is required");
        }

        try {
            boolean held = businessCouponRequestService.holdBusinessCouponRequest(requestId, userId, holdReason);
            if (!held) {
                return buildErrorResponse(HttpStatus.CONFLICT, "Coupon request cannot be held");
            }
            return ResponseEntity.ok(buildCouponRequestDetailResponse(requestId));
        } catch (Exception e) {
            log.error("Business coupon request hold failed. userId={}, requestId={}", userId, requestId, e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to hold coupon request");
        }
    }

    @PostMapping("/me/coupon-requests/{requestId}/accept")
    public ResponseEntity<?> acceptMyBusinessCouponRequest(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @PathVariable("requestId") long requestId
    ) {
        Integer userId = jwtTokenProvider.resolveUserIdFromAuthorizationHeader(authorizationHeader);
        if (!isAuthorizedUser(userId)) {
            return buildErrorResponse(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        BusinessDTO business = businessService.getBusinessByUserId(userId.intValue());
        if (business == null) {
            return buildErrorResponse(HttpStatus.NOT_FOUND, "Business not found");
        }

        BusinessCouponRequestDTO request = businessCouponRequestService.getBusinessCouponRequestById(requestId);
        if (!isRequestOwnedByBusiness(request, business, userId)) {
            return buildErrorResponse(HttpStatus.NOT_FOUND, "Coupon request not found");
        }

        try {
            boolean accepted = businessCouponRequestService.acceptBusinessCouponRequest(requestId, userId, null);
            if (!accepted) {
                return buildErrorResponse(HttpStatus.CONFLICT, "Coupon request cannot be accepted");
            }
            return ResponseEntity.ok(buildCouponRequestDetailResponse(requestId));
        } catch (Exception e) {
            log.error("Business coupon request accept failed. userId={}, requestId={}", userId, requestId, e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to accept coupon request");
        }
    }

    private boolean isAuthorizedUser(Integer userId) {
        return userId != null && userId.intValue() > 0;
    }

    private boolean isRequestOwnedByBusiness(BusinessCouponRequestDTO request, BusinessDTO business, Integer userId) {
        if (request == null || business == null || userId == null) {
            return false;
        }

        if (request.getBusinessId() != null && request.getBusinessId().intValue() == business.getBusinessId()) {
            return true;
        }

        return request.getBusinessUserId() != null && request.getBusinessUserId().intValue() == userId.intValue();
    }

    private Map<String, Object> buildCouponRequestDetailResponse(long requestId) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("request", businessCouponRequestService.getBusinessCouponRequestById(requestId));
        response.put("history", businessCouponRequestService.getBusinessCouponRequestHistoryList(requestId));
        return response;
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(HttpStatus status, String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", message);
        return ResponseEntity.status(status).body(response);
    }

    private String normalizePayloadText(Map<String, Object> payload, String key) {
        if (payload == null || key == null) {
            return null;
        }

        Object value = payload.get(key);
        return value == null ? null : normalizeNullable(String.valueOf(value));
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean isAuthLogUnavailable(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                String upper = message.toUpperCase(Locale.ROOT);
                if (upper.contains("LQ_BUSINESS_AUTH_LOG")
                    || upper.contains("ORA-00942")
                    || upper.contains("TABLE OR VIEW DOES NOT EXIST")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }
}
