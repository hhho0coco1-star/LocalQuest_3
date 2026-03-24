package com.app.dao.pointhistory;

import com.app.dto.pointhistory.PointHistoryDTO;

public interface PointHistoryDAO {
    public int savePointHistory(PointHistoryDTO pointHistory);
}
