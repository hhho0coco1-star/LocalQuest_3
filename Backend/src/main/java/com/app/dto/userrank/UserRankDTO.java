package com.app.dto.userrank;

import lombok.Data;

@Data
public class UserRankDTO {
    private int rankId;
    private String nickname;
    private int totalExp;
    private int ranking;
}
