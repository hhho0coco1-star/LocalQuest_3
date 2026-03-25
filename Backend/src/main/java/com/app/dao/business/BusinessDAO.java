package com.app.dao.business;

import java.util.List;
import java.util.Map;

import com.app.dto.business.BusinessDashboardDTO;
import com.app.dto.business.BusinessDTO;
import com.app.dto.business.BusinessHourlyAuthDTO;

public interface BusinessDAO {
    public List<BusinessDTO> getBusinessList(Map<String, Object> params);

    public BusinessDTO getBusinessById(int businessId);

    public BusinessDTO getBusinessByUserId(int userId);

    public Map<String, Object> getBusinessAuthSummary(int businessId);

    public BusinessDashboardDTO getBusinessDashboardByBusinessId(int businessId);

    public List<BusinessHourlyAuthDTO> getBusinessHourlyAuthCounts(int businessId);

    public int saveBusiness(BusinessDTO business);

    public int updateBusiness(BusinessDTO business);

    public int deleteBusiness(int businessId);
}
