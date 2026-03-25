package com.app.dto.push;

import lombok.Data;

@Data
public class PushDispatchResultDTO {
    private int successCount;
    private int failCount;
    private int skippedCount;
}
