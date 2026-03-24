package com.app.dao.faq.impl;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.faq.FAQDAO;
import com.app.dto.faq.FAQDTO;

@Repository
public class FAQDAOImpl implements FAQDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int saveFAQ(FAQDTO faq) {
        int result = sqlSessionTemplate.insert("faq_mapper.saveFAQ", faq);
        return result;
    }
}
