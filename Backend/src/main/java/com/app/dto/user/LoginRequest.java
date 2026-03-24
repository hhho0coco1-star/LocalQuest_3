package com.app.dto.user;

import lombok.Data;

@Data
public class LoginRequest {
	private String userId;
	private String password;
}
