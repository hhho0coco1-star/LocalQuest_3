package com.app.controller.api;

import java.util.Collections;
import java.util.regex.Pattern;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import com.app.auth.SessionAuthKeys;
import com.app.dto.user.FindPasswordRequest;
import com.app.dto.user.FindUserIdRequest;
import com.app.dto.user.LoginRequest;
import com.app.dto.user.LoginResponse;
import com.app.dto.user.MyProfileResponse;
import com.app.dto.user.SignUpRequest;
import com.app.dto.user.UpdateMyProfileRequest;
import com.app.dto.user.User;
import com.app.service.user.UserService;
import com.app.validator.UserValidator;

@RestController
@RequestMapping("/api/users")
public class UserAPIController {
	private static final Pattern PASSWORD_PATTERN =
		Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z\\d\\s])(?=\\S+$).{8,20}$");

	@Autowired
	private UserService userService;

	@Autowired
	private UserValidator userValidator;

	@GetMapping("/check-id/{userId}")
	public ResponseEntity<?> checkId(@PathVariable String userId) {
		String validationMessage = userValidator.validateCheckId(userId);
		if (validationMessage != null) {
			return ResponseEntity.badRequest().body(Collections.singletonMap("message", validationMessage));
		}

		boolean available = userService.isUserIdAvailable(userId);
		return ResponseEntity.ok(Collections.singletonMap("available", available));
	}

	@GetMapping("/check-nickname")
	public ResponseEntity<?> checkNickname(@RequestParam String nickname) {
		String validationMessage = userValidator.validateCheckNickname(nickname);
		if (validationMessage != null) {
			return ResponseEntity.badRequest().body(Collections.singletonMap("message", validationMessage));
		}

		boolean available = userService.isNicknameAvailable(nickname);
		return ResponseEntity.ok(Collections.singletonMap("available", available));
	}

	@GetMapping("/check-email")
	public ResponseEntity<?> checkEmail(@RequestParam String email) {
		String validationMessage = userValidator.validateCheckEmail(email);
		if (validationMessage != null) {
			return ResponseEntity.badRequest().body(Collections.singletonMap("message", validationMessage));
		}

		boolean available = userService.isEmailAvailable(email);
		return ResponseEntity.ok(Collections.singletonMap("available", available));
	}

	@PostMapping("/signup")
	public ResponseEntity<?> signUp(@RequestBody SignUpRequest request) {
		String validationMessage = userValidator.validateSignUpRequest(request);
		if (validationMessage != null) {
			return ResponseEntity.badRequest().body(validationMessage);
		}

		try {
			userService.signUp(request);
			return ResponseEntity.ok("회원가입 성공");
		} catch (IllegalArgumentException e) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
		}
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpServletRequest) {
		String validationMessage = userValidator.validateLoginFields(request);
		if (validationMessage != null) {
			return ResponseEntity.badRequest().body(validationMessage);
		}
		userValidator.normalizeLoginRequest(request);

		LoginResponse response = userService.login(request);
		if (response == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("아이디 또는 비밀번호가 올바르지 않습니다.");
		}

		storeLoginSession(httpServletRequest, response);
		return ResponseEntity.ok(response);
	}

	@PostMapping("/logout")
	public ResponseEntity<?> logout(HttpServletRequest request) {
		HttpSession session = request.getSession(false);
		if (session != null) {
			session.invalidate();
		}
		return ResponseEntity.ok(Collections.singletonMap("message", "logged out"));
	}

	@GetMapping("/me")
	public ResponseEntity<?> getMyProfile(HttpServletRequest request) {
		Integer loginUserId = resolveLoginUserId(request);
		if (loginUserId == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(Collections.singletonMap("message", "Login required"));
		}

		User user = userService.getUserProfileById(loginUserId);
		if (user == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(Collections.singletonMap("message", "사용자 정보를 찾을 수 없습니다."));
		}

		return ResponseEntity.ok(toMyProfileResponse(user));
	}

	@PatchMapping("/me")
	public ResponseEntity<?> updateMyProfile(
		@RequestBody UpdateMyProfileRequest request,
		HttpServletRequest httpServletRequest
	) {
		Integer loginUserId = resolveLoginUserId(httpServletRequest);
		if (loginUserId == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(Collections.singletonMap("message", "Login required"));
		}

		if (request == null) {
			return ResponseEntity.badRequest().body(Collections.singletonMap("message", "잘못된 요청입니다."));
		}

		String nickname = trimToEmpty(request.getNickname());
		if (nickname.isEmpty()) {
			return ResponseEntity.badRequest().body(Collections.singletonMap("message", "닉네임은 필수입니다."));
		}

		String nicknameValidationMessage = userValidator.validateCheckNickname(nickname);
		if (nicknameValidationMessage != null) {
			return ResponseEntity.badRequest().body(Collections.singletonMap("message", nicknameValidationMessage));
		}

		String newPassword = trimToEmpty(request.getPassword());
		if (!newPassword.isEmpty()) {
			if (!isValidPassword(newPassword)) {
				return ResponseEntity.badRequest().body(Collections.singletonMap(
					"message",
					"비밀번호는 8~20자 영문/숫자/특수문자를 모두 포함해야 합니다."
				));
			}
		}

		try {
			User updatedUser = userService.updateMyProfile(loginUserId, nickname, newPassword);
			return ResponseEntity.ok(toMyProfileResponse(updatedUser));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
		} catch (IllegalStateException e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(Collections.singletonMap("message", e.getMessage()));
		}
	}

	@DeleteMapping("/me")
	public ResponseEntity<?> withdrawMyAccount(HttpServletRequest request) {
		Integer loginUserId = resolveLoginUserId(request);
		if (loginUserId == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(Collections.singletonMap("message", "Login required"));
		}

		boolean withdrawn = userService.withdrawUser(loginUserId);
		if (!withdrawn) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(Collections.singletonMap("message", "사용자 정보를 찾을 수 없습니다."));
		}

		HttpSession session = request.getSession(false);
		if (session != null) {
			session.invalidate();
		}

		return ResponseEntity.ok(Collections.singletonMap("message", "회원 탈퇴가 완료되었습니다."));
	}

	@PostMapping("/find-id")
	public ResponseEntity<?> findId(@RequestBody FindUserIdRequest request) {
		String validationMessage = userValidator.validateFindUserIdRequest(request);
		if (validationMessage != null) {
			return ResponseEntity.badRequest().body(Collections.singletonMap("message", validationMessage));
		}
		userValidator.normalizeFindUserIdRequest(request);

		try {
			String userLoginId = userService.findUserLoginId(request);
			return ResponseEntity.ok(Collections.singletonMap("userLoginId", userLoginId));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("message", e.getMessage()));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(Collections.singletonMap("message", "아이디 찾기 처리 중 오류가 발생했습니다."));
		}
	}

	@PostMapping("/find-password")
	public ResponseEntity<?> findPassword(@RequestBody FindPasswordRequest request) {
		String validationMessage = userValidator.validateFindPasswordRequest(request);
		if (validationMessage != null) {
			return ResponseEntity.badRequest().body(Collections.singletonMap("message", validationMessage));
		}
		userValidator.normalizeFindPasswordRequest(request);

		try {
			userService.sendTemporaryPasswordByEmail(request);
			return ResponseEntity.ok(Collections.singletonMap("message", "입력한 이메일로 임시 비밀번호를 전송했습니다."));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("message", e.getMessage()));
		} catch (IllegalStateException e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(Collections.singletonMap("message", e.getMessage()));
		}
	}

	@GetMapping("/oauth/{provider}/start")
	public ResponseEntity<?> startSocialLogin(@PathVariable String provider) {
		try {
			String authorizationUrl = userService.getSocialAuthorizationUrl(provider);
			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.LOCATION, authorizationUrl);
			return new ResponseEntity<>(headers, HttpStatus.FOUND);
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
		} catch (IllegalStateException e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(Collections.singletonMap("message", e.getMessage()));
		}
	}

	@GetMapping("/oauth/{provider}/callback")
	public ResponseEntity<?> socialLoginCallback(
		@PathVariable String provider,
		@RequestParam(required = false) String code,
		@RequestParam(required = false) String state,
		@RequestParam(required = false) String error,
		HttpServletRequest httpServletRequest
	) {
		String frontendRedirect = userService.getSocialFrontendRedirectUri();

		if (error != null && !error.trim().isEmpty()) {
			String redirectUrl = UriComponentsBuilder
				.fromUriString(frontendRedirect)
				.queryParam("error", "소셜 로그인 인증이 취소되었거나 실패했습니다.")
				.build()
				.encode()
				.toUriString();

			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.LOCATION, redirectUrl);
			return new ResponseEntity<>(headers, HttpStatus.FOUND);
		}

		if (code == null || code.trim().isEmpty()) {
			String redirectUrl = UriComponentsBuilder
				.fromUriString(frontendRedirect)
				.queryParam("error", "소셜 로그인 인가 코드가 누락되었습니다.")
				.build()
				.encode()
				.toUriString();

			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.LOCATION, redirectUrl);
			return new ResponseEntity<>(headers, HttpStatus.FOUND);
		}

		try {
			LoginResponse response = userService.loginWithSocialCode(provider, code, state);
			storeLoginSession(httpServletRequest, response);
			String redirectUrl = buildSocialSuccessRedirectUrl(frontendRedirect, response);

			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.LOCATION, redirectUrl);
			return new ResponseEntity<>(headers, HttpStatus.FOUND);
		} catch (IllegalArgumentException e) {
			String redirectUrl = UriComponentsBuilder
				.fromUriString(frontendRedirect)
				.queryParam("error", e.getMessage())
				.build()
				.encode()
				.toUriString();
			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.LOCATION, redirectUrl);
			return new ResponseEntity<>(headers, HttpStatus.FOUND);
		} catch (IllegalStateException e) {
			String redirectUrl = UriComponentsBuilder
				.fromUriString(frontendRedirect)
				.queryParam("error", e.getMessage())
				.build()
				.encode()
				.toUriString();
			HttpHeaders headers = new HttpHeaders();
			headers.add(HttpHeaders.LOCATION, redirectUrl);
			return new ResponseEntity<>(headers, HttpStatus.FOUND);
		}
	}

	private Integer resolveLoginUserId(HttpServletRequest request) {
		HttpSession session = request.getSession(false);
		if (session == null) {
			return null;
		}

		Object userIdValue = session.getAttribute(SessionAuthKeys.USER_ID);
		if (userIdValue == null) {
			return null;
		}

		if (userIdValue instanceof Number) {
			return ((Number) userIdValue).intValue();
		}

		String parsedUserIdText = trimToEmpty(String.valueOf(userIdValue));
		if (parsedUserIdText.isEmpty()) {
			return null;
		}

		try {
			return Integer.parseInt(parsedUserIdText);
		} catch (NumberFormatException e) {
			return null;
		}
	}

	private MyProfileResponse toMyProfileResponse(User user) {
		MyProfileResponse response = new MyProfileResponse();
		response.setUserId(user.getUserId());
		response.setUserLoginId(user.getUserLoginId());
		response.setName(user.getName());
		response.setEmail(user.getEmail());
		response.setNickname(user.getNickname());
		response.setBirth(user.getBirth());
		response.setGender(user.getGender());
		response.setRole(user.getRole());
		response.setStatus(user.getStatus());
		response.setCreatedAt(user.getCreatedAt() == null ? null : user.getCreatedAt().toString());
		return response;
	}

	private String trimToEmpty(String value) {
		return value == null ? "" : value.trim();
	}

	private boolean isValidPassword(String password) {
		return PASSWORD_PATTERN.matcher(password).matches();
	}

	private void storeLoginSession(HttpServletRequest request, LoginResponse response) {
		HttpSession session = request.getSession(true);
		session.setAttribute(SessionAuthKeys.USER_ID, response.getUserId());
		session.setAttribute(SessionAuthKeys.USER_LOGIN_ID, response.getUserLoginId());
		session.setAttribute(SessionAuthKeys.USER_ROLE, response.getRole());
	}

	private String buildSocialSuccessRedirectUrl(String frontendRedirect, LoginResponse response) {
		String fragment = UriComponentsBuilder
			.newInstance()
			.queryParam("accessToken", response.getAccessToken())
			.queryParam("expiresIn", response.getExpiresIn())
			.queryParam("userId", response.getUserId())
			.queryParam("userLoginId", response.getUserLoginId())
			.queryParam("name", response.getName())
			.queryParam("nickname", response.getNickname())
			.queryParam("role", response.getRole())
			.build()
			.encode()
			.getQuery();

		if (fragment == null || fragment.trim().isEmpty()) {
			return frontendRedirect;
		}

		return frontendRedirect + "#" + fragment;
	}
}
