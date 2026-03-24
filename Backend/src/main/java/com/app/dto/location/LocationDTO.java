package com.app.dto.location;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class LocationDTO {
    private int locationId;
    private Integer businessId;
    private String name;
    private String zipCode;
    private String address;
    private String addressDetail;
    private double latitude;
    private double longitude;
    private String locationType;
    private String description;
    private LocalDateTime createdAt;
}
