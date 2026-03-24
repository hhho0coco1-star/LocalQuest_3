package com.app.dao.receipt.impl;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.receipt.ReceiptDAO;
import com.app.dto.receipt.ReceiptDTO;

@Repository
public class ReceiptDAOImpl implements ReceiptDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int saveReceipt(ReceiptDTO receipt) {
        return sqlSessionTemplate.insert("receipt_mapper.saveReceipt", receipt);
    }
}
