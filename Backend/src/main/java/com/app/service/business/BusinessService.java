package com.app.service.business;

import java.util.List;
import java.util.Map;

import com.app.dto.business.BusinessDashboardDTO;
import com.app.dto.business.BusinessDTO;
import com.app.dto.business.BusinessHourlyAuthDTO;

public interface BusinessService {
    public List<BusinessDTO> getBusinessList(Map<String, Object> params);

    public BusinessDTO getBusinessById(int businessId);

    public BusinessDTO getBusinessByUserId(int userId);

    public Map<String, Object> getBusinessAuthSummary(int businessId);

    public BusinessDashboardDTO getBusinessDashboardByBusinessId(int businessId);

    public List<BusinessHourlyAuthDTO> getBusinessHourlyAuthCounts(int businessId);

    public boolean registerBusiness(BusinessDTO business);

    public boolean updateBusiness(BusinessDTO business);

    public boolean deleteBusiness(int businessId);
}
