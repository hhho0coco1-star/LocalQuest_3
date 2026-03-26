package com.app.dto.inquiry;

import java.util.List;

public final class InquiryStatus {

    public static final String PENDING = "PENDING";
    public static final String ANSWERED = "ANSWERED";

    public static final List<String> ADMIN_SEARCH_STATUSES = List.of(
        PENDING,
        ANSWERED
    );

    private InquiryStatus() {
    }
}
