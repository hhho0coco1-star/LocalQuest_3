package com.app.service.userquest.impl;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;

import com.app.dao.locationqr.LocationQrDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.quest.QuestDAO;
import com.app.dao.userquest.UserQuestDAO;
import com.app.dao.userquestprogress.UserQuestProgressDAO;
import com.app.dto.locationqr.LocationQrDTO;
import com.app.dto.locationqr.QrVerificationQuestResultDTO;
import com.app.dto.locationqr.QrVerificationResponseDTO;
import com.app.dto.locationqr.UserQuestQrVerificationTargetDTO;
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

    @Autowired
    private LocationQrDAO locationQrDAO;

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

    @Override
    @Transactional
    public QrVerificationResponseDTO verifyLocationQr(int userId, String qrAuthKey) {
        if (qrAuthKey == null || qrAuthKey.trim().isEmpty()) {
            throw new IllegalArgumentException("\u0051\u0052 \uC778\uC99D\uD0A4\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4\u002E");
        }

        String normalizedQrAuthKey = qrAuthKey.trim();
        LocationQrDTO locationQr = locationQrDAO.findActiveLocationQrByAuthKey(normalizedQrAuthKey);
        if (locationQr == null || locationQr.getLocationId() <= 0) {
            throw new NoSuchElementException("\uC720\uD6A8\uD55C \u0051\u0052 \uCF54\uB4DC\uAC00 \uC544\uB2D9\uB2C8\uB2E4\u002E");
        }

        List<UserQuestQrVerificationTargetDTO> targets =
            userQuestProgressDAO.findQrVerificationTargets(userId, locationQr.getLocationId());

        QrVerificationResponseDTO response = new QrVerificationResponseDTO();
        response.setQrAuthKey(normalizedQrAuthKey);
        response.setLocationId(locationQr.getLocationId());

        if (targets == null || targets.isEmpty()) {
            response.setMessage("\uD604\uC7AC \uC9C4\uD589 \uC911\uC778 \uD018\uC2A4\uD2B8 \uC911 \uD574\uB2F9 \uC7A5\uC18C\uB97C \uC778\uC99D\uD560 \uB300\uC0C1\uC774 \uC5C6\uC2B5\uB2C8\uB2E4\u002E");
            response.setResults(Collections.emptyList());
            return response;
        }

        response.setLocationName(targets.get(0).getLocationName());

        List<QrVerificationQuestResultDTO> results = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        int verifiedQuestCount = 0;
        int completedQuestCount = 0;

        for (UserQuestQrVerificationTargetDTO target : targets) {
            QrVerificationQuestResultDTO result = new QrVerificationQuestResultDTO();
            result.setUserQuestId(target.getUserQuestId());
            result.setQuestId(target.getQuestId());
            result.setQuestTitle(target.getQuestTitle());
            result.setLocationId(target.getLocationId());
            result.setLocationName(target.getLocationName());
            result.setVisitOrder(target.getVisitOrder());

            int totalCount = safeInt(target.getTotalCount());
            int completedCount = safeInt(target.getCompletedCount());
            boolean alreadyCompleted = safeInt(target.getIsCompleted()) == 1;
            boolean expired = isQrVerificationExpired(target);

            result.setTotalCount(totalCount);
            result.setAlreadyCompleted(alreadyCompleted);
            result.setExpired(expired);

            if (expired) {
                result.setStatus(target.getUserQuestStatus());
                result.setCompletedCount(completedCount);
                result.setRemainingCount(Math.max(0, totalCount - completedCount));
                result.setMessage("\uC81C\uD55C\uC2DC\uAC04\uC774 \uC9C0\uB09C \uD018\uC2A4\uD2B8\uB294 \u0051\u0052 \uC778\uC99D\uC744 \uBC18\uC601\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4\u002E");
                results.add(result);
                continue;
            }

            if (!alreadyCompleted) {
                UserQuestProgressDTO progress = new UserQuestProgressDTO();
                progress.setUserQuestId(target.getUserQuestId());
                progress.setQuestLocationId(target.getQuestLocationId());
                progress.setIsCompleted(1);
                progress.setCompletedAt(now);

                int updated = userQuestProgressDAO.completeUserQuestProgress(progress);
                if (updated > 0) {
                    completedCount += 1;
                    verifiedQuestCount += 1;
                    result.setVerified(true);
                    result.setMessage("\u0051\u0052 \uC778\uC99D\uC774 \uBC18\uC601\uB418\uC5C8\uC2B5\uB2C8\uB2E4\u002E");
                } else {
                    alreadyCompleted = true;
                    result.setAlreadyCompleted(true);
                }
            }

            if (alreadyCompleted) {
                result.setMessage("\uC774\uBBF8 \uC778\uC99D\uD55C \uC7A5\uC18C\uC785\uB2C8\uB2E4\u002E");
            }

            int remainingCount = userQuestProgressDAO.countIncompleteProgressByUserQuestId(target.getUserQuestId());
            boolean questCompleted = remainingCount == 0;

            if (questCompleted) {
                UserQuestDTO completedUserQuest = new UserQuestDTO();
                completedUserQuest.setUserQuestId(target.getUserQuestId());
                completedUserQuest.setStatus(USER_QUEST_STATUS_COMPLETED);
                completedUserQuest.setCompletedAt(now);
                userQuestDAO.completeUserQuest(completedUserQuest);
                completedQuestCount += 1;
                result.setQuestCompleted(true);
                result.setStatus(USER_QUEST_STATUS_COMPLETED);
                result.setCompletedCount(totalCount);
                result.setRemainingCount(0);
                result.setMessage(
                    result.isVerified()
                        ? "\u0051\u0052 \uC778\uC99D\uACFC \uD568\uAED8 \uD018\uC2A4\uD2B8\uAC00 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4\u002E"
                        : "\uD018\uC2A4\uD2B8 \uC644\uB8CC \uC0C1\uD0DC\uB85C \uBC18\uC601\uB418\uC5C8\uC2B5\uB2C8\uB2E4\u002E"
                );
            } else {
                result.setStatus(target.getUserQuestStatus());
                result.setCompletedCount(Math.min(totalCount, completedCount));
                result.setRemainingCount(Math.max(0, remainingCount));
            }

            results.add(result);
        }

        response.setResults(results);
        response.setMatchedQuestCount(results.size());
        response.setVerifiedQuestCount(verifiedQuestCount);
        response.setCompletedQuestCount(completedQuestCount);
        response.setMessage(buildQrVerificationMessage(results, verifiedQuestCount, completedQuestCount));
        return response;
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

    private boolean isQrVerificationExpired(UserQuestQrVerificationTargetDTO target) {
        if (target.getTimeLimit() == null || target.getTimeLimit() <= 0) {
            return false;
        }

        if (target.getStartedAt() == null) {
            return false;
        }

        if (target.getUserQuestStatus() != null
            && USER_QUEST_STATUS_COMPLETED.equalsIgnoreCase(target.getUserQuestStatus())) {
            return false;
        }

        LocalDateTime expiresAt = target.getStartedAt().plusMinutes(target.getTimeLimit());
        return !expiresAt.isAfter(LocalDateTime.now());
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private String buildQrVerificationMessage(
        List<QrVerificationQuestResultDTO> results,
        int verifiedQuestCount,
        int completedQuestCount) {
        if (results == null || results.isEmpty()) {
            return "\uBC18\uC601\uB41C \uD018\uC2A4\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4\u002E";
        }

        if (completedQuestCount > 0) {
            return "\u0051\u0052 \uC778\uC99D\uC774 \uBC18\uC601\uB418\uC5C8\uACE0 \uC77C\uBD80 \uD018\uC2A4\uD2B8\uAC00 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4\u002E";
        }

        if (verifiedQuestCount > 0) {
            return "\u0051\u0052 \uC778\uC99D\uC774 \uD018\uC2A4\uD2B8 \uC9C4\uD589\uB3C4\uC5D0 \uBC18\uC601\uB418\uC5C8\uC2B5\uB2C8\uB2E4\u002E";
        }

        boolean hasExpired = results.stream().anyMatch(QrVerificationQuestResultDTO::isExpired);
        if (hasExpired) {
            return "\uC81C\uD55C\uC2DC\uAC04\uC774 \uC9C0\uB09C \uD018\uC2A4\uD2B8\uB294 \u0051\u0052 \uC778\uC99D\uC744 \uBC18\uC601\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4\u002E";
        }

        return "\uC774\uBBF8 \uBC18\uC601\uB41C \u0051\u0052 \uC778\uC99D\uC785\uB2C8\uB2E4\u002E";
    }
}
