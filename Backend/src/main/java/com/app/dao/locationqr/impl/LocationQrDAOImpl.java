package com.app.dao.locationqr.impl;

import java.util.Locale;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.locationqr.LocationQrDAO;
import com.app.dto.locationqr.LocationQrDTO;

@Repository
public class LocationQrDAOImpl implements LocationQrDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public LocationQrDTO findLatestLocationQrByLocationId(int locationId) {
        return sqlSessionTemplate.selectOne("locationqr_mapper.findLatestLocationQrByLocationId", locationId);
    }

    @Override
    public LocationQrDTO findActiveLocationQrByAuthKey(String qrAuthKey) {
        return sqlSessionTemplate.selectOne("locationqr_mapper.findActiveLocationQrByAuthKey", qrAuthKey);
    }

    @Override
    public LocationQrDTO findLatestLocationQrByAuthKey(String qrAuthKey) {
        return sqlSessionTemplate.selectOne("locationqr_mapper.findLatestLocationQrByAuthKey", qrAuthKey);
    }

    @Override
    public int saveLocationQr(LocationQrDTO locationQr) {
        try {
            return sqlSessionTemplate.insert("locationqr_mapper.saveLocationQr", locationQr);
        } catch (Exception e) {
            if (isLocationQrSequenceUnavailable(e)) {
                return sqlSessionTemplate.insert("locationqr_mapper.saveLocationQrWithoutSequence", locationQr);
            }
            throw e;
        }
    }

    @Override
    public int updateLocationQr(LocationQrDTO locationQr) {
        return sqlSessionTemplate.update("locationqr_mapper.updateLocationQr", locationQr);
    }

    private boolean isLocationQrSequenceUnavailable(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                String upperMessage = message.toUpperCase(Locale.ROOT);
                if (upperMessage.contains("ORA-02289")
                    || upperMessage.contains("SEQ_LQ_LOCATION_QR_PK")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }
}
