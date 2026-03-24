package com.app.dao.receipt;

import com.app.dto.receipt.ReceiptDTO;

public interface ReceiptDAO {
    public int saveReceipt(ReceiptDTO receipt);
}
