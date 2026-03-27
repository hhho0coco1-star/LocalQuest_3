package com.app.controller.api;

import java.util.Collections;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.app.dto.business.BusinessDTO;
import com.app.dto.business.BusinessDashboardDTO;
import com.app.dto.business.BusinessOverviewDTO;
import com.app.service.business.BusinessService;
import com.app.service.user.auth.JwtTokenProvider;

@RestController
@RequestMapping("/api/businesses")
public class BusinessAPIController {
    private static final Logger log = LoggerFactory.getLogger(BusinessAPIController.class);

    @Autowired
    private BusinessService businessService;

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
