package com.app.dao.businessauthlog;

import com.app.dto.business.BusinessAuthLogItemDTO;

public interface BusinessAuthLogDAO {
    int saveBusinessAuthLog(BusinessAuthLogItemDTO businessAuthLog);
}
