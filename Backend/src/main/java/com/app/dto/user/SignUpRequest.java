package com.app.dto.user;

import lombok.Data;

@Data
public class SignUpRequest {
	private String userId;
	private String password;
	private String confirmPassword;
	private String nickname;
	private String email;
	private String name;
	private String birthYear;
	private String birthMonth;
	private String birthDay;
	private String gender;
}
