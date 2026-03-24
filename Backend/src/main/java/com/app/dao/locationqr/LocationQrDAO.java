package com.app.dao.locationqr;

import com.app.dto.locationqr.LocationQrDTO;

public interface LocationQrDAO {
    public LocationQrDTO findLatestLocationQrByLocationId(int locationId);

    public LocationQrDTO findActiveLocationQrByAuthKey(String qrAuthKey);

    public int saveLocationQr(LocationQrDTO locationQr);

    public int updateLocationQr(LocationQrDTO locationQr);
}
