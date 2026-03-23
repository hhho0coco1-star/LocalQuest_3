package com.app.dao.location.impl;

import java.util.List;

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
    public int saveLocation(LocationDTO location) {
        int result = sqlSessionTemplate.insert("location_mapper.saveLocation", location);
        return result;
    }

    @Override
    public int deleteUnusedLocationsByIds(List<Integer> locationIds) {
        if (locationIds == null || locationIds.isEmpty()) {
            return 0;
        }
        return sqlSessionTemplate.delete("location_mapper.deleteUnusedLocationsByIds", locationIds);
    }
}
