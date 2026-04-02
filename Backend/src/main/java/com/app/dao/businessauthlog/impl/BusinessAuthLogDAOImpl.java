package com.app.dao.businessauthlog.impl;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.businessauthlog.BusinessAuthLogDAO;
import com.app.dto.business.BusinessAuthLogItemDTO;

@Repository
public class BusinessAuthLogDAOImpl implements BusinessAuthLogDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int saveBusinessAuthLog(BusinessAuthLogItemDTO businessAuthLog) {
        return sqlSessionTemplate.insert("businessauthlog_mapper.saveBusinessAuthLog", businessAuthLog);
    }
}
