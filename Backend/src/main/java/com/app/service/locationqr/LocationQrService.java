package com.app.service.locationqr;

import com.app.dto.locationqr.BusinessQrInfoDTO;

public interface LocationQrService {
    public BusinessQrInfoDTO getOrCreateBusinessQrInfo(int businessId);

    public byte[] renderQrImage(String qrContent, int size);

    public String buildQrVerifyUrl(String frontendBaseUrl, String qrAuthKey);
}
