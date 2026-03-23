package com.app.controller.api;

import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.businessinquiry.BusinessInquiryDTO;
import com.app.service.businessinquiry.BusinessInquiryService;

@RestController
@RequestMapping("/api/business-inquiries")
public class BusinessInquiryAPIController {

    @Autowired
    private BusinessInquiryService businessInquiryService;

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

        if (businessInquiry.getStatus() == null || businessInquiry.getStatus().trim().isEmpty()) {
            businessInquiry.setStatus("PENDING");
        }

        boolean created = businessInquiryService.saveBusinessInquiry(businessInquiry);
        if (!created) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("message", "failed to create inquiry"));
        }

        return ResponseEntity.ok(Collections.singletonMap("message", "success"));
    }
}
