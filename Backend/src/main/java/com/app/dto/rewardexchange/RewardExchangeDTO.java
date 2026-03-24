package com.app.dto.rewardexchange;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class RewardExchangeDTO {
    private int exchangeId;
    private int userId;
    private int rewardItemId;
    private int usedPoint;
    private String status;
    private LocalDateTime expiredAt;
    private LocalDateTime usedAt;
    private LocalDateTime exchangedAt;
}
