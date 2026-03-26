package com.app.dao.location.impl;

import java.util.List;
import java.util.Locale;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.location.LocationDAO;
import com.app.dto.location.LocationDTO;

@Repository
public class LocationDAOImpl implements LocationDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public List<LocationDTO> searchLocations(String keyword) {
        return sqlSessionTemplate.selectList("location_mapper.searchLocations", keyword);
    }

    @Override
    public LocationDTO findRepresentativeLocationByBusinessId(int businessId) {
        return sqlSessionTemplate.selectOne("location_mapper.findRepresentativeLocationByBusinessId", businessId);
    }

    @Override
    public int saveLocation(LocationDTO location) {
        try {
            return sqlSessionTemplate.insert("location_mapper.saveLocation", location);
        } catch (Exception e) {
            if (isLocationSequenceUnavailable(e)) {
                return sqlSessionTemplate.insert("location_mapper.saveLocationWithoutSequence", location);
            }
            throw e;
        }
    }

    @Override
    public int updateLocation(LocationDTO location) {
        return sqlSessionTemplate.update("location_mapper.updateLocation", location);
    }

    @Override
    public int updateRepresentativeLocation(LocationDTO location) {
        return sqlSessionTemplate.update("location_mapper.updateRepresentativeLocation", location);
    }

    @Override
    public int deleteUnusedLocationsByIds(List<Integer> locationIds) {
        if (locationIds == null || locationIds.isEmpty()) {
            return 0;
        }
        return sqlSessionTemplate.delete("location_mapper.deleteUnusedLocationsByIds", locationIds);
    }

    @Override
    public String findActiveQrAuthKeyByLocationId(int locationId) {
        return sqlSessionTemplate.selectOne("location_mapper.findActiveQrAuthKeyByLocationId", locationId);
    }

    private boolean isLocationSequenceUnavailable(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                String upperMessage = message.toUpperCase(Locale.ROOT);
                if (upperMessage.contains("ORA-02289")
                    || upperMessage.contains("SEQ_LQ_LOCATION_PK")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }
}
