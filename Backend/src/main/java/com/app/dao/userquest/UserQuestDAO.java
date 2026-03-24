package com.app.dao.userquest;

import java.util.List;

import com.app.dto.userquest.UserQuestDetailDTO;
import com.app.dto.userquest.UserQuestDetailLocationDTO;
import com.app.dto.userquest.UserQuestDTO;
import com.app.dto.userquest.UserQuestSummaryDTO;

public interface UserQuestDAO {
    public int saveUserQuest(UserQuestDTO userQuest);

    public UserQuestDTO findLatestUserQuestByUserIdAndQuestId(int userId, int questId);

    public List<UserQuestSummaryDTO> findUserQuestSummariesByUserId(int userId);

    public UserQuestDetailDTO findUserQuestDetailByUserQuestId(int userQuestId);

    public List<UserQuestDetailLocationDTO> findUserQuestDetailLocationsByUserQuestId(int userQuestId);

    public int countTotalLocationsByUserQuestId(int userQuestId);

    public int countCompletedLocationsByUserQuestId(int userQuestId);

    public int updateUserQuestStatusAndCompletedAt(int userQuestId, String status, java.util.Date completedAt);

    public int updateUserQuestLifecycle(
        int userQuestId,
        String status,
        java.time.LocalDateTime startedAt,
        java.time.LocalDateTime dueAt,
        java.util.Date completedAt
    );

    public int deleteUserQuest(int userQuestId);
    UserQuestDTO findUserQuestByUserIdAndQuestId(UserQuestDTO userQuest);

    int updateUserQuestForAccept(UserQuestDTO userQuest);
}
