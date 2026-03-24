package com.app.validator;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

import com.app.dto.user.FindPasswordRequest;
import com.app.dto.user.FindUserIdRequest;
import com.app.dto.user.LoginRequest;
import com.app.dto.user.SignUpRequest;

@Component
public class UserValidator {
	private static final Pattern USER_ID_PATTERN = Pattern.compile("^[A-Za-z0-9]{4,20}$");
	private static final Pattern NICKNAME_PATTERN = Pattern.compile("^[A-Za-z0-9\\uAC00-\\uD7A3_]{2,20}$");
	private static final Pattern PASSWORD_PATTERN =
		Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z\\d\\s])(?=\\S+$).{8,20}$");
	private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
	private static final Pattern NAME_ALLOWED_PATTERN = Pattern.compile("^[A-Za-z\\uAC00-\\uD7A3\\s]{1,30}$");
	private static final Pattern NAME_JAMO_PATTERN = Pattern.compile("[\\u1100-\\u11FF\\u3130-\\u318F]");
	private static final Pattern YEAR_PATTERN = Pattern.compile("^\\d{4}$");
	private static final Pattern MONTH_DAY_PATTERN = Pattern.compile("^\\d{1,2}$");

	public String validateCheckId(String userId) {
		return validateUserIdField(userId);
	}

	public String validateCheckNickname(String nickname) {
		return validateNicknameField(nickname);
	}

	public String validateCheckEmail(String email) {
		return validateEmailField(email);
	}

	public String validateSignUpRequest(SignUpRequest request) {
		if (request == null) {
			return "잘못된 요청입니다.";
		}

		String userIdMessage = validateUserIdField(request.getUserId());
		if (userIdMessage != null) {
			return userIdMessage;
		}

		String nicknameMessage = validateNicknameField(request.getNickname());
		if (nicknameMessage != null) {
			return nicknameMessage;
		}

		String emailMessage = validateEmailField(request.getEmail());
		if (emailMessage != null) {
			return emailMessage;
		}

		String nameMessage = validateNameField(request.getName());
		if (nameMessage != null) {
			return nameMessage;
		}

		String password = request.getPassword() == null ? "" : request.getPassword();
		String confirmPassword = request.getConfirmPassword() == null ? "" : request.getConfirmPassword();
		String gender = trimToEmpty(request.getGender()).toUpperCase();
		String yearText = trimToEmpty(request.getBirthYear());
		String monthText = trimToEmpty(request.getBirthMonth());
		String dayText = trimToEmpty(request.getBirthDay());

		if (password.isEmpty()) {
			return "비밀번호를 입력해주세요.";
		}

		if (!PASSWORD_PATTERN.matcher(password).matches()) {
			return "비밀번호는 8~20자 영문/숫자/특수문자를 모두 포함해야 합니다.";
		}

		if (!password.equals(confirmPassword)) {
			return "비밀번호가 일치하지 않습니다.";
		}

		if (yearText.isEmpty() || monthText.isEmpty() || dayText.isEmpty()) {
			return "생년월일을 모두 입력해주세요.";
		}

		if (!YEAR_PATTERN.matcher(yearText).matches() ||
			!MONTH_DAY_PATTERN.matcher(monthText).matches() ||
			!MONTH_DAY_PATTERN.matcher(dayText).matches()) {
			return "올바른 생년월일을 입력해주세요.";
		}

		LocalDate birthDate = parseBirthDate(yearText, monthText, dayText);
		String birthDateMessage = validateBirthDate(birthDate);
		if (birthDateMessage != null) {
			return birthDateMessage;
		}

		if (!"M".equals(gender) && !"F".equals(gender)) {
			return "성별을 선택해주세요.";
		}

		return null;
	}

	public String validateFindUserIdRequest(FindUserIdRequest request) {
		if (request == null) {
			return "잘못된 요청입니다.";
		}

		String nameMessage = validateNameField(request.getName());
		if (nameMessage != null) {
			return nameMessage;
		}

		return validateEmailField(request.getEmail());
	}

	public String validateFindPasswordRequest(FindPasswordRequest request) {
		if (request == null) {
			return "잘못된 요청입니다.";
		}

		String userIdMessage = validateUserIdField(request.getUserId());
		if (userIdMessage != null) {
			return userIdMessage;
		}

		return validateEmailField(request.getEmail());
	}

	public String validateLoginFields(LoginRequest request) {
		if (request == null) {
			return "잘못된 요청입니다.";
		}

		String userId = trimToEmpty(request.getUserId());
		String password = request.getPassword() == null ? "" : request.getPassword();

		if (userId.isEmpty()) {
			return "아이디를 입력해주세요.";
		}

		if (password.isEmpty()) {
			return "비밀번호를 입력해주세요.";
		}

		return null;
	}

	public String validateUserIdField(String userId) {
		String value = trimToEmpty(userId);
		if (value.isEmpty()) {
			return "아이디를 입력해주세요.";
		}

		if (!USER_ID_PATTERN.matcher(value).matches()) {
			return "아이디는 4~20자 영문/숫자만 사용할 수 있습니다.";
		}

		return null;
	}

	public String validateNicknameField(String nickname) {
		String value = trimToEmpty(nickname);
		if (value.isEmpty()) {
			return "닉네임을 입력해주세요.";
		}

		if (!NICKNAME_PATTERN.matcher(value).matches()) {
			return "닉네임은 2~20자 한글/영문/숫자/밑줄(_)만 사용할 수 있습니다.";
		}

		return null;
	}

	public String validateEmailField(String email) {
		String value = trimToEmpty(email);
		if (value.isEmpty()) {
			return "이메일을 입력해주세요.";
		}

		if (!EMAIL_PATTERN.matcher(value).matches()) {
			return "올바른 이메일 형식이 아닙니다.";
		}

		return null;
	}

	public String validateNameField(String name) {
		String value = trimToEmpty(name);
		if (value.isEmpty()) {
			return "이름을 입력해주세요.";
		}

		String collapsed = value.replaceAll("\\s+", "");
		if (collapsed.isEmpty()) {
			return "이름을 입력해주세요.";
		}

		if (NAME_JAMO_PATTERN.matcher(collapsed).find()) {
			return "이름은 자음/모음만 입력할 수 없고, 완성형 한글 또는 영문만 가능합니다.";
		}

		if (!NAME_ALLOWED_PATTERN.matcher(value).matches()) {
			return "이름은 한글(완성형)과 영문만 입력할 수 있습니다.";
		}

		return null;
	}

	public String validateBirthDate(LocalDate birthDate) {
		if (birthDate == null) {
			return "올바른 생년월일을 입력해주세요.";
		}

		if (birthDate.isAfter(LocalDate.now())) {
			return "생년월일은 오늘 이전이어야 합니다.";
		}

		return null;
	}

	public LocalDate parseBirthDate(String yearText, String monthText, String dayText) {
		int year;
		int month;
		int day;

		try {
			year = Integer.parseInt(trimToEmpty(yearText));
			month = Integer.parseInt(trimToEmpty(monthText));
			day = Integer.parseInt(trimToEmpty(dayText));
		} catch (NumberFormatException e) {
			return null;
		}

		if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
			return null;
		}

		try {
			return LocalDate.of(year, month, day);
		} catch (DateTimeException e) {
			return null;
		}
	}

	public void normalizeSignUpRequest(SignUpRequest request) {
		LocalDate birthDate = parseBirthDate(request.getBirthYear(), request.getBirthMonth(), request.getBirthDay());
		if (birthDate == null) {
			return;
		}

		request.setUserId(trimToEmpty(request.getUserId()));
		request.setEmail(trimToEmpty(request.getEmail()));
		request.setName(trimToEmpty(request.getName()));
		request.setNickname(trimToEmpty(request.getNickname()));
		request.setGender(trimToEmpty(request.getGender()).toUpperCase());
		request.setBirthYear(String.valueOf(birthDate.getYear()));
		request.setBirthMonth(String.valueOf(birthDate.getMonthValue()));
		request.setBirthDay(String.valueOf(birthDate.getDayOfMonth()));
	}

	public void normalizeLoginRequest(LoginRequest request) {
		if (request == null) {
			return;
		}
		request.setUserId(trimToEmpty(request.getUserId()));
	}

	public void normalizeFindUserIdRequest(FindUserIdRequest request) {
		if (request == null) {
			return;
		}
		request.setName(trimToEmpty(request.getName()));
		request.setEmail(trimToEmpty(request.getEmail()));
	}

	public void normalizeFindPasswordRequest(FindPasswordRequest request) {
		if (request == null) {
			return;
		}
		request.setUserId(trimToEmpty(request.getUserId()));
		request.setEmail(trimToEmpty(request.getEmail()));
	}

	private String trimToEmpty(String value) {
		return value == null ? "" : value.trim();
	}
}
