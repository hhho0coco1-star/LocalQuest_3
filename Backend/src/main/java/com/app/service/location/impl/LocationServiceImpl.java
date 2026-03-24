package com.app.service.location.impl;

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
    @Transactional
    public int saveLocation(LocationDTO location) {
        return dao.saveLocation(location);
    }
}
