package com.app.service.reward.impl;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.dao.reward.RewardItemDAO;
import com.app.dto.reward.RewardItemDTO;
import com.app.service.reward.RewardItemService;

@Service
public class RewardItemServiceImpl implements RewardItemService{

	@Autowired
	RewardItemDAO rewardItemDAO;
	
	@Override
    public List<RewardItemDTO> getSearchItems(Map<String, Object> params) {
        return rewardItemDAO.selectSearchItems(params);
    }

    @Override
    public boolean registerItem(RewardItemDTO item) {
        // insert 결과가 1이면 true 반환
        return rewardItemDAO.insertItem(item) > 0;
    }

    @Override
    public int saveRewardItem(RewardItemDTO rewardItem) {
    	return rewardItemDAO.saveRewardItem(rewardItem);
    }

    @Override
    public boolean modifyItem(RewardItemDTO item) {
        // update 결과가 1이면 true 반환
        return rewardItemDAO.updateItem(item) > 0;
    }

    @Override
    public boolean changeItemStatus(int itemId, String status) {
        // 상태 변경 결과가 1이면 true 반환
        return rewardItemDAO.updateItemStatus(itemId, status) > 0;
    }
}
