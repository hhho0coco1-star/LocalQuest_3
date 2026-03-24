package com.app.dto.user;

import lombok.Data;

@Data
public class UpdateMyProfileRequest {
	private String nickname;
	private String password;
}
