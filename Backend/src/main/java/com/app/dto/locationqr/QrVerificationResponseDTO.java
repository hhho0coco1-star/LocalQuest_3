package com.app.dto.locationqr;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class QrVerificationResponseDTO {
    private String qrAuthKey;
    private Integer locationId;
    private String locationName;
    private int matchedQuestCount;
    private int verifiedQuestCount;
    private int completedQuestCount;
    private String message;
    private List<QrVerificationQuestResultDTO> results = new ArrayList<>();
}
