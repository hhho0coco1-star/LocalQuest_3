package com.app.dto.userquest;

import java.util.Date;

import lombok.Data;

@Data
public class UserQuestDetailLocationDTO {
    private Integer userQuestProgressId;
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
    private int isCompleted;
    private Date completedAt;
}
