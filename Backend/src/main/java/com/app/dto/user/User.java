package com.app.dto.user;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class User {
	
	int userId;
	String userLoginId;
	String name;
	String email;
	String password;
	String nickname;
	String birth;
	String gender;
	String role;
	int exp;
	int point;
	String status;
	LocalDateTime createdAt;
	
}
