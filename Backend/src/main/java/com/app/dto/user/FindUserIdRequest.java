package com.app.dto.user;

import lombok.Data;

@Data
public class FindUserIdRequest {
	private String name;
	private String email;
}
