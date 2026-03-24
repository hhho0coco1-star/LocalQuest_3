package com.app.service.userquest;

import java.util.List;

import com.app.dto.userquest.UserQuestDTO;
import com.app.dto.userquest.UserQuestSummaryDTO;

public interface UserQuestService {
    public int saveUserQuest(UserQuestDTO userQuest);

    UserQuestSummaryDTO acceptQuest(int userId, int questId);

    UserQuestSummaryDTO getUserQuestSummary(int userId, int questId);

    List<UserQuestSummaryDTO> getUserQuestSummaries(int userId);
}
