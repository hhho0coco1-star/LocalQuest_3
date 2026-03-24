package com.app.dao.questlocation;

import com.app.dto.questlocation.QuestLocationDTO;

public interface QuestLocationDAO {
    public int saveQuestLocation(QuestLocationDTO questLocation);

    public int deleteQuestLocationsByQuestId(int questId);
}
