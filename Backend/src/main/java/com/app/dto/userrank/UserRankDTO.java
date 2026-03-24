package com.app.dto.userrank;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class UserRankDTO {
    private int rankId;
    private int userId;
    private int totalExp;
    private int ranking;
}
