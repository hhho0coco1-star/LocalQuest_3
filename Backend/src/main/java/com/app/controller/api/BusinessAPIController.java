package com.app.controller.api;

import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.business.BusinessDTO;
import com.app.dto.business.BusinessDashboardDTO;
import com.app.dto.business.BusinessOverviewDTO;
import com.app.dto.businesscouponrequest.BusinessCouponRequestDTO;
import com.app.dto.locationqr.BusinessQrInfoDTO;
import com.app.service.business.BusinessService;
import com.app.service.businesscouponrequest.BusinessCouponRequestService;
import com.app.service.locationqr.LocationQrService;
import com.app.service.user.auth.JwtTokenProvider;

@RestController
@RequestMapping("/api/businesses")
public class BusinessAPIController {
    private static final Logger log = LoggerFactory.getLogger(BusinessAPIController.class);
    private static final String FRONTEND_BASE_URL_PARAM = "lq.frontend.base-url";

    @Autowired
    private BusinessService businessService;

    @Autowired
    private BusinessCouponRequestService businessCouponRequestService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private LocationQrService locationQrService;

    @GetMapping("/me")
    public ResponseEntity<?> getMyBusinessOverview(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestParam(value = "businessId", required = false) Integer businessId,
        HttpServletRequest request
    ) {
        BusinessAccessContext accessContext = resolveBusinessAccessContext(
            authorizationHeader,
            businessId,
            "Business dashboard"
        );
        if (accessContext.hasError()) {
            return accessContext.getErrorResponse();
        }

        Integer userId = accessContext.getUserId();
        boolean isAdmin = accessContext.isAdmin();
        BusinessDTO business = accessContext.getBusiness();

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
        try {
            response.setQr(buildBusinessQrInfo(business.getBusinessId(), isAdmin, request));
        } catch (Exception qrError) {
            log.warn(
                "Business dashboard QR info unavailable. userId={}, businessId={}, reason={}",
                userId,
                business.getBusinessId(),
                qrError.getMessage()
            );
            response.setQr(null);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/qr")
    public ResponseEntity<?> getMyBusinessQr(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestParam(value = "businessId", required = false) Integer businessId,
        HttpServletRequest request
    ) {
        BusinessAccessContext accessContext = resolveBusinessAccessContext(
            authorizationHeader,
            businessId,
            "Business QR"
        );
        if (accessContext.hasError()) {
            return accessContext.getErrorResponse();
        }

        try {
            BusinessQrInfoDTO qrInfo = buildBusinessQrInfo(
                accessContext.getBusiness().getBusinessId(),
                accessContext.isAdmin(),
                request
            );
            return ResponseEntity.ok(qrInfo);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Collections.singletonMap("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            log.error(
                "Business QR load failed. userId={}, businessId={}",
                accessContext.getUserId(),
                accessContext.getBusiness().getBusinessId(),
                e
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("message", "QR 정보를 불러오지 못했습니다."));
        }
    }

    @GetMapping(value = "/me/qr/image", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<?> getMyBusinessQrImage(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestParam(value = "businessId", required = false) Integer businessId,
        @RequestParam(value = "size", defaultValue = "320") int size,
        HttpServletRequest request
    ) {
        BusinessAccessContext accessContext = resolveBusinessAccessContext(
            authorizationHeader,
            businessId,
            "Business QR image"
        );
        if (accessContext.hasError()) {
            return accessContext.getErrorResponse();
        }

        try {
            BusinessQrInfoDTO qrInfo = buildBusinessQrInfo(
                accessContext.getBusiness().getBusinessId(),
                accessContext.isAdmin(),
                request
            );
            if (!qrInfo.isActive()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Collections.singletonMap("message", "운영중지된 매장은 QR을 조회할 수 없습니다."));
            }

            byte[] qrImage = locationQrService.renderQrImage(qrInfo.getVerifyUrl(), size);
            return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.noCache())
                .body(qrImage);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Collections.singletonMap("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            log.error(
                "Business QR image load failed. userId={}, businessId={}",
                accessContext.getUserId(),
                accessContext.getBusiness().getBusinessId(),
                e
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("message", "QR 이미지를 생성하지 못했습니다."));
        }
    }

    @RequestMapping(value = "/me", method = { RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH })
    public ResponseEntity<?> updateMyBusiness(
        @RequestBody UpdateMyBusinessRequest request,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        Integer userId = jwtTokenProvider.resolveUserIdFromAuthorizationHeader(authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("message", "Unauthorized"));
        }

        if (request == null) {
            return ResponseEntity.badRequest()
                .body(Collections.singletonMap("message", "잘못된 요청입니다."));
        }

        BusinessDTO currentBusiness = businessService.getBusinessByUserId(userId.intValue());
        if (currentBusiness == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Collections.singletonMap("message", "등록된 비즈니스 정보가 없습니다."));
        }

        String businessName = normalizePatchString(request.getBusinessName(), currentBusiness.getBusinessName());
        String zipCode = normalizePatchString(request.getZipCode(), currentBusiness.getZipCode());
        String address = normalizePatchString(request.getAddress(), currentBusiness.getAddress());
        String addressDetail = normalizePatchString(request.getAddressDetail(), currentBusiness.getAddressDetail());
        String phone = normalizePatchString(request.getPhone(), currentBusiness.getPhone());
        String description = normalizePatchString(request.getDescription(), currentBusiness.getDescription());

        if (isBlank(businessName)) {
            return ResponseEntity.badRequest()
                .body(Collections.singletonMap("message", "매장명은 필수입니다."));
        }
        if (isBlank(zipCode)) {
            return ResponseEntity.badRequest()
                .body(Collections.singletonMap("message", "우편번호는 필수입니다."));
        }
        if (isBlank(address)) {
            return ResponseEntity.badRequest()
                .body(Collections.singletonMap("message", "매장 주소는 필수입니다."));
        }

        BusinessDTO updateTarget = new BusinessDTO();
        updateTarget.setBusinessId(currentBusiness.getBusinessId());
        updateTarget.setUserId(currentBusiness.getUserId());
        updateTarget.setBusinessName(businessName);
        updateTarget.setZipCode(zipCode);
        updateTarget.setAddress(address);
        updateTarget.setAddressDetail(addressDetail);
        updateTarget.setPhone(phone);
        updateTarget.setDescription(description);

        boolean updated = businessService.updateBusiness(updateTarget);
        if (!updated) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("message", "매장 정보 수정에 실패했습니다."));
        }

        BusinessDTO refreshed = businessService.getBusinessById(currentBusiness.getBusinessId());
        if (refreshed == null) {
            refreshed = updateTarget;
        }

        return ResponseEntity.ok(refreshed);
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

    private BusinessAccessContext resolveBusinessAccessContext(
        String authorizationHeader,
        Integer businessId,
        String logPrefix
    ) {
        Integer userId = jwtTokenProvider.resolveUserIdFromAuthorizationHeader(authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            log.warn("{} unauthorized request. userId={}", logPrefix, userId);
            return BusinessAccessContext.failure(
                ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Unauthorized"))
            );
        }

        String role = jwtTokenProvider.resolveRoleFromAuthorizationHeader(authorizationHeader);
        boolean isAdmin = "ADMIN".equalsIgnoreCase(normalizeRole(role));

        if (businessId != null && businessId.intValue() > 0 && !isAdmin) {
            log.warn(
                "{} forbidden businessId override. userId={}, role={}, businessId={}",
                logPrefix,
                userId,
                role,
                businessId
            );
            return BusinessAccessContext.failure(
                ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("message", "Access denied"))
            );
        }

        BusinessDTO business = resolveDashboardBusiness(userId.intValue(), businessId, isAdmin);
        if (business == null) {
            log.warn(
                "{} business not found. userId={}, role={}, requestedBusinessId={}",
                logPrefix,
                userId,
                role,
                businessId
            );
            return BusinessAccessContext.failure(
                ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("message", "Business not found"))
            );
        }

        return BusinessAccessContext.success(userId, isAdmin, business);
    }

    private BusinessDTO resolveDashboardBusiness(int userId, Integer requestedBusinessId, boolean isAdmin) {
        if (requestedBusinessId != null && requestedBusinessId.intValue() > 0) {
            return businessService.getBusinessById(requestedBusinessId.intValue());
        }

        BusinessDTO mine = businessService.getBusinessByUserId(userId);
        if (mine != null || !isAdmin) {
            return mine;
        }

        // Admin preview fallback: if admin has no linked business, show the latest one.
        Map<String, Object> params = new HashMap<>();
        params.put("keyword", null);
        params.put("userId", null);
        List<BusinessDTO> businesses = businessService.getBusinessList(params);
        if (businesses == null || businesses.isEmpty()) {
            return null;
        }
        return businesses.get(0);
    }

    private BusinessQrInfoDTO buildBusinessQrInfo(int businessId, boolean includeBusinessIdParam, HttpServletRequest request) {
        BusinessQrInfoDTO qrInfo = locationQrService.getOrCreateBusinessQrInfo(businessId);
        String verifyUrl = locationQrService.buildQrVerifyUrl(resolveFrontendBaseUrl(request), qrInfo.getQrAuthKey());
        qrInfo.setVerifyUrl(verifyUrl);
        StringBuilder imageUrl = new StringBuilder();
        imageUrl.append(request.getContextPath()).append("/api/businesses/me/qr/image");
        if (includeBusinessIdParam) {
            imageUrl.append("?businessId=").append(businessId).append("&v=").append(qrInfo.getQrId());
        } else {
            imageUrl.append("?v=").append(qrInfo.getQrId());
        }
        qrInfo.setImageUrl(imageUrl.toString());
        return qrInfo;
    }

    private String resolveFrontendBaseUrl(HttpServletRequest request) {
        String configuredBaseUrl = request.getServletContext().getInitParameter(FRONTEND_BASE_URL_PARAM);
        if (configuredBaseUrl != null && !configuredBaseUrl.trim().isEmpty()) {
            return configuredBaseUrl.trim().replaceAll("/+$", "");
        }

        int frontendPort = request.getServerPort();
        if (frontendPort == 8080) {
            frontendPort = 3000;
        }

        StringBuilder baseUrl = new StringBuilder();
        baseUrl.append(request.getScheme())
            .append("://")
            .append(request.getServerName());

        if (frontendPort != 80 && frontendPort != 443) {
            baseUrl.append(':').append(frontendPort);
        }

        return baseUrl.toString();
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return "";
        }
        String normalized = role.trim().toUpperCase(Locale.ROOT);
        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring("ROLE_".length());
        }
        return normalized;
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
                    || upper.contains("LQ_REWARD_EXCHANGE")
                    || upper.contains("ORA-00942")
                    || upper.contains("TABLE OR VIEW DOES NOT EXIST")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }

    private String normalizePatchString(String incoming, String fallback) {
        if (incoming == null) {
            return fallback;
        }

        String trimmed = incoming.trim();
        return trimmed;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static final class BusinessAccessContext {
        private final Integer userId;
        private final boolean admin;
        private final BusinessDTO business;
        private final ResponseEntity<?> errorResponse;

        private BusinessAccessContext(
            Integer userId,
            boolean admin,
            BusinessDTO business,
            ResponseEntity<?> errorResponse
        ) {
            this.userId = userId;
            this.admin = admin;
            this.business = business;
            this.errorResponse = errorResponse;
        }

        private static BusinessAccessContext success(Integer userId, boolean admin, BusinessDTO business) {
            return new BusinessAccessContext(userId, admin, business, null);
        }

        private static BusinessAccessContext failure(ResponseEntity<?> errorResponse) {
            return new BusinessAccessContext(null, false, null, errorResponse);
        }

        private boolean hasError() {
            return errorResponse != null;
        }

        private Integer getUserId() {
            return userId;
        }

        private boolean isAdmin() {
            return admin;
        }

        private BusinessDTO getBusiness() {
            return business;
        }

        private ResponseEntity<?> getErrorResponse() {
            return errorResponse;
        }
    }

    public static class UpdateMyBusinessRequest {
        private String businessName;
        private String zipCode;
        private String address;
        private String addressDetail;
        private String phone;
        private String description;

        public String getBusinessName() {
            return businessName;
        }

        public void setBusinessName(String businessName) {
            this.businessName = businessName;
        }

        public String getZipCode() {
            return zipCode;
        }

        public void setZipCode(String zipCode) {
            this.zipCode = zipCode;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }

        public String getAddressDetail() {
            return addressDetail;
        }

        public void setAddressDetail(String addressDetail) {
            this.addressDetail = addressDetail;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }
}
