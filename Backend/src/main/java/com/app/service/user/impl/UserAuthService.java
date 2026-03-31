package com.app.service.user.impl;

import java.time.LocalDate;

import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.push.PushDAO;
import com.app.dao.user.UserDAO;
import com.app.dto.push.UserNotificationSettingDTO;
import com.app.dto.user.LoginRequest;
import com.app.dto.user.LoginResponse;
import com.app.dto.user.SignUpRequest;
import com.app.dto.user.User;
import com.app.service.user.auth.JwtTokenProvider;
import com.app.validator.UserValidator;

@Service
public class UserAuthService {
	@Autowired
	private UserDAO userDAO;

	@Autowired
	private UserValidator userValidator;

	@Autowired
	private JwtTokenProvider jwtTokenProvider;

	@Autowired
	private PushDAO pushDAO;

	@Transactional
	public int signUp(SignUpRequest request) {
		userValidator.normalizeSignUpRequest(request);

		if (!isUserIdAvailable(request.getUserId())) {
			throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
		}

		if (!isNicknameAvailable(request.getNickname())) {
			throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
		}

		if (!isEmailAvailable(request.getEmail())) {
			throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
		}

		LocalDate birthDate = userValidator.parseBirthDate(
			request.getBirthYear(),
			request.getBirthMonth(),
			request.getBirthDay()
		);
		if (birthDate == null) {
			throw new IllegalArgumentException("올바른 생년월일을 입력해주세요.");
		}

		User user = new User();
		String encodedPassword = BCrypt.hashpw(request.getPassword(), BCrypt.gensalt());
		user.setUserLoginId(trimToEmpty(request.getUserId()));
		user.setPassword(encodedPassword);
		user.setName(trimToEmpty(request.getName()));
		user.setEmail(trimToEmpty(request.getEmail()));
		user.setNickname(trimToEmpty(request.getNickname()));
		user.setGender(trimToEmpty(request.getGender()).toUpperCase());
		user.setBirth(String.format(
			"%04d-%02d-%02d",
			birthDate.getYear(),
			birthDate.getMonthValue(),
			birthDate.getDayOfMonth()
		));
		user.setRole("USER");
		user.setStatus("ACTIVE");
		user.setExp(0);
		user.setPoint(0);

		int saveResult;
		try {
			saveResult = userDAO.saveUser(user);
		} catch (DataIntegrityViolationException exception) {
			throw new IllegalArgumentException(resolveDuplicateSignUpMessage(request), exception);
		}

		if (saveResult != 1) {
			throw new IllegalStateException("회원가입 처리 중 오류가 발생했습니다.");
		}

		User savedUser = userDAO.findByUserLoginId(user.getUserLoginId());
		if (savedUser == null || savedUser.getUserId() <= 0) {
			throw new IllegalStateException("회원가입 후 사용자 정보를 조회하지 못했습니다.");
		}

		saveInitialNotificationSetting(savedUser.getUserId(), Boolean.TRUE.equals(request.getMarketingAgree()));
		return saveResult;
	}

	public boolean isUserIdAvailable(String userLoginId) {
		String trimmedUserId = trimToEmpty(userLoginId);
		if (trimmedUserId.isEmpty()) {
			return false;
		}

		return userDAO.countByUserLoginId(trimmedUserId) == 0;
	}

	public boolean isNicknameAvailable(String nickname) {
		String trimmedNickname = trimToEmpty(nickname);
		if (trimmedNickname.isEmpty()) {
			return false;
		}

		return userDAO.countByNickname(trimmedNickname) == 0;
	}

	public boolean isEmailAvailable(String email) {
		String trimmedEmail = trimToEmpty(email);
		if (trimmedEmail.isEmpty()) {
			return false;
		}

		return userDAO.countByEmail(trimmedEmail) == 0;
	}

	public LoginResponse login(LoginRequest request) {
		userValidator.normalizeLoginRequest(request);
		String userLoginId = trimToEmpty(request.getUserId());
		User user = userDAO.findByUserLoginId(userLoginId);
		if (user == null) {
			return null;
		}

		if (user.getStatus() != null && !"ACTIVE".equalsIgnoreCase(user.getStatus())) {
			return null;
		}

		String rawPassword = request.getPassword() == null ? "" : request.getPassword();
		String encodedPassword = user.getPassword();
		if (encodedPassword == null || encodedPassword.isEmpty()) {
			return null;
		}

		try {
			if (!BCrypt.checkpw(rawPassword, encodedPassword)) {
				return null;
			}
		} catch (IllegalArgumentException e) {
			return null;
		}

		return buildLoginResponse(user);
	}

	private String resolveDuplicateSignUpMessage(SignUpRequest request) {
		if (request == null) {
			return "이미 사용 중인 계정 정보입니다.";
		}

		if (!isUserIdAvailable(request.getUserId())) {
			return "이미 사용 중인 아이디입니다.";
		}
		if (!isNicknameAvailable(request.getNickname())) {
			return "이미 사용 중인 닉네임입니다.";
		}
		if (!isEmailAvailable(request.getEmail())) {
			return "이미 사용 중인 이메일입니다.";
		}

		return "이미 사용 중인 계정 정보입니다.";
	}

	private void saveInitialNotificationSetting(int userId, boolean marketingAgree) {
		if (userId <= 0) {
			return;
		}

		UserNotificationSettingDTO existingSetting = pushDAO.findNotificationSettingByUserId(userId);
		String agreeYn = marketingAgree ? "Y" : "N";

		if (existingSetting == null) {
			UserNotificationSettingDTO newSetting = new UserNotificationSettingDTO();
			newSetting.setUserId(userId);
			newSetting.setPushAgree(agreeYn);
			newSetting.setMarketingAgree(agreeYn);
			newSetting.setLunchPushAgree(agreeYn);
			newSetting.setDinnerPushAgree(agreeYn);
			newSetting.setWeekendPushAgree(agreeYn);
			newSetting.setPreferredTimezone("Asia/Seoul");
			pushDAO.insertNotificationSetting(newSetting);
			return;
		}

		existingSetting.setPushAgree(agreeYn);
		existingSetting.setMarketingAgree(agreeYn);
		existingSetting.setLunchPushAgree(agreeYn);
		existingSetting.setDinnerPushAgree(agreeYn);
		existingSetting.setWeekendPushAgree(agreeYn);
		if (trimToEmpty(existingSetting.getPreferredTimezone()).isEmpty()) {
			existingSetting.setPreferredTimezone("Asia/Seoul");
		}
		pushDAO.updateNotificationSetting(existingSetting);
	}

	private LoginResponse buildLoginResponse(User user) {
		String accessToken = jwtTokenProvider.createAccessToken(user);
		LoginResponse response = new LoginResponse();
		response.setAccessToken(accessToken);
		response.setTokenType("Bearer");
		response.setExpiresIn(jwtTokenProvider.getAccessTokenExpireSeconds());
		response.setUserId(user.getUserId());
		response.setUserLoginId(user.getUserLoginId());
		response.setName(user.getName());
		response.setNickname(user.getNickname());
		response.setRole(user.getRole());
		return response;
	}

	private String trimToEmpty(String value) {
		return value == null ? "" : value.trim();
	}
}
