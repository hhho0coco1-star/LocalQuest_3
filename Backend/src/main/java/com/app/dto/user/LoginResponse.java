package com.app.dto.user;

import lombok.Data;

@Data
public class LoginResponse {
	private String accessToken;
	private String tokenType;
	private long expiresIn;
	private int userId;
	private String userLoginId;
	private String name;
	private String nickname;
	private String role;
}
