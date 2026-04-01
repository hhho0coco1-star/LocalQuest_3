package com.app.service.location.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.location.LocationDAO;
import com.app.dto.location.LocationDTO;
import com.app.service.location.LocationService;

@Service
public class LocationServiceImpl implements LocationService {

    @Autowired
    private LocationDAO dao;

    @Override
    public List<LocationDTO> searchLocations(String keyword) {
        return dao.searchLocations(keyword);
    }

    @Override
    public LocationDTO findLocationById(int locationId) {
        return dao.findLocationById(locationId);
    }

    @Override
    public LocationDTO findRepresentativeLocationByBusinessId(int businessId) {
        return dao.findRepresentativeLocationByBusinessId(businessId);
    }

    @Override
    @Transactional
    public int saveLocation(LocationDTO location) {
        return dao.saveLocation(location);
    }

    @Override
    @Transactional
    public int updateLocation(LocationDTO location) {
        return dao.updateLocation(location);
    }

    @Override
    @Transactional
    public int updateRepresentativeLocation(LocationDTO location) {
        return dao.updateRepresentativeLocation(location);
    }

    @Override
    @Transactional
    public int deleteUnusedLocationsByIds(List<Integer> locationIds) {
        return dao.deleteUnusedLocationsByIds(locationIds);
    }

    @Override
    public String findActiveQrAuthKeyByLocationId(int locationId) {
        return dao.findActiveQrAuthKeyByLocationId(locationId);
    }
}
