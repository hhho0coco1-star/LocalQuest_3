package com.app.service.userquest;

import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

import com.app.dto.userquest.UserQuestDetailDTO;
import com.app.dto.userquest.UserQuestDTO;
import com.app.dto.userquest.UserQuestOverviewDTO;
import com.app.dto.userquest.UserQuestSummaryDTO;

public interface UserQuestService {
    public int saveUserQuest(UserQuestDTO userQuest);

    public List<UserQuestSummaryDTO> getUserQuestSummaries(int userId);

    public UserQuestOverviewDTO getUserQuestOverview(int userId);

    public UserQuestDetailDTO getUserQuestDetail(int userId, int userQuestId);

    public Map<String, Object> verifyReceiptAndCompleteLocation(
        int userId,
        int userQuestId,
        int questLocationId,
        MultipartFile receiptImage
    );
}
