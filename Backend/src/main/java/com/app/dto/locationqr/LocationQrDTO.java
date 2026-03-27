package com.app.dto.locationqr;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class LocationQrDTO {
    private int qrId;
    private int locationId;
    private String qrAuthKey;
    private String qrImageUrl;
    private Integer isActive;
    private LocalDateTime createdAt;
}
