package com.app.dao.rewardexchange.impl;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.rewardexchange.RewardExchangeDAO;
import com.app.dto.rewardexchange.RewardExchangeDTO;

@Repository
public class RewardExchangeDAOImpl implements RewardExchangeDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public int saveRewardExchange(RewardExchangeDTO rewardExchange) {
        int result = sqlSessionTemplate.insert("rewardexchange_mapper.saveRewardExchange", rewardExchange);
        return result;
    }
}
