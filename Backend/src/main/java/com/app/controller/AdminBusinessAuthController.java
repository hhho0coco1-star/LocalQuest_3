package com.app.controller;

import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.app.dto.business.BusinessDTO;
import com.app.service.business.BusinessService;

@Controller
@RequestMapping("/admin/store-info")
public class AdminBusinessAuthController {

    private static final DateTimeFormatter AUTH_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Autowired
    private BusinessService businessService;

    @GetMapping("/auth-detail")
    @ResponseBody
    public ResponseEntity<?> getBusinessAuthDetail(@RequestParam int businessId) {
        try {
            BusinessDTO business = businessService.getBusinessById(businessId);
            if (business == null) {
                throw new NoSuchElementException("\uB9E4\uC7A5 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
            }

            try {
                Map<String, Object> summary = businessService.getBusinessAuthSummary(businessId);
                return ResponseEntity.ok(buildResponse(
                    businessId,
                    business.getBusinessName(),
                    summary != null ? summary : createEmptySummary(businessId)
                ));
            } catch (Exception e) {
                if (isBusinessAuthStorageUnavailable(e)) {
                    return ResponseEntity.ok(buildResponse(
                        businessId,
                        business.getBusinessName(),
                        createEmptySummary(businessId)
                    ));
                }
                throw e;
            }
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("message", "\uBE44\uC9C0\uB2C8\uC2A4 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."));
        }
    }

    private Map<String, Object> createEmptySummary(int businessId) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("businessId", businessId);
        summary.put("totalAuthCount", 0);
        summary.put("qrAuthCount", 0);
        summary.put("receiptAuthCount", 0);
        summary.put("totalPaymentAmount", 0L);
        summary.put("totalSettlementAmount", 0L);
        summary.put("lastAuthAt", null);
        summary.put("uniqueUserCount", 0);
        summary.put("uniqueLocationCount", 0);
        return summary;
    }

    private Map<String, Object> buildResponse(
        int businessId,
        String businessName,
        Map<String, Object> summary
    ) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("businessId", businessId);
        response.put("businessName", businessName);
        response.put("summary", toResponseSummary(summary));
        return response;
    }

    private Map<String, Object> toResponseSummary(Map<String, Object> summary) {
        Map<String, Object> responseSummary = new LinkedHashMap<>();
        responseSummary.put("businessId", summary.get("businessId"));
        responseSummary.put("totalAuthCount", summary.get("totalAuthCount"));
        responseSummary.put("qrAuthCount", summary.get("qrAuthCount"));
        responseSummary.put("receiptAuthCount", summary.get("receiptAuthCount"));
        responseSummary.put("totalPaymentAmount", summary.get("totalPaymentAmount"));
        responseSummary.put("totalSettlementAmount", summary.get("totalSettlementAmount"));
        responseSummary.put("lastAuthAt", normalizeDateValue(summary.get("lastAuthAt")));
        responseSummary.put("uniqueUserCount", summary.get("uniqueUserCount"));
        responseSummary.put("uniqueLocationCount", summary.get("uniqueLocationCount"));
        return responseSummary;
    }

    private Object normalizeDateValue(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof java.time.LocalDateTime) {
            return ((java.time.LocalDateTime) value).format(AUTH_TIME_FORMATTER);
        }

        return value;
    }

    private boolean isBusinessAuthStorageUnavailable(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                String upperMessage = message.toUpperCase(Locale.ROOT);
                if (upperMessage.contains("LQ_BUSINESS_AUTH_LOG")
                    || upperMessage.contains("LQ_LOCATION")
                    || upperMessage.contains("ORA-00942")
                    || upperMessage.contains("TABLE OR VIEW DOES NOT EXIST")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }
}
