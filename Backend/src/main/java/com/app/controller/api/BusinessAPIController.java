package com.app.controller.api;

import java.util.Collections;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
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
