package com.app.service.location;

import java.util.List;

import com.app.dto.location.LocationDTO;

public interface LocationService {
    public List<LocationDTO> searchLocations(String keyword);

    public int saveLocation(LocationDTO location);

    public int deleteUnusedLocationsByIds(List<Integer> locationIds);
}
