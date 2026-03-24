package com.app.service.faq.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.faq.FAQDAO;
import com.app.dto.faq.FAQDTO;
import com.app.service.faq.FAQService;

@Service
public class FAQServiceImpl implements FAQService {

    @Autowired
    private FAQDAO dao;

    @Override
    @Transactional
    public int saveFAQ(FAQDTO faq) {
        return dao.saveFAQ(faq);
    }
}
