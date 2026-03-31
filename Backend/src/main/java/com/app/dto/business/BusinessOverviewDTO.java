package com.app.dto.business;

import com.app.dto.locationqr.BusinessQrInfoDTO;

import lombok.Data;

@Data
public class BusinessOverviewDTO {
    private BusinessDTO business;
    private BusinessDashboardDTO dashboard;
    private BusinessQrInfoDTO qr;
}

