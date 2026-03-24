package com.app.dao.user;

import java.util.List;
import java.util.Map;

import com.app.dto.user.User;

public interface UserDAO {
	
	public int saveUser(User user);
	public int countByUserLoginId(String userLoginId);
	public int countByNickname(String nickname);
	public int countByEmail(String email);
	public User findByUserId(int userId);
	public User findByUserLoginId(String userLoginId);
	public User findByEmail(String email);
	public User findActiveUserByNameAndEmail(User user);
	public User findActiveUserByUserLoginIdAndEmail(User user);
	public int updateMyProfileByUserId(User user);
	public int updatePasswordByUserId(User user);
	public int updateSocialProfileByUserId(User user);
	
	// 1. 전체 회원 목록 조회
    // 2. 회원 검색 (아이디, 닉네임 등)
    List<User> searchUsers(Map<String, Object> params);

    // 3. 회원 권한(ROLE) 변경
    public int updateUserRole(Map<String, Object> roleMap);

    // 4. 회원 상태(STATUS) 변경 (정지/탈퇴)
    public int updateUserStatus(Map<String, Object> statusMap);
}
