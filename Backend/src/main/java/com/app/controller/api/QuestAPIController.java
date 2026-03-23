package com.app.controller.api;

import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.quest.QuestDTO;
import com.app.dto.quest.QuestDetailDTO;
import com.app.dto.quest.QuestMapDTO;
import com.app.service.quest.QuestService;

@RestController
@RequestMapping("/api/quests")
public class QuestAPIController {

    @Autowired
    private QuestService questService;

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
}
