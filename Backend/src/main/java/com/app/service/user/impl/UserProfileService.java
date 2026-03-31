package com.app.service.user.impl;

import java.util.HashMap;
import java.util.Map;

import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.user.UserDAO;
import com.app.dto.user.User;

@Service
public class UserProfileService {
	@Autowired
	private UserDAO userDAO;

	public User getUserProfileById(int userId) {
		if (userId <= 0) {
			return null;
		}

		User user = userDAO.findByUserId(userId);
		if (user == null) {
			return null;
		}

		if (user.getStatus() != null && !"ACTIVE".equalsIgnoreCase(user.getStatus())) {
			return null;
		}

		return user;
	}

	@Transactional
	public User updateMyProfile(int userId, String nickname, String newPassword) {
		if (userId <= 0) {
			throw new IllegalArgumentException("Invalid user information.");
		}

		User currentUser = userDAO.findByUserId(userId);
		if (currentUser == null || (currentUser.getStatus() != null && !"ACTIVE".equalsIgnoreCase(currentUser.getStatus()))) {
			throw new IllegalArgumentException("Cannot find active user.");
		}

		String normalizedNickname = trimToEmpty(nickname);
		String normalizedPassword = trimToEmpty(newPassword);
		String currentNickname = trimToEmpty(currentUser.getNickname());

		if (normalizedNickname.isEmpty()) {
			normalizedNickname = currentNickname;
		}

		boolean nicknameChanged = !normalizedNickname.equals(currentNickname);
		if (nicknameChanged && !isNicknameAvailable(normalizedNickname)) {
			throw new IllegalArgumentException("Nickname is already in use.");
		}

		boolean passwordChanged = !normalizedPassword.isEmpty();
		if (!nicknameChanged && !passwordChanged) {
			return currentUser;
		}

		User updateTarget = new User();
		updateTarget.setUserId(userId);

		if (nicknameChanged) {
			updateTarget.setNickname(normalizedNickname);
		}

		if (passwordChanged) {
			updateTarget.setPassword(BCrypt.hashpw(normalizedPassword, BCrypt.gensalt()));
		}

		int updatedCount = userDAO.updateMyProfileByUserId(updateTarget);
		if (updatedCount != 1) {
			throw new IllegalStateException("Failed to update profile.");
		}

		User updatedUser = userDAO.findByUserId(userId);
		if (updatedUser == null || (updatedUser.getStatus() != null && !"ACTIVE".equalsIgnoreCase(updatedUser.getStatus()))) {
			throw new IllegalStateException("Updated user profile is not available.");
		}

		return updatedUser;
	}

	@Transactional
	public boolean withdrawUser(int userId) {
		if (userId <= 0) {
			return false;
		}

		User currentUser = userDAO.findByUserId(userId);
		if (currentUser == null) {
			return false;
		}

		if ("WITHDRAWN".equalsIgnoreCase(trimToEmpty(currentUser.getStatus()))) {
			return true;
		}

		Map<String, Object> statusMap = new HashMap<>();
		statusMap.put("userId", userId);
		statusMap.put("newStatus", "WITHDRAWN");
		return userDAO.updateUserStatus(statusMap) == 1;
	}

	private boolean isNicknameAvailable(String nickname) {
		String trimmedNickname = trimToEmpty(nickname);
		if (trimmedNickname.isEmpty()) {
			return false;
		}

		return userDAO.countByNickname(trimmedNickname) == 0;
	}

	private String trimToEmpty(String value) {
		return value == null ? "" : value.trim();
	}
}
