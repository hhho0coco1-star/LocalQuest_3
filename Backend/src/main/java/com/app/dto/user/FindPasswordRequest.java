package com.app.dto.user;

import lombok.Data;

@Data
public class FindPasswordRequest {
	private String userId;
	private String email;
}
