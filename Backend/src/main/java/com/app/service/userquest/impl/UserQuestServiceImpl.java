package com.app.service.userquest.impl;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.quest.QuestDAO;
import com.app.dao.userquest.UserQuestDAO;
import com.app.dao.userquestprogress.UserQuestProgressDAO;
import com.app.dto.quest.QuestDTO;
import com.app.dto.quest.QuestLocationInfoDTO;
import com.app.dto.userquest.UserQuestDTO;
import com.app.dto.userquest.UserQuestSummaryDTO;
import com.app.dto.userquestprogress.UserQuestProgressDTO;
import com.app.service.userquest.UserQuestService;

@Service
public class UserQuestServiceImpl implements UserQuestService {

    private static final String QUEST_STATUS_ACTIVE = "ACTIVE";
    private static final String QUEST_STATUS_DELETED = "DELETED";
    private static final String USER_QUEST_STATUS_SAVED = "SAVED";
    private static final String USER_QUEST_STATUS_IN_PROGRESS = "IN_PROGRESS";
    private static final String USER_QUEST_STATUS_COMPLETED = "COMPLETED";
    private static final String USER_QUEST_STATUS_ABANDONED = "ABANDONED";

    @Autowired
    private UserQuestDAO userQuestDAO;

    @Autowired
    private UserQuestProgressDAO userQuestProgressDAO;

    @Autowired
    private QuestDAO questDAO;

    @Override
    @Transactional
    public int saveUserQuest(UserQuestDTO userQuest) {
        return userQuestDAO.saveUserQuest(userQuest);
    }

    @Override
    @Transactional
    public UserQuestSummaryDTO acceptQuest(int userId, int questId) {
        QuestDTO quest = getAcceptableQuestOrThrow(questId);
        UserQuestDTO existingUserQuest = findUserQuest(userId, questId);
        LocalDateTime now = LocalDateTime.now();

        if (existingUserQuest == null) {
            UserQuestDTO newUserQuest = new UserQuestDTO();
            newUserQuest.setUserId(userId);
            newUserQuest.setQuestId(questId);
            newUserQuest.setStatus(USER_QUEST_STATUS_IN_PROGRESS);
            newUserQuest.setStartedAt(now);
            newUserQuest.setCompletedAt(null);

            userQuestDAO.saveUserQuest(newUserQuest);
            resetUserQuestProgress(newUserQuest.getUserQuestId(), questId);

            return buildSummary(quest, newUserQuest);
        }

        if (USER_QUEST_STATUS_COMPLETED.equalsIgnoreCase(existingUserQuest.getStatus())) {
            throw new IllegalStateException("\uC774\uBBF8\u0020\uC644\uB8CC\uD55C\u0020\uD018\uC2A4\uD2B8\uB294\u0020\uB2E4\uC2DC\u0020\uC218\uB77D\uD560\u0020\uC218\u0020\uC5C6\uC2B5\uB2C8\uB2E4\u002E");
        }

        boolean expired = isExpired(existingUserQuest, quest);
        boolean canRestart = expired
            || USER_QUEST_STATUS_SAVED.equalsIgnoreCase(existingUserQuest.getStatus())
            || USER_QUEST_STATUS_ABANDONED.equalsIgnoreCase(existingUserQuest.getStatus());

        if (!canRestart) {
            throw new IllegalStateException("\uC774\uBBF8\u0020\uC9C4\uD589\u0020\uC911\uC778\u0020\uD018\uC2A4\uD2B8\uC785\uB2C8\uB2E4\u002E");
        }

        existingUserQuest.setStatus(USER_QUEST_STATUS_IN_PROGRESS);
        existingUserQuest.setStartedAt(now);
        existingUserQuest.setCompletedAt(null);

        userQuestDAO.updateUserQuestForAccept(existingUserQuest);
        resetUserQuestProgress(existingUserQuest.getUserQuestId(), questId);

        return buildSummary(quest, existingUserQuest);
    }

    @Override
    @Transactional(readOnly = true)
    public UserQuestSummaryDTO getUserQuestSummary(int userId, int questId) {
        QuestDTO quest = getQuestOrThrow(questId);
        UserQuestDTO userQuest = findUserQuest(userId, questId);

        if (userQuest == null) {
            return buildNotAcceptedSummary(quest);
        }

        return buildSummary(quest, userQuest);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserQuestSummaryDTO> getUserQuestSummaries(int userId) {
        List<UserQuestSummaryDTO> summaries = userQuestDAO.findUserQuestSummariesByUserId(userId);
        if (summaries == null || summaries.isEmpty()) {
            return Collections.emptyList();
        }

        summaries.forEach(this::enrichSummaryWithTimePolicy);
        return summaries;
    }

    private QuestDTO getAcceptableQuestOrThrow(int questId) {
        QuestDTO quest = getQuestOrThrow(questId);

        if (!QUEST_STATUS_ACTIVE.equalsIgnoreCase(quest.getStatus())) {
            throw new IllegalStateException("\uD65C\uC131\uD654\uB41C\u0020\uD018\uC2A4\uD2B8\uB9CC\u0020\uC218\uB77D\uD560\u0020\uC218\u0020\uC788\uC2B5\uB2C8\uB2E4\u002E");
        }

        return quest;
    }

    private QuestDTO getQuestOrThrow(int questId) {
        QuestDTO quest = questDAO.selectQuestById(questId);
        if (quest == null || QUEST_STATUS_DELETED.equalsIgnoreCase(quest.getStatus())) {
            throw new NoSuchElementException("\uD018\uC2A4\uD2B8\uB97C\u0020\uCC3E\uC744\u0020\uC218\u0020\uC5C6\uC2B5\uB2C8\uB2E4\u002E");
        }
        return quest;
    }

    private UserQuestDTO findUserQuest(int userId, int questId) {
        UserQuestDTO condition = new UserQuestDTO();
        condition.setUserId(userId);
        condition.setQuestId(questId);
        return userQuestDAO.findUserQuestByUserIdAndQuestId(condition);
    }

    private void resetUserQuestProgress(int userQuestId, int questId) {
        userQuestProgressDAO.deleteUserQuestProgressByUserQuestId(userQuestId);

        List<QuestLocationInfoDTO> questLocations = questDAO.selectQuestLocationsByQuestId(questId);
        if (questLocations == null || questLocations.isEmpty()) {
            return;
        }

        for (QuestLocationInfoDTO questLocation : questLocations) {
            UserQuestProgressDTO progress = new UserQuestProgressDTO();
            progress.setUserQuestId(userQuestId);
            progress.setQuestLocationId(questLocation.getQuestLocationId());
            progress.setIsCompleted(0);
            progress.setCompletedAt(null);
            userQuestProgressDAO.saveUserQuestProgress(progress);
        }
    }

    private UserQuestSummaryDTO buildSummary(QuestDTO quest, UserQuestDTO userQuest) {
        UserQuestSummaryDTO summary = new UserQuestSummaryDTO();
        summary.setQuestId(quest.getQuestId());
        summary.setUserQuestId(userQuest.getUserQuestId());
        summary.setAccepted(true);
        summary.setQuestStatus(quest.getStatus());
        summary.setTitle(quest.getTitle());
        summary.setDescription(quest.getDescription());
        summary.setCategory(quest.getCategory());
        summary.setRewardExp(quest.getRewardExp());
        summary.setRewardPoint(quest.getRewardPoint());
        summary.setStatus(userQuest.getStatus());
        summary.setTimeLimit(quest.getTimeLimit());
        summary.setStartedAt(userQuest.getStartedAt());
        summary.setCompletedAt(userQuest.getCompletedAt());

        enrichSummaryWithTimePolicy(summary);
        return summary;
    }

    private UserQuestSummaryDTO buildNotAcceptedSummary(QuestDTO quest) {
        UserQuestSummaryDTO summary = new UserQuestSummaryDTO();
        summary.setQuestId(quest.getQuestId());
        summary.setAccepted(false);
        summary.setQuestStatus(quest.getStatus());
        summary.setTitle(quest.getTitle());
        summary.setDescription(quest.getDescription());
        summary.setCategory(quest.getCategory());
        summary.setRewardExp(quest.getRewardExp());
        summary.setRewardPoint(quest.getRewardPoint());
        summary.setTimeLimit(quest.getTimeLimit());
        summary.setExpired(false);
        return summary;
    }

    private boolean isExpired(UserQuestDTO userQuest, QuestDTO quest) {
        UserQuestSummaryDTO summary = new UserQuestSummaryDTO();
        summary.setStatus(userQuest.getStatus());
        summary.setStartedAt(userQuest.getStartedAt());
        summary.setTimeLimit(quest.getTimeLimit());
        return isExpired(summary);
    }

    private void enrichSummaryWithTimePolicy(UserQuestSummaryDTO summary) {
        summary.setAccepted(true);

        boolean expired = isExpired(summary);
        summary.setExpired(expired);
        summary.setRemainingSeconds(calculateRemainingSeconds(summary, expired));
    }

    private boolean isExpired(UserQuestSummaryDTO summary) {
        if (summary.getTimeLimit() == null || summary.getTimeLimit() <= 0) {
            return false;
        }

        if (summary.getStartedAt() == null) {
            return false;
        }

        if (summary.getStatus() != null && USER_QUEST_STATUS_COMPLETED.equalsIgnoreCase(summary.getStatus())) {
            return false;
        }

        LocalDateTime expiresAt = summary.getStartedAt().plusMinutes(summary.getTimeLimit());
        return !expiresAt.isAfter(LocalDateTime.now());
    }

    private Long calculateRemainingSeconds(UserQuestSummaryDTO summary, boolean expired) {
        if (summary.getTimeLimit() == null || summary.getTimeLimit() <= 0) {
            return null;
        }

        if (summary.getStartedAt() == null) {
            return null;
        }

        if (summary.getStatus() != null && USER_QUEST_STATUS_COMPLETED.equalsIgnoreCase(summary.getStatus())) {
            return null;
        }

        if (expired) {
            return 0L;
        }

        LocalDateTime expiresAt = summary.getStartedAt().plusMinutes(summary.getTimeLimit());
        return Math.max(0L, Duration.between(LocalDateTime.now(), expiresAt).getSeconds());
    }
}
