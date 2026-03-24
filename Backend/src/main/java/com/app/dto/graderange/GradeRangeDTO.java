package com.app.dto.graderange;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class GradeRangeDTO {
    private int gradeId;
    private String gradeName;
    private int minLevel;
    private int maxLevel;
    private String iconUrl;
}
