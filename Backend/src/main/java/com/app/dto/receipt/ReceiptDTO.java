package com.app.dto.receipt;

import java.util.Date;

import lombok.Data;

@Data
public class ReceiptDTO {
    private int receiptId;
    private int userId;
    private int userQuestProgressId;
    private String category;
    private String verifyStatus;
    private String filePath;
    private String fileUploadName;
    private String fileOriginalName;
    private Date createdAt;
}
