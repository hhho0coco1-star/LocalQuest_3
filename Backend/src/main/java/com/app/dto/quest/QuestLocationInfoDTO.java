package com.app.dto.quest;

import lombok.Data;

@Data
public class QuestLocationInfoDTO {
    private int questLocationId;
    private int locationId;
    private int visitOrder;
    private String name;
    private String zipCode;
    private String address;
    private String addressDetail;
    private Double latitude;
    private Double longitude;
    private String locationType;
    private String description;
}
