package com.app.dto.business;

import lombok.Data;

@Data
public class BusinessHourlyAuthDTO {
    private int hourOfDay;
    private long authCount;
}
