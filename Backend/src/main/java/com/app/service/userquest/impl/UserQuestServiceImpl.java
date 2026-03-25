package com.app.service.userquest.impl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.Duration;
import java.util.Collections;
import java.util.Locale;
import java.util.NoSuchElementException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import com.app.dao.location.LocationDAO;
import com.app.dao.quest.QuestDAO;
import com.app.dao.receipt.ReceiptDAO;
import com.app.dao.user.UserDAO;
import com.app.dao.userquest.UserQuestDAO;
import com.app.dao.userquestprogress.UserQuestProgressDAO;
import com.app.dto.pointhistory.PointHistoryDTO;
import com.app.dto.quest.QuestDTO;
import com.app.dto.receipt.ReceiptDTO;
import com.app.dto.userquest.UserQuestDetailDTO;
import com.app.dto.userquest.UserQuestDetailLocationDTO;
import com.app.dto.userquest.UserQuestDTO;
import com.app.dto.userquest.UserQuestOverviewDTO;
import com.app.dto.userquest.UserQuestSummaryDTO;
import com.app.dto.userquestprogress.UserQuestProgressDTO;
import com.app.service.pointhistory.PointHistoryService;
import com.app.dto.quest.QuestLocationInfoDTO;
import com.app.service.userquest.UserQuestService;

@Service
public class UserQuestServiceImpl implements UserQuestService {

    private static final String OCR_VERIFY_URL = "http://localhost:8000/ocr";
    private static final Path RECEIPT_UPLOAD_DIR = Paths.get("D:/fileStorage");
    private static final String QUEST_STATUS_ACTIVE = "ACTIVE";
    private static final String QUEST_STATUS_DELETED = "DELETED";
    private static final String USER_QUEST_STATUS_SAVED = "SAVED";
    private static final String USER_QUEST_STATUS_IN_PROGRESS = "IN_PROGRESS";
    private static final String USER_QUEST_STATUS_COMPLETED = "COMPLETED";
    private static final String USER_QUEST_STATUS_ABANDONED = "ABANDONED";
    private static final String LOCATION_TYPE_VISIT = "VISIT";
    private static final String LOCATION_TYPE_EXPERIENCE = "EXPERIENCE";
    private static final String LOCATION_TYPE_PURCHASE = "PURCHASE";
    private static final double GPS_VERIFY_RADIUS_METERS = 120.0;

    @Autowired
    private UserQuestDAO userQuestDAO;

    @Autowired
    private UserQuestProgressDAO userQuestProgressDAO;

    @Autowired
    private QuestDAO questDAO;

    @Autowired
    private LocationDAO locationDAO;

    @Autowired
    private ReceiptDAO receiptDAO;

    @Autowired
    private UserDAO userDAO;

    @Autowired
    private PointHistoryService pointHistoryService;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    @Transactional
    public int saveUserQuest(UserQuestDTO userQuest) {
        return userQuestDAO.saveUserQuest(userQuest);
    }

    @Override
    @Transactional
    public Map<String, Object> acceptQuest(int userId, int questId) {
        UserQuestDTO existingQuest = userQuestDAO.findLatestUserQuestByUserIdAndQuestId(userId, questId);
        QuestDTO quest = questDAO.selectQuestById(questId);

        if (quest == null) {
            throw new IllegalArgumentException("존재하지 않는 퀘스트입니다.");
        }

        if (existingQuest != null
            && !"ABANDONED".equalsIgnoreCase(existingQuest.getStatus())
            && !"COMPLETED".equalsIgnoreCase(existingQuest.getStatus())) {
            Map<String, Object> response = new HashMap<>();
            response.put("accepted", false);
            response.put("alreadyAccepted", true);
            response.put("userQuestId", existingQuest.getUserQuestId());
            response.put("status", existingQuest.getStatus());
            response.put("message", "이미 수락한 퀘스트입니다.");
            return response;
        }

        UserQuestDTO userQuest = new UserQuestDTO();
        LocalDateTime startedAt = LocalDateTime.now();
        userQuest.setUserId(userId);
        userQuest.setQuestId(questId);
        userQuest.setStatus("IN_PROGRESS");
        userQuest.setStartedAt(startedAt);
        userQuest.setDueAt(resolveDueAt(startedAt, quest.getTimeLimit()));

        saveUserQuest(userQuest);
        userQuestProgressDAO.initializeProgressByQuestId(userQuest.getUserQuestId(), questId);

        Map<String, Object> response = new HashMap<>();
        response.put("accepted", true);
        response.put("alreadyAccepted", false);
        response.put("userQuestId", userQuest.getUserQuestId());
        response.put("status", userQuest.getStatus());
        response.put("message", "퀘스트를 수락했습니다.");
        return response;
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

    private LocalDateTime resolveDueAt(LocalDateTime startedAt, Integer timeLimit) {
        if (startedAt == null || timeLimit == null || timeLimit <= 0) {
            return null;
        }
        return startedAt.plusMinutes(timeLimit.longValue());
    }

    @Override
    public UserQuestOverviewDTO getUserQuestOverview(int userId) {
        List<UserQuestSummaryDTO> allQuests = getUserQuestSummaries(userId);
        List<UserQuestSummaryDTO> ongoingQuests = new ArrayList<>();
        List<UserQuestSummaryDTO> completedQuests = new ArrayList<>();
        int totalRewardPoint = 0;

        for (UserQuestSummaryDTO quest : allQuests) {
            if ("ABANDONED".equalsIgnoreCase(quest.getQuestStatus())) {
                continue;
            }

            if ("COMPLETED".equalsIgnoreCase(quest.getQuestStatus())) {
                completedQuests.add(quest);
                totalRewardPoint += quest.getRewardPoint();
            } else {
                ongoingQuests.add(quest);
            }
        }

        UserQuestOverviewDTO overview = new UserQuestOverviewDTO();
        overview.setOngoingQuests(ongoingQuests);
        overview.setCompletedQuests(completedQuests);
        overview.setOngoingCount(ongoingQuests.size());
        overview.setCompletedCount(completedQuests.size());
        overview.setTotalRewardPoint(totalRewardPoint);
        return overview;
    }

    @Override
    public UserQuestDetailDTO getUserQuestDetail(int userId, int userQuestId) {
        UserQuestDetailDTO detail = userQuestDAO.findUserQuestDetailByUserQuestId(userQuestId);
        if (detail == null || detail.getUserId() != userId) {
            return null;
        }

        detail.setLocations(userQuestDAO.findUserQuestDetailLocationsByUserQuestId(userQuestId));
        return detail;
    }

    @Override
    @Transactional
    public Map<String, Object> completeQuest(int userId, int userQuestId) {
        UserQuestDetailDTO detail = getUserQuestDetail(userId, userQuestId);
        if (detail == null) {
            throw new IllegalArgumentException("완료할 퀘스트 정보를 찾을 수 없습니다.");
        }

        if ("ABANDONED".equalsIgnoreCase(detail.getQuestStatus())) {
            throw new IllegalArgumentException("취소한 퀘스트는 완료할 수 없습니다.");
        }

        if ("COMPLETED".equalsIgnoreCase(detail.getQuestStatus())) {
            Map<String, Object> response = new HashMap<>();
            response.put("completed", true);
            response.put("alreadyCompleted", true);
            response.put("message", "이미 완료한 퀘스트입니다.");
            response.put("detail", detail);
            return response;
        }

        int totalCount = Math.max(detail.getTotalLocationCount(), 0);
        int completedCount = Math.max(detail.getCompletedLocationCount(), 0);
        if (totalCount <= 0 || completedCount < totalCount) {
            throw new IllegalArgumentException("퀘스트 진행률이 100%일 때만 완료할 수 있습니다.");
        }

        applyQuestReward(detail);

        Date completedAt = new Date();
        userQuestDAO.updateUserQuestStatusAndCompletedAt(userQuestId, "COMPLETED", completedAt);

        Map<String, Object> response = new HashMap<>();
        response.put("completed", true);
        response.put("alreadyCompleted", false);
        response.put("message", "퀘스트를 완료했습니다.");
        response.put("detail", getUserQuestDetail(userId, userQuestId));
        return response;
    }

    @Override
    @Transactional
    public Map<String, Object> cancelQuest(int userId, int userQuestId) {
        UserQuestDetailDTO detail = getUserQuestDetail(userId, userQuestId);
        if (detail == null) {
            throw new IllegalArgumentException("취소할 퀘스트 정보를 찾을 수 없습니다.");
        }

        if ("COMPLETED".equalsIgnoreCase(detail.getQuestStatus())) {
            throw new IllegalArgumentException("완료한 퀘스트는 취소할 수 없습니다.");
        }

        if ("ABANDONED".equalsIgnoreCase(detail.getQuestStatus())) {
            Map<String, Object> response = new HashMap<>();
            response.put("canceled", true);
            response.put("userQuestId", userQuestId);
            response.put("message", "이미 취소한 퀘스트입니다.");
            return response;
        }

        userQuestDAO.updateUserQuestLifecycle(userQuestId, "ABANDONED", null, null, null);

        Map<String, Object> response = new HashMap<>();
        response.put("canceled", true);
        response.put("userQuestId", userQuestId);
        response.put("message", "퀘스트를 취소했습니다.");
        return response;
    }

    @Override
    @Transactional
    public Map<String, Object> verifyReceiptAndCompleteLocation(
        int userId,
        int userQuestId,
        int questLocationId,
        MultipartFile receiptImage
    ) {
        if (receiptImage == null || receiptImage.isEmpty()) {
            throw new IllegalArgumentException("영수증 이미지를 선택해 주세요.");
        }

        UserQuestDetailDTO detail = getUserQuestDetail(userId, userQuestId);
        if (detail == null) {
            throw new IllegalArgumentException("내 퀘스트 정보를 찾을 수 없습니다.");
        }

        if ("ABANDONED".equalsIgnoreCase(detail.getQuestStatus())) {
            throw new IllegalArgumentException("취소한 퀘스트는 인증할 수 없습니다.");
        }

        UserQuestDetailLocationDTO targetLocation = findTargetLocation(detail, questLocationId);
        if (targetLocation == null) {
            throw new IllegalArgumentException("인증할 장소 정보를 찾을 수 없습니다.");
        }

        Integer userQuestProgressId = targetLocation.getUserQuestProgressId();
        if (userQuestProgressId == null) {
            throw new IllegalStateException("영수증을 연결할 퀘스트 진행 정보가 없습니다.");
        }

        if (targetLocation.getIsCompleted() == 1) {
            Map<String, Object> alreadyCompleted = new HashMap<>();
            alreadyCompleted.put("verified", true);
            alreadyCompleted.put("message", "이미 인증이 완료된 장소입니다.");
            alreadyCompleted.put("detail", detail);
            return alreadyCompleted;
        }

        String savedFilePath = saveReceiptImage(receiptImage, userQuestId, questLocationId);
        Map<String, Object> ocrResult = requestReceiptVerification(savedFilePath, targetLocation.getName());

        boolean verified = Boolean.TRUE.equals(ocrResult.get("is_verified"));
        saveReceipt(
            detail.getUserId(),
            userQuestProgressId,
            detail.getCategory(),
            verified ? "SUCCESS" : "FAILED",
            savedFilePath,
            extractFileName(savedFilePath),
            receiptImage.getOriginalFilename()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("verified", verified);
        response.put("reason", stringValue(ocrResult.get("reason")));
        response.put("confidence", ocrResult.get("confidence"));
        response.put("recognizedStoreName", stringValue(ocrResult.get("recognized_store_name")));
        response.put("receiptDate", stringValue(ocrResult.get("receipt_date")));
        response.put("todayDate", stringValue(ocrResult.get("today_date")));

        if (!verified) {
            response.put("message", "영수증 인증에 실패했습니다.");
            response.put("detail", detail);
            return response;
        }

        Date completedAt = new Date();
        userQuestProgressDAO.upsertCompletedProgress(userQuestId, questLocationId, completedAt);
        userQuestDAO.updateUserQuestStatusAndCompletedAt(userQuestId, "IN_PROGRESS", null);

        response.put("message", "영수증 인증이 완료되었습니다.");
        response.put("detail", getUserQuestDetail(userId, userQuestId));
        return response;
    }

    @Override
    @Transactional
    public Map<String, Object> verifyGpsAndCompleteLocation(
        int userId,
        int userQuestId,
        int questLocationId,
        Double latitude,
        Double longitude
    ) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("현재 위치 정보를 확인할 수 없습니다.");
        }

        VerificationContext context = requireVerificationContext(userId, userQuestId, questLocationId);
        UserQuestDetailLocationDTO targetLocation = context.getTargetLocation();
        ensureLocationType(targetLocation, LOCATION_TYPE_VISIT);

        if (targetLocation.getLatitude() == null || targetLocation.getLongitude() == null) {
            throw new IllegalStateException("GPS 인증을 위한 장소 좌표가 없습니다.");
        }

        double distanceMeters = calculateDistanceMeters(
            latitude,
            longitude,
            targetLocation.getLatitude(),
            targetLocation.getLongitude()
        );

        if (distanceMeters > GPS_VERIFY_RADIUS_METERS) {
            Map<String, Object> response = new HashMap<>();
            response.put("verified", false);
            response.put("distanceMeters", Math.round(distanceMeters));
            response.put("message", "방문 위치가 확인되지 않았습니다.");
            response.put("reason", "목표 장소 반경 " + (int) GPS_VERIFY_RADIUS_METERS + "m 이내에서 다시 시도해 주세요.");
            response.put("detail", context.getDetail());
            return response;
        }

        return completeLocationVerification(userId, userQuestId, questLocationId, "GPS 인증이 완료되었습니다.");
    }

    @Override
    @Transactional
    public Map<String, Object> verifyQrAndCompleteLocation(
        int userId,
        int userQuestId,
        int questLocationId,
        String qrAuthKey
    ) {
        if (qrAuthKey == null || qrAuthKey.trim().isEmpty()) {
            throw new IllegalArgumentException("QR 인증값을 입력해 주세요.");
        }

        VerificationContext context = requireVerificationContext(userId, userQuestId, questLocationId);
        UserQuestDetailLocationDTO targetLocation = context.getTargetLocation();
        ensureLocationType(targetLocation, LOCATION_TYPE_EXPERIENCE);

        String savedAuthKey = locationDAO.findActiveQrAuthKeyByLocationId(targetLocation.getLocationId());
        if (savedAuthKey == null || savedAuthKey.trim().isEmpty()) {
            throw new IllegalStateException("등록된 QR 인증 정보가 없습니다.");
        }

        if (!savedAuthKey.trim().equalsIgnoreCase(qrAuthKey.trim())) {
            Map<String, Object> response = new HashMap<>();
            response.put("verified", false);
            response.put("message", "QR 인증에 실패했습니다.");
            response.put("reason", "QR 인증값이 올바르지 않습니다.");
            response.put("detail", context.getDetail());
            return response;
        }

        return completeLocationVerification(userId, userQuestId, questLocationId, "QR 인증이 완료되었습니다.");
    }

    private UserQuestDetailLocationDTO findTargetLocation(UserQuestDetailDTO detail, int questLocationId) {
        if (detail.getLocations() == null) {
            return null;
        }

        for (UserQuestDetailLocationDTO location : detail.getLocations()) {
            if (location.getQuestLocationId() == questLocationId) {
                return location;
            }
        }
        return null;
    }

    private VerificationContext requireVerificationContext(int userId, int userQuestId, int questLocationId) {
        UserQuestDetailDTO detail = getUserQuestDetail(userId, userQuestId);
        if (detail == null) {
            throw new IllegalArgumentException("퀘스트 정보를 찾을 수 없습니다.");
        }

        if (USER_QUEST_STATUS_ABANDONED.equalsIgnoreCase(detail.getQuestStatus())) {
            throw new IllegalArgumentException("취소된 퀘스트는 인증할 수 없습니다.");
        }

        UserQuestDetailLocationDTO targetLocation = findTargetLocation(detail, questLocationId);
        if (targetLocation == null) {
            throw new IllegalArgumentException("인증할 장소 정보를 찾을 수 없습니다.");
        }

        Integer userQuestProgressId = targetLocation.getUserQuestProgressId();
        if (userQuestProgressId == null) {
            throw new IllegalStateException("퀘스트 진행 정보가 없습니다.");
        }

        if (targetLocation.getIsCompleted() == 1) {
            return new VerificationContext(detail, targetLocation, userQuestProgressId, true);
        }

        return new VerificationContext(detail, targetLocation, userQuestProgressId, false);
    }

    private void ensureLocationType(UserQuestDetailLocationDTO targetLocation, String expectedLocationType) {
        String actualLocationType = normalizeLocationType(targetLocation.getLocationType());
        if (!expectedLocationType.equals(actualLocationType)) {
            throw new IllegalArgumentException("선택한 장소의 인증 방식과 요청이 일치하지 않습니다.");
        }
    }

    private String normalizeLocationType(String locationType) {
        if (locationType == null || locationType.trim().isEmpty()) {
            return LOCATION_TYPE_VISIT;
        }
        return locationType.trim().toUpperCase(Locale.ROOT);
    }

    private Map<String, Object> completeLocationVerification(
        int userId,
        int userQuestId,
        int questLocationId,
        String successMessage
    ) {
        VerificationContext context = requireVerificationContext(userId, userQuestId, questLocationId);
        if (context.isAlreadyCompleted()) {
            Map<String, Object> alreadyCompleted = new HashMap<>();
            alreadyCompleted.put("verified", true);
            alreadyCompleted.put("message", "이미 인증이 완료된 장소입니다.");
            alreadyCompleted.put("detail", context.getDetail());
            return alreadyCompleted;
        }

        Date completedAt = new Date();
        userQuestProgressDAO.upsertCompletedProgress(userQuestId, questLocationId, completedAt);
        userQuestDAO.updateUserQuestStatusAndCompletedAt(userQuestId, USER_QUEST_STATUS_IN_PROGRESS, null);

        Map<String, Object> response = new HashMap<>();
        response.put("verified", true);
        response.put("message", successMessage);
        response.put("detail", getUserQuestDetail(userId, userQuestId));
        return response;
    }

    private double calculateDistanceMeters(
        double latitude1,
        double longitude1,
        double latitude2,
        double longitude2
    ) {
        double earthRadiusMeters = 6371000.0;
        double latDistance = Math.toRadians(latitude2 - latitude1);
        double lonDistance = Math.toRadians(longitude2 - longitude1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
            + Math.cos(Math.toRadians(latitude1))
            * Math.cos(Math.toRadians(latitude2))
            * Math.sin(lonDistance / 2)
            * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusMeters * c;
    }

    private static class VerificationContext {
        private final UserQuestDetailDTO detail;
        private final UserQuestDetailLocationDTO targetLocation;
        private final Integer userQuestProgressId;
        private final boolean alreadyCompleted;

        private VerificationContext(
            UserQuestDetailDTO detail,
            UserQuestDetailLocationDTO targetLocation,
            Integer userQuestProgressId,
            boolean alreadyCompleted
        ) {
            this.detail = detail;
            this.targetLocation = targetLocation;
            this.userQuestProgressId = userQuestProgressId;
            this.alreadyCompleted = alreadyCompleted;
        }

        private UserQuestDetailDTO getDetail() {
            return detail;
        }

        private UserQuestDetailLocationDTO getTargetLocation() {
            return targetLocation;
        }

        private Integer getUserQuestProgressId() {
            return userQuestProgressId;
        }

        private boolean isAlreadyCompleted() {
            return alreadyCompleted;
        }
    }

    private void applyQuestReward(UserQuestDetailDTO detail) {
        Map<String, Object> rewardMap = new HashMap<>();
        rewardMap.put("userId", detail.getUserId());
        rewardMap.put("rewardExp", Math.max(detail.getRewardExp(), 0));
        rewardMap.put("rewardPoint", Math.max(detail.getRewardPoint(), 0));
        userDAO.addRewardByUserId(rewardMap);

        if (detail.getRewardPoint() > 0) {
            PointHistoryDTO pointHistory = new PointHistoryDTO();
            pointHistory.setUserId(detail.getUserId());
            pointHistory.setPointAmount(detail.getRewardPoint());
            pointHistory.setCategory("QUEST");
            pointHistory.setDescription(detail.getTitle() + " 완료 보상");
            pointHistoryService.savePointHistory(pointHistory);
        }
    }

    private String saveReceiptImage(MultipartFile receiptImage, int userQuestId, int questLocationId) {
        try {
            Files.createDirectories(RECEIPT_UPLOAD_DIR);
            String originalFilename = receiptImage.getOriginalFilename();
            String extension = "";
            if (originalFilename != null) {
                int extensionIndex = originalFilename.lastIndexOf('.');
                if (extensionIndex >= 0) {
                    extension = originalFilename.substring(extensionIndex);
                }
            }

            String storedFileName = String.format(
                "userquest-%d-location-%d-%s%s",
                userQuestId,
                questLocationId,
                UUID.randomUUID(),
                extension
            );

            Path savedPath = RECEIPT_UPLOAD_DIR.resolve(storedFileName);
            receiptImage.transferTo(savedPath.toFile());
            return savedPath.toAbsolutePath().toString().replace("\\", "/");
        } catch (IOException e) {
            throw new IllegalStateException("영수증 파일 저장에 실패했습니다.", e);
        }
    }

    private void saveReceipt(
        int userId,
        int userQuestProgressId,
        String category,
        String verifyStatus,
        String filePath,
        String fileUploadName,
        String fileOriginalName
    ) {
        ReceiptDTO receipt = new ReceiptDTO();
        receipt.setUserId(userId);
        receipt.setUserQuestProgressId(userQuestProgressId);
        receipt.setCategory(category);
        receipt.setVerifyStatus(verifyStatus);
        receipt.setFilePath(filePath);
        receipt.setFileUploadName(fileUploadName);
        receipt.setFileOriginalName(fileOriginalName);
        receiptDAO.saveReceipt(receipt);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> requestReceiptVerification(String filePath, String targetStoreName) {
        try {
            String url = UriComponentsBuilder
                .fromHttpUrl(OCR_VERIFY_URL)
                .queryParam("file_path", filePath)
                .queryParam("target_store_name", targetStoreName)
                .build()
                .toUriString();
            System.out.println(url);
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null) {
                throw new IllegalStateException("OCR 서버 응답이 비어 있습니다.");
            }
            return response;
        } catch (RestClientException e) {
            System.out.println(e.getMessage());
            throw new IllegalStateException("OCR 서버 호출에 실패했습니다.", e);
        }
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String extractFileName(String filePath) {
        Path path = Paths.get(filePath);
        Path fileName = path.getFileName();
        return fileName == null ? filePath : fileName.toString();
    }
}
