package com.app.service.business;

import java.util.List;
import java.util.Map;

import com.app.dto.business.BusinessDTO;

public interface BusinessService {
    public List<BusinessDTO> getBusinessList(Map<String, Object> params);

    public BusinessDTO getBusinessById(int businessId);

    public BusinessDTO getBusinessByUserId(int userId);

    public boolean registerBusiness(BusinessDTO business);

    public boolean updateBusiness(BusinessDTO business);

    public boolean deleteBusiness(int businessId);
}
