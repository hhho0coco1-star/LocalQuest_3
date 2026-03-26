package com.app.dto.userquest;

import java.util.List;

import lombok.Data;

@Data
public class UserQuestOverviewDTO {
    private List<UserQuestSummaryDTO> ongoingQuests;
    private List<UserQuestSummaryDTO> completedQuests;
    private int ongoingCount;
    private int completedCount;
    private int totalRewardPoint;
}
