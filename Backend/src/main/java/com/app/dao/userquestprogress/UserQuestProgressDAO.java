package com.app.dao.userquestprogress;

import java.util.List;

import com.app.dto.locationqr.UserQuestQrVerificationTargetDTO;
import com.app.dto.userquestprogress.UserQuestProgressDTO;

public interface UserQuestProgressDAO {
    public int saveUserQuestProgress(UserQuestProgressDTO userQuestProgress);

    int deleteUserQuestProgressByUserQuestId(int userQuestId);

    List<UserQuestQrVerificationTargetDTO> findQrVerificationTargets(int userId, int locationId);

    int completeUserQuestProgress(UserQuestProgressDTO userQuestProgress);

    int countIncompleteProgressByUserQuestId(int userQuestId);
}
