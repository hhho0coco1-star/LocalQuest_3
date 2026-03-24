package com.app.service.reward;

import java.util.List;
import java.util.Map;

import com.app.dto.reward.RewardItemDTO;

public interface RewardItemService {

	/**
     * 조건별 리워드 아이템 검색 및 목록 조회
     * @param params (status: 상태필터, keyword: 아이템명 검색어)
     */
    List<RewardItemDTO> getSearchItems(Map<String, Object> params);
    
    /**
     * 새 리워드 아이템 등록
     * @return 성공 여부 (true: 성공)
     */
    boolean registerItem(RewardItemDTO item);

    int saveRewardItem(RewardItemDTO rewardItem);
    
    /**
     * 리워드 아이템 정보 수정 (이름, 설명, 가격, 재고 등)
     * @return 성공 여부 (true: 성공)
     */
    boolean modifyItem(RewardItemDTO item);
    
    /**
     * 아이템 상태만 변경 (판매중, 품절, 숨김, 삭제 등)
     * @param itemId 아이템 PK
     * @param status 변경할 상태 코드
     * @return 성공 여부 (true: 성공)
     */
    boolean changeItemStatus(int itemId, String status);
}
