package com.app.controller.api;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;

import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.auth.SessionAuthKeys;
import com.app.service.userquest.UserQuestService;

@RestController
@RequestMapping("/api/qr")
public class QrAPIController {

    @Autowired
    private UserQuestService userQuestService;

    @PostMapping("/verify")
    public ResponseEntity<?> verifyQr(
        @RequestParam("qrAuthKey") String qrAuthKey,
        HttpSession session) {
        Integer loginUserId = resolveLoginUserId(session);
        if (loginUserId == null || loginUserId <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(messageBody("\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4\u002E"));
        }

        try {
            return ResponseEntity.ok(userQuestService.verifyLocationQr(loginUserId, qrAuthKey));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(messageBody(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(messageBody(e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(messageBody(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(messageBody("\u0051\u0052 \uC778\uC99D \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4\u002E"));
        }
    }

    private Integer resolveLoginUserId(HttpSession session) {
        if (session == null) {
            return null;
        }

        Object sessionUserId = session.getAttribute(SessionAuthKeys.USER_ID);
        if (sessionUserId instanceof Number) {
            return ((Number) sessionUserId).intValue();
        }

        if (sessionUserId instanceof String) {
            try {
                return Integer.parseInt(((String) sessionUserId).trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }

        return null;
    }

    private Map<String, String> messageBody(String message) {
        Map<String, String> response = new LinkedHashMap<>();
        response.put("message", message);
        return response;
    }
}
