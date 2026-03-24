package com.app.controller.api;

import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.app.auth.SessionAuthKeys;
import com.app.dto.userquest.UserQuestOverviewDTO;
import com.app.service.userquest.UserQuestService;

@RestController
@RequestMapping("/api/user-quests")
public class UserQuestAPIController {

    @Autowired
    private UserQuestService userQuestService;

    @GetMapping("/me")
    public ResponseEntity<?> getMyQuestOverview(HttpSession session) {
        if (session == null || session.getAttribute(SessionAuthKeys.USER_ID) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login required");
        }

        int userId = ((Number) session.getAttribute(SessionAuthKeys.USER_ID)).intValue();
        UserQuestOverviewDTO overview = userQuestService.getUserQuestOverview(userId);
        return ResponseEntity.ok(overview);
    }

    @GetMapping("/me/{userQuestId}")
    public ResponseEntity<?> getMyQuestDetail(HttpSession session, @PathVariable int userQuestId) {
        if (session == null || session.getAttribute(SessionAuthKeys.USER_ID) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login required");
        }

        int userId = ((Number) session.getAttribute(SessionAuthKeys.USER_ID)).intValue();
        com.app.dto.userquest.UserQuestDetailDTO detail = userQuestService.getUserQuestDetail(userId, userQuestId);
        if (detail == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User quest not found");
        }
        return ResponseEntity.ok(detail);
    }

    @PostMapping(
        value = "/me/{userQuestId}/locations/{questLocationId}/receipt-verification",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> verifyReceipt(
        HttpSession session,
        @PathVariable int userQuestId,
        @PathVariable int questLocationId,
        @RequestParam("receiptImage") MultipartFile receiptImage
    ) {
        if (session == null || session.getAttribute(SessionAuthKeys.USER_ID) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login required");
        }

        int userId = ((Number) session.getAttribute(SessionAuthKeys.USER_ID)).intValue();
        try {
            return ResponseEntity.ok(
                userQuestService.verifyReceiptAndCompleteLocation(
                    userId,
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
}
