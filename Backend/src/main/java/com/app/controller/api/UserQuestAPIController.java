package com.app.controller.api;

import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.app.dto.userquest.UserQuestOverviewDTO;
import com.app.service.user.auth.LoginUserResolver;
import com.app.service.userquest.UserQuestService;

@RestController
@RequestMapping("/api/user-quests")
public class UserQuestAPIController {

    @Autowired
    private UserQuestService userQuestService;

    @Autowired
    private LoginUserResolver loginUserResolver;

    @PostMapping("/accept")
    public ResponseEntity<?> acceptQuest(
        HttpSession session,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestParam int questId
    ) {
        Integer userId = loginUserResolver.resolveUserId(session, authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login required");
        }

        return ResponseEntity.ok(userQuestService.acceptQuest(userId.intValue(), questId));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyQuestOverview(
        HttpSession session,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        Integer userId = loginUserResolver.resolveUserId(session, authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login required");
        }

        UserQuestOverviewDTO overview = userQuestService.getUserQuestOverview(userId.intValue());
        return ResponseEntity.ok(overview);
    }

    @GetMapping("/me/{userQuestId}")
    public ResponseEntity<?> getMyQuestDetail(
        HttpSession session,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @PathVariable int userQuestId
    ) {
        Integer userId = loginUserResolver.resolveUserId(session, authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login required");
        }

        com.app.dto.userquest.UserQuestDetailDTO detail =
            userQuestService.getUserQuestDetail(userId.intValue(), userQuestId);
        if (detail == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User quest not found");
        }
        return ResponseEntity.ok(detail);
    }

    @PostMapping("/me/{userQuestId}/complete")
    public ResponseEntity<?> completeQuest(
        HttpSession session,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @PathVariable int userQuestId
    ) {
        Integer userId = loginUserResolver.resolveUserId(session, authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login required");
        }

        try {
            return ResponseEntity.ok(userQuestService.completeQuest(userId.intValue(), userQuestId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(java.util.Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/me/{userQuestId}/cancel")
    public ResponseEntity<?> cancelQuest(
        HttpSession session,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @PathVariable int userQuestId
    ) {
        Integer userId = loginUserResolver.resolveUserId(session, authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login required");
        }

        try {
            return ResponseEntity.ok(userQuestService.cancelQuest(userId.intValue(), userQuestId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(java.util.Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping(
        value = "/me/{userQuestId}/locations/{questLocationId}/receipt-verification",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> verifyReceipt(
        HttpSession session,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @PathVariable int userQuestId,
        @PathVariable int questLocationId,
        @RequestParam("receiptImage") MultipartFile receiptImage
    ) {
        Integer userId = loginUserResolver.resolveUserId(session, authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login required");
        }

        try {
            return ResponseEntity.ok(
                userQuestService.verifyReceiptAndCompleteLocation(
                    userId.intValue(),
                    userQuestId,
                    questLocationId,
                    receiptImage
                )
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Collections.singletonMap("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/me/{userQuestId}/locations/{questLocationId}/gps-verification")
    public ResponseEntity<?> verifyGps(
        HttpSession session,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @PathVariable int userQuestId,
        @PathVariable int questLocationId,
        @RequestParam("latitude") Double latitude,
        @RequestParam("longitude") Double longitude
    ) {
        Integer userId = loginUserResolver.resolveUserId(session, authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login required");
        }

        try {
            return ResponseEntity.ok(
                userQuestService.verifyGpsAndCompleteLocation(
                    userId.intValue(),
                    userQuestId,
                    questLocationId,
                    latitude,
                    longitude
                )
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Collections.singletonMap("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/me/{userQuestId}/locations/{questLocationId}/qr-verification")
    public ResponseEntity<?> verifyQr(
        HttpSession session,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @PathVariable int userQuestId,
        @PathVariable int questLocationId,
        @RequestParam("qrAuthKey") String qrAuthKey
    ) {
        Integer userId = loginUserResolver.resolveUserId(session, authorizationHeader);
        if (userId == null || userId.intValue() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login required");
        }

        try {
            return ResponseEntity.ok(
                userQuestService.verifyQrAndCompleteLocation(
                    userId.intValue(),
                    userQuestId,
                    questLocationId,
                    qrAuthKey
                )
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Collections.singletonMap("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Collections.singletonMap("message", e.getMessage()));
        }
    }
}
