package com.app.dto.locationqr;

import lombok.Data;

@Data
public class BusinessQrInfoDTO {
    private int businessId;
    private String businessName;
    private int locationId;
    private String locationName;
    private String zipCode;
    private String address;
    private String addressDetail;
    private int qrId;
    private String qrAuthKey;
    private boolean active;
    private String imageUrl;
    private String verifyUrl;
}
