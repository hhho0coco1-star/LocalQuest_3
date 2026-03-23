package com.app.dao.location;

import java.util.List;

import com.app.dto.location.LocationDTO;

public interface LocationDAO {
    public int saveLocation(LocationDTO location);

    public int deleteUnusedLocationsByIds(List<Integer> locationIds);
}
