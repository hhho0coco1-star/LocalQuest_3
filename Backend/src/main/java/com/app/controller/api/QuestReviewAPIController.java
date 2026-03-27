package com.app.controller.api;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.auth.SessionAuthKeys;
import com.app.dto.questreview.QuestReviewDTO;
import com.app.dto.questreview.QuestReviewListItemDTO;
import com.app.dto.reward.RewardBadgeDTO;
import com.app.service.questreview.QuestReviewService;

@RestController
@RequestMapping("/api/quests")
public class QuestReviewAPIController {
    private static final String ROLE_ADMIN = "ADMIN";

    @Autowired
    private QuestReviewService questReviewService;

    @GetMapping("/{questId}/reviews")
    public ResponseEntity<List<QuestReviewListItemDTO>> getQuestReviews(@PathVariable("questId") int questId) {
        try {
            return ResponseEntity.ok(questReviewService.getQuestReviewsByQuestId(questId));
        } catch (Exception exception) {
            if (isQuestReviewStorageUnavailable(exception)) {
                return ResponseEntity.ok(Collections.emptyList());
            }
            throw exception;
        }
    }

    @GetMapping("/reviews/me")
    public ResponseEntity<?> getMyQuestReviews(HttpSession session) {
        Integer loginUserId = resolveLoginUserId(session);
        if (loginUserId == null || loginUserId <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(messageBody("\uB85C\uADF8\uC778\uD55C\u0020\uC0AC\uC6A9\uC790\uB9CC\u0020\uB9AC\uBDF0\u0020\uBAA9\uB85D\uC744\u0020\uBCFC\u0020\uC218\u0020\uC788\uC2B5\uB2C8\uB2E4\u002E"));
        }

        try {
            return ResponseEntity.ok(questReviewService.getQuestReviewsByUserId(loginUserId));
        } catch (Exception exception) {
            if (isQuestReviewStorageUnavailable(exception)) {
                return ResponseEntity.ok(Collections.emptyList());
            }
            throw exception;
        }
    }

    @PostMapping("/{questId}/reviews")
    public ResponseEntity<?> createQuestReview(
        @PathVariable("questId") int questId,
        @RequestBody QuestReviewDTO questReview,
        HttpSession session
    ) {
        Integer loginUserId = resolveLoginUserId(session);
        if (loginUserId == null || loginUserId <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(messageBody("\uB85C\uADF8\uC778\uD55C\u0020\uC0AC\uC6A9\uC790\uB9CC\u0020\uB9AC\uBDF0\uB97C\u0020\uC791\uC131\uD560\u0020\uC218\u0020\uC788\uC2B5\uB2C8\uB2E4\u002E"));
        }

        if (questReview.getRating() < 1 || questReview.getRating() > 5) {
            return ResponseEntity.badRequest().body(messageBody("\uBCC4\uC810\uC740\u0020\u0031\uC810\uBD80\uD130\u0020\u0035\uC810\uAE4C\uC9C0\u0020\uC785\uB825\uD574\uC8FC\uC138\uC694\u002E"));
        }

        String content = questReview.getContent() == null ? "" : questReview.getContent().trim();
        if (content.isEmpty()) {
            return ResponseEntity.badRequest().body(messageBody("\uB9AC\uBDF0\u0020\uB0B4\uC6A9\uC744\u0020\uC785\uB825\uD574\uC8FC\uC138\uC694\u002E"));
        }

        questReview.setUserId(loginUserId);
        questReview.setQuestId(questId);
        questReview.setContent(content);

        try {
            List<RewardBadgeDTO> newlyAwardedBadges = questReviewService.saveQuestReview(questReview);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("message", "\uB9AC\uBDF0\uAC00\u0020\uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4\u002E");
            response.put("newlyAwardedBadges", newlyAwardedBadges);

            return ResponseEntity.ok(response);
        } catch (DuplicateKeyException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(messageBody("\uC774\uBBF8\u0020\uD574\uB2F9\u0020\uD018\uC2A4\uD2B8\uC5D0\u0020\uB9AC\uBDF0\uB97C\u0020\uC791\uC131\uD588\uC2B5\uB2C8\uB2E4\u002E"));
        } catch (IllegalStateException exception) {
            if (isQuestReviewStorageUnavailable(exception)) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(messageBody("\uB9AC\uBDF0\u0020\uAE30\uB2A5\uC5D0\u0020\uD544\uC694\uD55C\u0020\uD14C\uC774\uBE14\uC744\u0020\uCC3E\uC9C0\u0020\uBABB\uD588\uC2B5\uB2C8\uB2E4\u002E"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(messageBody("\uB9AC\uBDF0\u0020\uB4F1\uB85D\u0020\uC911\u0020\uBB38\uC81C\uAC00\u0020\uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4\u002E"));
        } catch (Exception exception) {
            if (isQuestReviewStorageUnavailable(exception)) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(messageBody("\uB9AC\uBDF0\u0020\uAE30\uB2A5\uC5D0\u0020\uD544\uC694\uD55C\u0020\uD14C\uC774\uBE14\uC744\u0020\uCC3E\uC9C0\u0020\uBABB\uD588\uC2B5\uB2C8\uB2E4\u002E"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(messageBody("\uB9AC\uBDF0\u0020\uB4F1\uB85D\u0020\uC911\u0020\uBB38\uC81C\uAC00\u0020\uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4\u002E"));
        }
    }

    @PutMapping("/{questId}/reviews/{reviewId}")
    public ResponseEntity<?> updateQuestReview(
        @PathVariable("questId") int questId,
        @PathVariable("reviewId") int reviewId,
        @RequestBody QuestReviewDTO questReview,
        HttpSession session
    ) {
        Integer loginUserId = resolveLoginUserId(session);
        if (loginUserId == null || loginUserId <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(messageBody("\uB85C\uADF8\uC778\uD55C\u0020\uC0AC\uC6A9\uC790\uB9CC\u0020\uB9AC\uBDF0\uB97C\u0020\uC218\uC815\uD560\u0020\uC218\u0020\uC788\uC2B5\uB2C8\uB2E4\u002E"));
        }

        if (questReview.getRating() < 1 || questReview.getRating() > 5) {
            return ResponseEntity.badRequest().body(messageBody("\uBCC4\uC810\uC740\u0020\u0031\uC810\uBD80\uD130\u0020\u0035\uC810\uAE4C\uC9C0\u0020\uC785\uB825\uD574\uC8FC\uC138\uC694\u002E"));
        }

        String content = questReview.getContent() == null ? "" : questReview.getContent().trim();
        if (content.isEmpty()) {
            return ResponseEntity.badRequest().body(messageBody("\uB9AC\uBDF0\u0020\uB0B4\uC6A9\uC744\u0020\uC785\uB825\uD574\uC8FC\uC138\uC694\u002E"));
        }

        questReview.setUserId(loginUserId);
        questReview.setQuestId(questId);
        questReview.setReviewId(reviewId);
        questReview.setContent(content);

        try {
            int updated = isAdmin(session)
                ? questReviewService.updateQuestReviewAsAdmin(questReview)
                : questReviewService.updateQuestReview(questReview);
            if (updated <= 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(messageBody("\uC218\uC815\uD560\u0020\uB9AC\uBDF0\uB97C\u0020\uCC3E\uC9C0\u0020\uBABB\uD588\uC2B5\uB2C8\uB2E4\u002E"));
            }

            return ResponseEntity.ok(messageBody("\uB9AC\uBDF0\uAC00\u0020\uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4\u002E"));
        } catch (Exception exception) {
            if (isQuestReviewStorageUnavailable(exception)) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(messageBody("\uB9AC\uBDF0\u0020\uAE30\uB2A5\uC5D0\u0020\uD544\uC694\uD55C\u0020\uD14C\uC774\uBE14\uC744\u0020\uCC3E\uC9C0\u0020\uBABB\uD588\uC2B5\uB2C8\uB2E4\u002E"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(messageBody("\uB9AC\uBDF0\u0020\uC218\uC815\u0020\uC911\u0020\uBB38\uC81C\uAC00\u0020\uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4\u002E"));
        }
    }

    @DeleteMapping("/{questId}/reviews/{reviewId}")
    public ResponseEntity<?> deleteQuestReview(
        @PathVariable("questId") int questId,
        @PathVariable("reviewId") int reviewId,
        HttpSession session
    ) {
        Integer loginUserId = resolveLoginUserId(session);
        if (loginUserId == null || loginUserId <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(messageBody("\uB85C\uADF8\uC778\uD55C\u0020\uC0AC\uC6A9\uC790\uB9CC\u0020\uB9AC\uBDF0\uB97C\u0020\uC0AD\uC81C\uD560\u0020\uC218\u0020\uC788\uC2B5\uB2C8\uB2E4\u002E"));
        }

        try {
            int deleted = isAdmin(session)
                ? questReviewService.removeQuestReviewAsAdmin(reviewId, questId)
                : questReviewService.removeQuestReview(reviewId, questId, loginUserId);
            if (deleted <= 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(messageBody("\uC0AD\uC81C\uD560\u0020\uB9AC\uBDF0\uB97C\u0020\uCC3E\uC9C0\u0020\uBABB\uD588\uC2B5\uB2C8\uB2E4\u002E"));
            }

            return ResponseEntity.ok(messageBody("\uB9AC\uBDF0\uAC00\u0020\uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4\u002E"));
        } catch (Exception exception) {
            if (isQuestReviewStorageUnavailable(exception)) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(messageBody("\uB9AC\uBDF0\u0020\uAE30\uB2A5\uC5D0\u0020\uD544\uC694\uD55C\u0020\uD14C\uC774\uBE14\uC744\u0020\uCC3E\uC9C0\u0020\uBABB\uD588\uC2B5\uB2C8\uB2E4\u002E"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(messageBody("\uB9AC\uBDF0\u0020\uC0AD\uC81C\u0020\uC911\u0020\uBB38\uC81C\uAC00\u0020\uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4\u002E"));
        }
    }

    private boolean isQuestReviewStorageUnavailable(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                String upperMessage = message.toUpperCase(Locale.ROOT);
                if (upperMessage.contains("LQ_QUEST_REVIEW")
                    || upperMessage.contains("QUESTREVIEW_MAPPER")
                    || upperMessage.contains("ORA-00942")
                    || upperMessage.contains("TABLE OR VIEW DOES NOT EXIST")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
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

    private boolean isAdmin(HttpSession session) {
        if (session == null) {
            return false;
        }

        Object role = session.getAttribute(SessionAuthKeys.USER_ROLE);
        return role != null && ROLE_ADMIN.equalsIgnoreCase(String.valueOf(role).trim());
    }

    private Map<String, String> messageBody(String message) {
        Map<String, String> response = new LinkedHashMap<>();
        response.put("message", message);
        return response;
    }
}
