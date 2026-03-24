package com.app.dao.userquestprogress;

import com.app.dto.userquestprogress.UserQuestProgressDTO;

public interface UserQuestProgressDAO {
    public int saveUserQuestProgress(UserQuestProgressDTO userQuestProgress);

    int deleteUserQuestProgressByUserQuestId(int userQuestId);
}
