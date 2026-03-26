package com.app.service.userquest;

import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

import com.app.dto.userquest.UserQuestDetailDTO;
import com.app.dto.userquest.UserQuestDTO;
import com.app.dto.userquest.UserQuestOverviewDTO;

import com.app.dto.locationqr.QrVerificationResponseDTO;
import com.app.dto.userquest.UserQuestDTO;
import com.app.dto.userquest.UserQuestSummaryDTO;

public interface UserQuestService {
    public int saveUserQuest(UserQuestDTO userQuest);

    public UserQuestOverviewDTO getUserQuestOverview(int userId);

    public UserQuestDetailDTO getUserQuestDetail(int userId, int userQuestId);

    public Map<String, Object> completeQuest(int userId, int userQuestId);

    public Map<String, Object> cancelQuest(int userId, int userQuestId);

    public Map<String, Object> verifyReceiptAndCompleteLocation(
        int userId,
        int userQuestId,
        int questLocationId,
        MultipartFile receiptImage
    );

    public Map<String, Object> verifyGpsAndCompleteLocation(
        int userId,
        int userQuestId,
        int questLocationId,
        Double latitude,
        Double longitude
    );

    public Map<String, Object> verifyQrAndCompleteLocation(
        int userId,
        int userQuestId,
        int questLocationId,
        String qrAuthKey
    );

    Map<String, Object> acceptQuest(int userId, int questId);

    UserQuestSummaryDTO getUserQuestSummary(int userId, int questId);

    List<UserQuestSummaryDTO> getUserQuestSummaries(int userId);

    QrVerificationResponseDTO verifyLocationQr(int userId, String qrAuthKey);
}
