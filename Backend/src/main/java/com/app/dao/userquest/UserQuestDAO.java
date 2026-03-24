package com.app.dao.userquest;

import java.util.List;

import com.app.dto.userquest.UserQuestDTO;
import com.app.dto.userquest.UserQuestSummaryDTO;

public interface UserQuestDAO {
    public int saveUserQuest(UserQuestDTO userQuest);

    UserQuestDTO findUserQuestByUserIdAndQuestId(UserQuestDTO userQuest);

    int updateUserQuestForAccept(UserQuestDTO userQuest);

    int completeUserQuest(UserQuestDTO userQuest);

    List<UserQuestSummaryDTO> findUserQuestSummariesByUserId(int userId);
}
