package com.app.dao.location;

import java.util.List;

import com.app.dto.location.LocationDTO;

public interface LocationDAO {
    public List<LocationDTO> searchLocations(String keyword);

    public LocationDTO findRepresentativeLocationByBusinessId(int businessId);

    public int saveLocation(LocationDTO location);

    public int updateRepresentativeLocation(LocationDTO location);

    public int deleteUnusedLocationsByIds(List<Integer> locationIds);
}
