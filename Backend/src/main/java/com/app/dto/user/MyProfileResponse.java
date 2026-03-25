package com.app.dto.user;

import lombok.Data;

@Data
public class MyProfileResponse {
	private int userId;
	private String userLoginId;
	private String name;
	private String email;
	private String nickname;
	private String birth;
	private String gender;
	private String role;
	private String status;
	private String createdAt;
}
