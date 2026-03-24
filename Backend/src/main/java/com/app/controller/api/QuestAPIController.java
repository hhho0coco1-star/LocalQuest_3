package com.app.controller.api;

import java.util.LinkedHashMap;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.auth.SessionAuthKeys;
import com.app.dto.quest.QuestDTO;
import com.app.dto.quest.QuestDetailDTO;
import com.app.dto.quest.QuestMapDTO;
import com.app.service.quest.QuestService;
import com.app.service.userquest.UserQuestService;

@RestController
@RequestMapping("/api/quests")
public class QuestAPIController {

    @Autowired
    private QuestService questService;

    @Autowired
    private UserQuestService userQuestService;

    @GetMapping
    public ResponseEntity<List<QuestDTO>> getQuestList() {
        return ResponseEntity.ok(questService.getAllQuests());
    }

    @GetMapping("/map")
    public ResponseEntity<List<QuestMapDTO>> getQuestMapList() {
        try {
            return ResponseEntity.ok(questService.getQuestMapList());
        } catch (Exception e) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyQuestList(HttpSession session) {
        Integer loginUserId = resolveLoginUserId(session);
        if (loginUserId == null || loginUserId <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(messageBody("\uB85C\uADF8\uC778\uC774\u0020\uD544\uC694\uD569\uB2C8\uB2E4\u002E"));
        }

        try {
            return ResponseEntity.ok(userQuestService.getUserQuestSummaries(loginUserId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(messageBody("\uB0B4\u0020\uD018\uC2A4\uD2B8\u0020\uBAA9\uB85D\u0020\uC870\uD68C\u0020\uC911\u0020\uC624\uB958\uAC00\u0020\uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4\u002E"));
        }
    }

    @GetMapping("/{questId}")
    public ResponseEntity<?> getQuestDetail(@PathVariable int questId) {
        try {
            QuestDetailDTO quest = questService.getQuestDetailById(questId);
            if (quest == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(quest);
        } catch (Exception e) {
            QuestDTO quest = questService.getQuestById(questId);
            if (quest == null) {
                return ResponseEntity.notFound().build();
            }

            QuestDetailDTO fallback = new QuestDetailDTO();
            fallback.setQuestId(quest.getQuestId());
            fallback.setTitle(quest.getTitle());
            fallback.setDescription(quest.getDescription());
            fallback.setCategory(quest.getCategory());
            fallback.setRewardExp(quest.getRewardExp());
            fallback.setRewardPoint(quest.getRewardPoint());
            fallback.setTimeLimit(quest.getTimeLimit());
            fallback.setStatus(quest.getStatus());
            fallback.setCreatedAt(quest.getCreatedAt());
            fallback.setLocations(Collections.emptyList());
            return ResponseEntity.ok(fallback);
        }
    }

    @PostMapping("/{questId}/accept")
    public ResponseEntity<?> acceptQuest(@PathVariable int questId, HttpSession session) {
        Integer loginUserId = resolveLoginUserId(session);
        if (loginUserId == null || loginUserId <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(messageBody("\uB85C\uADF8\uC778\uC774\u0020\uD544\uC694\uD569\uB2C8\uB2E4\u002E"));
        }

        try {
            return ResponseEntity.ok(userQuestService.acceptQuest(loginUserId, questId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(messageBody(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(messageBody(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(messageBody("\uD018\uC2A4\uD2B8\u0020\uC218\uB77D\u0020\uC911\u0020\uC624\uB958\uAC00\u0020\uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4\u002E"));
        }
    }

    @GetMapping("/{questId}/me")
    public ResponseEntity<?> getMyQuestSummary(@PathVariable int questId, HttpSession session) {
        Integer loginUserId = resolveLoginUserId(session);
        if (loginUserId == null || loginUserId <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(messageBody("\uB85C\uADF8\uC778\uC774\u0020\uD544\uC694\uD569\uB2C8\uB2E4\u002E"));
        }

        try {
            return ResponseEntity.ok(userQuestService.getUserQuestSummary(loginUserId, questId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(messageBody(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(messageBody("\uB0B4\u0020\uD018\uC2A4\uD2B8\u0020\uC0C1\uD0DC\u0020\uC870\uD68C\u0020\uC911\u0020\uC624\uB958\uAC00\u0020\uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4\u002E"));
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
