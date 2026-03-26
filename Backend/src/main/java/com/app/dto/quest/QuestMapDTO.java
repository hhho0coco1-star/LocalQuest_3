package com.app.dto.quest;

import lombok.Data;

@Data
public class QuestMapDTO {
    private int questId;
    private String title;
    private String description;
    private String category;
    private int rewardExp;
    private int rewardPoint;
    private Integer timeLimit;
    private String status;
    private int questLocationId;
    private int locationId;
    private int visitOrder;
    private String locationName;
    private String address;
    private String addressDetail;
    private Double latitude;
    private Double longitude;
    private String locationType;
}
