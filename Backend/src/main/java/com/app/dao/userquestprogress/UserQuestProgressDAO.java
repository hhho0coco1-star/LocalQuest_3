package com.app.dao.userquestprogress;

import com.app.dto.userquestprogress.UserQuestProgressDTO;

public interface UserQuestProgressDAO {
    public int saveUserQuestProgress(UserQuestProgressDTO userQuestProgress);

    public int upsertCompletedProgress(int userQuestId, int questLocationId, java.util.Date completedAt);
}
