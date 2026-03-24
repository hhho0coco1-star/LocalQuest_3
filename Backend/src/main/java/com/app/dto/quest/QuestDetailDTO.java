package com.app.dto.quest;

import java.util.Date;
import java.util.List;

import lombok.Data;

@Data
public class QuestDetailDTO {
    private int questId;
    private String title;
    private String description;
    private String category;
    private int rewardExp;
    private int rewardPoint;
    private Integer timeLimit;
    private String status;
    private Date createdAt;
    private List<QuestLocationInfoDTO> locations;
}
