package com.app.dao.businessinquiry;

import java.util.List;
import java.util.Map;

import com.app.dto.businessinquiry.BusinessInquiryDTO;

public interface BusinessInquiryDAO {
    public List<BusinessInquiryDTO> getBusinessInquiryList(Map<String, Object> params);

    public BusinessInquiryDTO getBusinessInquiryById(int inquiryId);

    public int saveBusinessInquiry(BusinessInquiryDTO businessInquiry);

    public int updateBusinessInquiryStatus(Map<String, Object> params);

    public int deleteBusinessInquiry(int inquiryId);
}
