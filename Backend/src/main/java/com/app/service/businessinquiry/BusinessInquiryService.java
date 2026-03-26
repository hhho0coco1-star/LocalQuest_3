package com.app.service.businessinquiry;

import java.util.List;
import java.util.Map;

import com.app.dto.businessinquiry.BusinessInquiryDTO;

public interface BusinessInquiryService {
    public List<BusinessInquiryDTO> getBusinessInquiryList(Map<String, Object> params);

    public BusinessInquiryDTO getBusinessInquiryById(int inquiryId);

    public boolean saveBusinessInquiry(BusinessInquiryDTO businessInquiry);

    public boolean updateBusinessInquiryStatus(int inquiryId, String status);

    public boolean deleteBusinessInquiry(int inquiryId);
}
