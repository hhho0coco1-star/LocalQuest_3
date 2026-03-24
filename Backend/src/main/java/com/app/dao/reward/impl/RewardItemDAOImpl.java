package com.app.dao.reward.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.reward.RewardItemDAO;
import com.app.dto.reward.RewardItemDTO;

@Repository
public class RewardItemDAOImpl implements RewardItemDAO{

	@Autowired 
	SqlSessionTemplate sqlSessionTemplate;
	
    private static final String NAMESPACE = "reward_item_mapper";
    
    @Override
    public List<RewardItemDTO> selectSearchItems(Map<String, Object> params) {
    	return sqlSessionTemplate.selectList(NAMESPACE + ".selectSearchItems", params);
    }

    @Override
    public int saveRewardItem(RewardItemDTO rewardItem) {
    	return sqlSessionTemplate.insert(NAMESPACE + ".saveRewardItem", rewardItem);
    }

    @Override
    public int insertItem(RewardItemDTO item) {
        return sqlSessionTemplate.insert(NAMESPACE + ".insertItem", item);
    }
    @Override
    public int updateItem(RewardItemDTO item) {
        return sqlSessionTemplate.update(NAMESPACE + ".updateItem", item);
    }
    @Override
    public int updateItemStatus(int itemId, String status) {
        Map<String, Object> map = new HashMap<>();
        map.put("rewardItemId", itemId);
        map.put("status", status);
        return sqlSessionTemplate.update(NAMESPACE + ".updateItemStatus", map);
    }
}
