package com.app.service.rewardexchange.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.rewardexchange.RewardExchangeDAO;
import com.app.dto.rewardexchange.RewardExchangeDTO;
import com.app.service.rewardexchange.RewardExchangeService;

@Service
public class RewardExchangeServiceImpl implements RewardExchangeService {

    @Autowired
    private RewardExchangeDAO dao;

    @Override
    @Transactional
    public int saveRewardExchange(RewardExchangeDTO rewardExchange) {
        return dao.saveRewardExchange(rewardExchange);
    }
}
