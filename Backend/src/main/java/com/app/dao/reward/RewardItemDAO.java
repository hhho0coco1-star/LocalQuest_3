package com.app.dao.reward;

import java.util.List;
import java.util.Map;

import com.app.dto.reward.RewardItemDTO;

public interface RewardItemDAO {
	
	List<RewardItemDTO> selectSearchItems(Map<String, Object> params);

	int saveRewardItem(RewardItemDTO rewardItem);
	
    int insertItem(RewardItemDTO item);
    
    int updateItem(RewardItemDTO item);
    
    int updateItemStatus(int itemId, String status);
    
}
