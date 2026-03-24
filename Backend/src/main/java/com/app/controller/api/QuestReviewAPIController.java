package com.app.controller.api;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.questreview.QuestReviewDTO;
import com.app.dto.questreview.QuestReviewListItemDTO;
import com.app.service.questreview.QuestReviewService;

@RestController
@RequestMapping("/api/quests")
public class QuestReviewAPIController {

    @Autowired
    private QuestReviewService questReviewService;

    @GetMapping("/{questId}/reviews")
    public ResponseEntity<List<QuestReviewListItemDTO>> getQuestReviews(@PathVariable("questId") int questId) {
        return ResponseEntity.ok(questReviewService.getQuestReviewsByQuestId(questId));
    }

    @PostMapping("/{questId}/reviews")
    public ResponseEntity<?> createQuestReview(
        @PathVariable("questId") int questId,
        @RequestBody QuestReviewDTO questReview
    ) {
        if (questReview.getUserId() <= 0) {
            return ResponseEntity.badRequest().body(messageBody("리뷰 작성 정보가 올바르지 않습니다."));
        }

        if (questReview.getRating() < 1 || questReview.getRating() > 5) {
            return ResponseEntity.badRequest().body(messageBody("별점은 1점부터 5점까지 입력할 수 있습니다."));
        }

        String content = questReview.getContent() == null ? "" : questReview.getContent().trim();
        if (content.isEmpty()) {
            return ResponseEntity.badRequest().body(messageBody("리뷰 내용을 입력해주세요."));
        }

        questReview.setQuestId(questId);
        questReview.setContent(content);

        try {
            questReviewService.saveQuestReview(questReview);
            return ResponseEntity.ok(messageBody("리뷰가 등록되었습니다."));
        } catch (DuplicateKeyException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(messageBody("이미 해당 퀘스트에 리뷰를 작성하셨습니다."));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(messageBody("리뷰 등록 중 문제가 발생했습니다."));
        }
    }

    @PutMapping("/{questId}/reviews/{reviewId}")
    public ResponseEntity<?> updateQuestReview(
        @PathVariable("questId") int questId,
        @PathVariable("reviewId") int reviewId,
        @RequestBody QuestReviewDTO questReview
    ) {
        if (questReview.getUserId() <= 0) {
            return ResponseEntity.badRequest().body(messageBody("리뷰 수정 정보가 올바르지 않습니다."));
        }

        if (questReview.getRating() < 1 || questReview.getRating() > 5) {
            return ResponseEntity.badRequest().body(messageBody("별점은 1점부터 5점까지 입력할 수 있습니다."));
        }

        String content = questReview.getContent() == null ? "" : questReview.getContent().trim();
        if (content.isEmpty()) {
            return ResponseEntity.badRequest().body(messageBody("리뷰 내용을 입력해주세요."));
        }

        questReview.setQuestId(questId);
        questReview.setReviewId(reviewId);
        questReview.setContent(content);

        try {
            int updated = questReviewService.updateQuestReview(questReview);
            if (updated <= 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(messageBody("수정할 리뷰를 찾지 못했습니다."));
            }

            return ResponseEntity.ok(messageBody("리뷰가 수정되었습니다."));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(messageBody("리뷰 수정 중 문제가 발생했습니다."));
        }
    }

    @DeleteMapping("/{questId}/reviews/{reviewId}")
    public ResponseEntity<?> deleteQuestReview(
        @PathVariable("questId") int questId,
        @PathVariable("reviewId") int reviewId,
        @RequestParam("userId") int userId
    ) {
        if (userId <= 0) {
            return ResponseEntity.badRequest().body(messageBody("리뷰 삭제 정보가 올바르지 않습니다."));
        }

        try {
            int deleted = questReviewService.removeQuestReview(reviewId, questId, userId);
            if (deleted <= 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(messageBody("삭제할 리뷰를 찾지 못했습니다."));
            }

            return ResponseEntity.ok(messageBody("리뷰가 삭제되었습니다."));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(messageBody("리뷰 삭제 중 문제가 발생했습니다."));
        }
    }

    private Map<String, String> messageBody(String message) {
        Map<String, String> response = new LinkedHashMap<>();
        response.put("message", message);
        return response;
    }
}