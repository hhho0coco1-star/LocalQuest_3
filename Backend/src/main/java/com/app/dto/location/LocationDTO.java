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
    private Double latitude;
    private Double longitude;
    private String locationType;
    private String description;
    private LocalDateTime createdAt;
}
