package com.app.service.userquest.impl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import com.app.dao.receipt.ReceiptDAO;
import com.app.dao.userquest.UserQuestDAO;
import com.app.dao.userquestprogress.UserQuestProgressDAO;
import com.app.dto.receipt.ReceiptDTO;
import com.app.dto.userquest.UserQuestDetailDTO;
import com.app.dto.userquest.UserQuestDetailLocationDTO;
import com.app.dto.userquest.UserQuestDTO;
import com.app.dto.userquest.UserQuestOverviewDTO;
import com.app.dto.userquest.UserQuestSummaryDTO;
import com.app.service.userquest.UserQuestService;

@Service
public class UserQuestServiceImpl implements UserQuestService {

    private static final String OCR_VERIFY_URL = "http://localhost:8000/ocr";
    private static final Path RECEIPT_UPLOAD_DIR = Paths.get("D:/fileStorage");

    @Autowired
    private UserQuestDAO dao;

    @Autowired
    private ReceiptDAO receiptDAO;

    @Autowired
    private UserQuestProgressDAO userQuestProgressDAO;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    @Transactional
    public int saveUserQuest(UserQuestDTO userQuest) {
        return dao.saveUserQuest(userQuest);
    }

    @Override
    public List<UserQuestSummaryDTO> getUserQuestSummaries(int userId) {
        return dao.findUserQuestSummariesByUserId(userId);
    }

    @Override
    public UserQuestOverviewDTO getUserQuestOverview(int userId) {
        List<UserQuestSummaryDTO> allQuests = getUserQuestSummaries(userId);
        List<UserQuestSummaryDTO> ongoingQuests = new ArrayList<>();
        List<UserQuestSummaryDTO> completedQuests = new ArrayList<>();
        int totalRewardPoint = 0;

        for (UserQuestSummaryDTO quest : allQuests) {
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
        UserQuestDetailDTO detail = dao.findUserQuestDetailByUserQuestId(userQuestId);
        if (detail == null || detail.getUserId() != userId) {
            return null;
        }

        detail.setLocations(dao.findUserQuestDetailLocationsByUserQuestId(userQuestId));
        return detail;
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
            throw new IllegalArgumentException("영수증 이미지를 선택해주세요.");
        }

        UserQuestDetailDTO detail = getUserQuestDetail(userId, userQuestId);
        if (detail == null) {
            throw new IllegalArgumentException("내 퀘스트 정보를 찾을 수 없습니다.");
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

        int completedCount = dao.countCompletedLocationsByUserQuestId(userQuestId);
        int totalCount = dao.countTotalLocationsByUserQuestId(userQuestId);

        if (totalCount > 0 && completedCount >= totalCount) {
            dao.updateUserQuestStatusAndCompletedAt(userQuestId, "COMPLETED", completedAt);
        } else {
            dao.updateUserQuestStatusAndCompletedAt(userQuestId, "IN_PROGRESS", null);
        }

        response.put("message", "영수증 인증이 완료되었습니다.");
        response.put("detail", getUserQuestDetail(userId, userQuestId));
        return response;
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
