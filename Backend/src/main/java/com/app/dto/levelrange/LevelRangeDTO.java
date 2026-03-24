package com.app.dto.levelrange;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class LevelRangeDTO {
    private int levelId;
    private int levelNo;
    private int minExp;
    private int maxExp;
}
