package com.app.controller.api.push;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.push.PushClickRequest;
import com.app.dto.push.PushDeactivateRequest;
import com.app.dto.push.PushDispatchResultDTO;
import com.app.dto.push.PushSettingRequest;
import com.app.dto.push.PushSubscriptionDTO;
import com.app.dto.push.PushSubscriptionRequest;
import com.app.dto.push.PushTestNotificationRequest;
import com.app.dto.push.UserNotificationSettingDTO;
import com.app.service.push.PushService;
import com.app.service.user.auth.JwtTokenProvider;

@RestController
@RequestMapping("/api/push")
public class PushAPIController {

    @Autowired
    private PushService pushService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @GetMapping("/config")
    public ResponseEntity<?> getPushConfig() {
        Map<String, Object> response = new HashMap<>();
        response.put("enabled", Boolean.valueOf(pushService.isPushEnabled()));
        response.put("publicKey", pushService.getPublicVapidKey());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/settings")
    public ResponseEntity<?> getNotificationSetting(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        Integer userId = resolveUserId(authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("message", "Unauthorized"));
        }

        UserNotificationSettingDTO setting = pushService.getNotificationSetting(userId.intValue());
        return ResponseEntity.ok(setting);
    }

    @PutMapping("/settings")
    public ResponseEntity<?> saveNotificationSetting(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestBody PushSettingRequest request
    ) {
        Integer userId = resolveUserId(authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("message", "Unauthorized"));
        }

        try {
            UserNotificationSettingDTO setting = pushService.saveNotificationSetting(userId.intValue(), request);
            return ResponseEntity.ok(setting);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @GetMapping("/subscriptions")
    public ResponseEntity<?> getActiveSubscriptions(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        Integer userId = resolveUserId(authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("message", "Unauthorized"));
        }

        List<PushSubscriptionDTO> subscriptions = pushService.getActiveSubscriptions(userId.intValue());
        return ResponseEntity.ok(subscriptions);
    }

    @PostMapping("/subscriptions")
    public ResponseEntity<?> saveSubscription(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestBody PushSubscriptionRequest request
    ) {
        Integer userId = resolveUserId(authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("message", "Unauthorized"));
        }

        try {
            PushSubscriptionDTO subscription = pushService.saveSubscription(userId.intValue(), request);
            return ResponseEntity.ok(subscription);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @DeleteMapping("/subscriptions")
    public ResponseEntity<?> deactivateSubscription(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestParam("endpoint") String endpoint
    ) {
        Integer userId = resolveUserId(authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("message", "Unauthorized"));
        }

        int updatedCount = pushService.deactivateSubscription(userId.intValue(), endpoint);
        return ResponseEntity.ok(Collections.singletonMap("updatedCount", Integer.valueOf(updatedCount)));
    }

    @PostMapping("/subscriptions/deactivate")
    public ResponseEntity<?> deactivateSubscriptionByBody(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestBody PushDeactivateRequest request
    ) {
        Integer userId = resolveUserId(authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("message", "Unauthorized"));
        }

        if (request == null || request.getEndpoint() == null || request.getEndpoint().trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Collections.singletonMap("message", "endpoint is required"));
        }

        int updatedCount = pushService.deactivateSubscription(userId.intValue(), request.getEndpoint());
        return ResponseEntity.ok(Collections.singletonMap("updatedCount", Integer.valueOf(updatedCount)));
    }

    @PostMapping("/test")
    public ResponseEntity<?> sendTestNotification(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestBody(required = false) PushTestNotificationRequest request
    ) {
        Integer userId = resolveUserId(authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("message", "Unauthorized"));
        }

        try {
            PushDispatchResultDTO result = pushService.sendTestNotification(userId.intValue(), request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap(
                    "message",
                    e.getMessage() == null ? "push test failed" : e.getMessage()
                ));
        }
    }

    @PostMapping("/click")
    public ResponseEntity<?> markNotificationClicked(@RequestBody PushClickRequest request) {
        if (request == null || request.getNotificationId() == null || request.getNotificationId().longValue() <= 0L) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "notificationId is required"));
        }

        int updatedCount = pushService.markNotificationClicked(request.getNotificationId().longValue());
        return ResponseEntity.ok(Collections.singletonMap("updatedCount", Integer.valueOf(updatedCount)));
    }

    private Integer resolveUserId(String authorizationHeader) {
        return jwtTokenProvider.resolveUserIdFromAuthorizationHeader(authorizationHeader);
    }
}
