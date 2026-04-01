package com.app.controller.api;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.businessinquiry.BusinessInquiryDTO;
import com.app.service.businessinquiry.BusinessInquiryService;

@RestController
@RequestMapping("/api/business-inquiries")
public class BusinessInquiryAPIController {

    @Autowired
    private BusinessInquiryService businessInquiryService;

    @GetMapping("/latest")
    public ResponseEntity<?> getLatestBusinessInquiry(@RequestParam int userId) {
        if (userId <= 0) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "userId is required"));
        }

        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);

        List<BusinessInquiryDTO> inquiryList = businessInquiryService.getBusinessInquiryList(params);
        if (inquiryList == null || inquiryList.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(inquiryList.get(0));
    }

    @PostMapping
    public ResponseEntity<?> createBusinessInquiry(@RequestBody BusinessInquiryDTO businessInquiry) {
        if (businessInquiry.getUserId() <= 0) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "userId is required"));
        }
        if (businessInquiry.getTitle() == null || businessInquiry.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "title is required"));
        }
        if (businessInquiry.getContent() == null || businessInquiry.getContent().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "content is required"));
        }
        if (businessInquiry.getPhone() == null || businessInquiry.getPhone().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "phone is required"));
        }
        if (businessInquiry.getZipCode() == null || businessInquiry.getZipCode().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "zipCode is required"));
        }
        if (businessInquiry.getAddress() == null || businessInquiry.getAddress().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "address is required"));
        }
        if (businessInquiry.getLatitude() == null || businessInquiry.getLongitude() == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "latitude and longitude are required"));
        }

        if (businessInquiry.getStatus() == null || businessInquiry.getStatus().trim().isEmpty()) {
            businessInquiry.setStatus("PENDING");
        }
        if (businessInquiry.getLocationType() == null || businessInquiry.getLocationType().trim().isEmpty()) {
            businessInquiry.setLocationType("ROAD_ADDRESS");
        }

        boolean created = businessInquiryService.saveBusinessInquiry(businessInquiry);
        if (!created) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("message", "failed to create inquiry"));
        }

        return ResponseEntity.ok(Collections.singletonMap("message", "success"));
    }
}
