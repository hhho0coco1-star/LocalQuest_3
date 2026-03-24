package com.app.service.user.impl;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.security.SecureRandom;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.mindrot.jbcrypt.BCrypt;

import com.app.dao.user.UserDAO;
import com.app.dto.user.FindPasswordRequest;
import com.app.dto.user.FindUserIdRequest;
import com.app.dto.user.LoginRequest;
import com.app.dto.user.LoginResponse;
import com.app.dto.user.SignUpRequest;
import com.app.dto.user.User;
import com.app.service.user.UserService;
import com.app.service.user.auth.JwtTokenProvider;
import com.app.validator.UserValidator;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class UserServiceImpl implements UserService{
	private static final Properties MAIL_PROPERTIES = loadMailProperties();
	private static final SecureRandom SECURE_RANDOM = new SecureRandom();
	private static final long SOCIAL_STATE_TTL_MILLIS = 5 * 60 * 1000L;
	private static final String PROVIDER_GOOGLE = "google";
	private static final String PROVIDER_NAVER = "naver";
	private static final String PROVIDER_KAKAO = "kakao";

	private final RestTemplate restTemplate = new RestTemplate();
	private final ObjectMapper objectMapper = new ObjectMapper();
	private final Map<String, IssuedSocialState> issuedSocialStates = new ConcurrentHashMap<>();

	@Autowired
	private UserDAO userDAO;

	@Autowired
	private UserValidator userValidator;

	@Autowired
	private JwtTokenProvider jwtTokenProvider;





	
	@Override
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

		return userDAO.saveUser(user);
	}

	@Override
	public boolean isUserIdAvailable(String userLoginId) {
		String trimmedUserId = trimToEmpty(userLoginId);
		if (trimmedUserId.isEmpty()) {
			return false;
		}

		return userDAO.countByUserLoginId(trimmedUserId) == 0;
	}

	@Override
	public boolean isNicknameAvailable(String nickname) {
		String trimmedNickname = trimToEmpty(nickname);
		if (trimmedNickname.isEmpty()) {
			return false;
		}

		return userDAO.countByNickname(trimmedNickname) == 0;
	}

	@Override
	public boolean isEmailAvailable(String email) {
		String trimmedEmail = trimToEmpty(email);
		if (trimmedEmail.isEmpty()) {
			return false;
		}

		return userDAO.countByEmail(trimmedEmail) == 0;
	}

	@Override
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

	@Override
	public String getSocialAuthorizationUrl(String provider) {
		String normalizedProvider = normalizeSocialProvider(provider);
		String state = issueSocialState(normalizedProvider);

		switch (normalizedProvider) {
			case PROVIDER_GOOGLE:
				return buildGoogleAuthorizationUrl(state);
			case PROVIDER_NAVER:
				return buildNaverAuthorizationUrl(state);
			case PROVIDER_KAKAO:
				return buildKakaoAuthorizationUrl(state);
			default:
				throw new IllegalArgumentException("지원하지 않는 소셜 로그인 제공자입니다.");
		}
	}

	@Override
	@Transactional
	public LoginResponse loginWithSocialCode(String provider, String code, String state) {
		String normalizedProvider = normalizeSocialProvider(provider);
		String normalizedCode = trimToEmpty(code);
		String normalizedState = trimToEmpty(state);

		if (normalizedCode.isEmpty()) {
			throw new IllegalArgumentException("소셜 로그인 인가 코드가 누락되었습니다.");
		}

		validateAndConsumeSocialState(normalizedProvider, normalizedState);
		SocialUserProfile socialUser = fetchSocialUserProfile(normalizedProvider, normalizedCode, normalizedState);
		if (PROVIDER_GOOGLE.equals(normalizedProvider)) {
			socialUser = resolveGoogleSocialProfile(socialUser);
		}
		if (trimToEmpty(socialUser.email).isEmpty()) {
			throw new IllegalStateException("소셜 계정의 이메일 정보를 확인할 수 없습니다. 제공자 동의 항목을 확인해주세요.");
		}

		User user = userDAO.findByEmail(socialUser.email);
		if (user == null) {
			User newUser = createSocialUser(socialUser);
			userDAO.saveUser(newUser);
			user = userDAO.findByEmail(socialUser.email);
		}

		if (user == null) {
			throw new IllegalStateException("소셜 로그인 회원 처리 중 오류가 발생했습니다.");
		}

		if (user.getStatus() != null && !"ACTIVE".equalsIgnoreCase(user.getStatus())) {
			throw new IllegalStateException("비활성화된 계정입니다. 관리자에게 문의해주세요.");
		}

		syncSocialBirthAndGender(user, socialUser);
		return buildLoginResponse(user);
	}

	@Override
	public String getSocialFrontendRedirectUri() {
		return readConfigOrDefault(
			"LQ_SOCIAL_FRONTEND_REDIRECT_URI",
			"lq.social.frontend.redirect-uri",
			"http://localhost:3000/login/social/callback"
		);
	}

	@Override
	public String findUserLoginId(FindUserIdRequest request) {
		userValidator.normalizeFindUserIdRequest(request);
		User searchCondition = new User();
		searchCondition.setName(trimToEmpty(request.getName()));
		searchCondition.setEmail(trimToEmpty(request.getEmail()));

		User user = userDAO.findActiveUserByNameAndEmail(searchCondition);
		if (user == null || trimToEmpty(user.getUserLoginId()).isEmpty()) {
			throw new IllegalArgumentException("입력한 이름과 이메일이 일치하는 계정을 찾을 수 없습니다.");
		}

		return user.getUserLoginId();
	}

	@Override
	@Transactional
	public void sendTemporaryPasswordByEmail(FindPasswordRequest request) {
		userValidator.normalizeFindPasswordRequest(request);
		User searchCondition = new User();
		searchCondition.setUserLoginId(trimToEmpty(request.getUserId()));
		searchCondition.setEmail(trimToEmpty(request.getEmail()));

		User user = userDAO.findActiveUserByUserLoginIdAndEmail(searchCondition);
		if (user == null) {
			throw new IllegalArgumentException("입력한 아이디와 이메일이 일치하는 계정을 찾을 수 없습니다.");
		}

		String temporaryPassword = generateTemporaryPassword();
		String encodedPassword = BCrypt.hashpw(temporaryPassword, BCrypt.gensalt());

		User updateTarget = new User();
		updateTarget.setUserId(user.getUserId());
		updateTarget.setPassword(encodedPassword);

		int updatedCount = userDAO.updatePasswordByUserId(updateTarget);
		if (updatedCount != 1) {
			throw new IllegalStateException("비밀번호 재설정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
		}

		sendTemporaryPasswordMail(user.getEmail(), user.getName(), temporaryPassword);
	}

	@Override
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

	@Override
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

	@Override
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

	private String normalizeSocialProvider(String provider) {
		String normalized = trimToEmpty(provider).toLowerCase();
		if (PROVIDER_GOOGLE.equals(normalized) ||
			PROVIDER_NAVER.equals(normalized) ||
			PROVIDER_KAKAO.equals(normalized)) {
			return normalized;
		}

		throw new IllegalArgumentException("지원하지 않는 소셜 로그인 제공자입니다.");
	}

	private String issueSocialState(String provider) {
		long nowMillis = System.currentTimeMillis();
		cleanupExpiredSocialStates(nowMillis);

		String state = UUID.randomUUID().toString();
		issuedSocialStates.put(state, new IssuedSocialState(provider, nowMillis + SOCIAL_STATE_TTL_MILLIS));
		return state;
	}

	private void validateAndConsumeSocialState(String provider, String state) {
		long nowMillis = System.currentTimeMillis();
		cleanupExpiredSocialStates(nowMillis);

		String normalizedState = trimToEmpty(state);
		if (normalizedState.isEmpty()) {
			throw new IllegalArgumentException("Social login state is missing.");
		}

		IssuedSocialState issuedState = issuedSocialStates.remove(normalizedState);
		if (issuedState == null ||
			!provider.equals(issuedState.provider) ||
			issuedState.expiresAtMillis < nowMillis) {
			throw new IllegalArgumentException("Social login state is invalid or expired.");
		}
	}

	private void cleanupExpiredSocialStates(long nowMillis) {
		issuedSocialStates.entrySet().removeIf(entry -> entry.getValue().expiresAtMillis < nowMillis);
	}

	private String buildGoogleAuthorizationUrl(String state) {
		String clientId = readRequiredConfig("LQ_SOCIAL_GOOGLE_CLIENT_ID", "lq.social.google.client-id");
		String redirectUri = readRequiredConfig("LQ_SOCIAL_GOOGLE_REDIRECT_URI", "lq.social.google.redirect-uri");
		String scope = ensureRequiredScopes(
			readConfigOrDefault("LQ_SOCIAL_GOOGLE_SCOPE", "lq.social.google.scope", "openid profile email"),
			"openid",
			"profile",
			"email",
			"https://www.googleapis.com/auth/user.birthday.read",
			"https://www.googleapis.com/auth/user.gender.read"
		);

		return UriComponentsBuilder
			.fromHttpUrl("https://accounts.google.com/o/oauth2/v2/auth")
			.queryParam("response_type", "code")
			.queryParam("client_id", clientId)
			.queryParam("redirect_uri", redirectUri)
			.queryParam("scope", scope)
			.queryParam("state", state)
			.queryParam("prompt", "select_account")
			.build()
			.encode()
			.toUriString();
	}

	private String buildNaverAuthorizationUrl(String state) {
		String clientId = readRequiredConfig("LQ_SOCIAL_NAVER_CLIENT_ID", "lq.social.naver.client-id");
		String redirectUri = readRequiredConfig("LQ_SOCIAL_NAVER_REDIRECT_URI", "lq.social.naver.redirect-uri");

		return UriComponentsBuilder
			.fromHttpUrl("https://nid.naver.com/oauth2.0/authorize")
			.queryParam("response_type", "code")
			.queryParam("client_id", clientId)
			.queryParam("redirect_uri", redirectUri)
			.queryParam("state", state)
			.build()
			.encode()
			.toUriString();
	}

	private String buildKakaoAuthorizationUrl(String state) {
		String clientId = readRequiredConfig("LQ_SOCIAL_KAKAO_CLIENT_ID", "lq.social.kakao.client-id");
		String redirectUri = readRequiredConfig("LQ_SOCIAL_KAKAO_REDIRECT_URI", "lq.social.kakao.redirect-uri");

		return UriComponentsBuilder
			.fromHttpUrl("https://kauth.kakao.com/oauth/authorize")
			.queryParam("response_type", "code")
			.queryParam("client_id", clientId)
			.queryParam("redirect_uri", redirectUri)
			.queryParam("state", state)
			.build()
			.encode()
			.toUriString();
	}

	private SocialUserProfile fetchSocialUserProfile(String provider, String code, String state) {
		switch (provider) {
			case PROVIDER_GOOGLE:
				return fetchGoogleSocialUser(code);
			case PROVIDER_NAVER:
				return fetchNaverSocialUser(code, state);
			case PROVIDER_KAKAO:
				return fetchKakaoSocialUser(code);
			default:
				throw new IllegalArgumentException("지원하지 않는 소셜 로그인 제공자입니다.");
		}
	}

	private SocialUserProfile fetchGoogleSocialUser(String code) {
		String clientId = readRequiredConfig("LQ_SOCIAL_GOOGLE_CLIENT_ID", "lq.social.google.client-id");
		String clientSecret = readRequiredConfig("LQ_SOCIAL_GOOGLE_CLIENT_SECRET", "lq.social.google.client-secret");
		String redirectUri = readRequiredConfig("LQ_SOCIAL_GOOGLE_REDIRECT_URI", "lq.social.google.redirect-uri");

		MultiValueMap<String, String> tokenRequestBody = new LinkedMultiValueMap<>();
		tokenRequestBody.add("grant_type", "authorization_code");
		tokenRequestBody.add("client_id", clientId);
		tokenRequestBody.add("client_secret", clientSecret);
		tokenRequestBody.add("redirect_uri", redirectUri);
		tokenRequestBody.add("code", code);

		JsonNode tokenJson = postFormForJson("https://oauth2.googleapis.com/token", tokenRequestBody);
		String accessToken = readJsonText(tokenJson, "access_token");
		if (accessToken.isEmpty()) {
			throw new IllegalStateException("Google 액세스 토큰을 발급받지 못했습니다.");
		}

		JsonNode profileJson = getJsonWithBearer("https://openidconnect.googleapis.com/v1/userinfo", accessToken);
		String providerUserId = readJsonText(profileJson, "sub");
		String email = readJsonText(profileJson, "email");
		String name = readJsonText(profileJson, "name");
		String nickname = readJsonText(profileJson, "given_name");
		String birth = null;
		String gender = null;

		try {
			JsonNode peopleJson = getJsonWithBearer(
				"https://people.googleapis.com/v1/people/me?personFields=birthdays,genders",
				accessToken
			);
			birth = extractGoogleBirth(peopleJson);
			gender = extractGoogleGender(peopleJson);
		} catch (IllegalStateException ignored) {
			// Birthday/gender consent can be optional; ignore and continue login.
		}

		if (birth == null || birth.trim().isEmpty()) {
			birth = "2000-01-01";
		}
		if (normalizeGenderCode(gender) == null) {
			gender = "M";
		}

		return new SocialUserProfile(
			PROVIDER_GOOGLE,
			providerUserId,
			email,
			name,
			nickname,
			birth,
			gender
		);
	}

	private SocialUserProfile fetchNaverSocialUser(String code, String state) {
		String clientId = readRequiredConfig("LQ_SOCIAL_NAVER_CLIENT_ID", "lq.social.naver.client-id");
		String clientSecret = readRequiredConfig("LQ_SOCIAL_NAVER_CLIENT_SECRET", "lq.social.naver.client-secret");
		String redirectUri = readRequiredConfig("LQ_SOCIAL_NAVER_REDIRECT_URI", "lq.social.naver.redirect-uri");

		String normalizedState = trimToEmpty(state);
		if (normalizedState.isEmpty()) {
			throw new IllegalArgumentException("Social login state is missing.");
		}

		String tokenUrl = UriComponentsBuilder
			.fromHttpUrl("https://nid.naver.com/oauth2.0/token")
			.queryParam("grant_type", "authorization_code")
			.queryParam("client_id", clientId)
			.queryParam("client_secret", clientSecret)
			.queryParam("redirect_uri", redirectUri)
			.queryParam("code", code)
			.queryParam("state", normalizedState)
			.build()
			.encode()
			.toUriString();

		JsonNode tokenJson = getJson(tokenUrl);
		String accessToken = readJsonText(tokenJson, "access_token");
		if (accessToken.isEmpty()) {
			throw new IllegalStateException("Naver 액세스 토큰을 발급받지 못했습니다.");
		}

		JsonNode profileRoot = getJsonWithBearer("https://openapi.naver.com/v1/nid/me", accessToken);
		JsonNode responseNode = profileRoot.path("response");

		String providerUserId = readJsonText(responseNode, "id");
		String email = readJsonText(responseNode, "email");
		String name = readJsonText(responseNode, "name");
		String nickname = readJsonText(responseNode, "nickname");
		String birth = buildBirthDate(
			readJsonText(responseNode, "birthyear"),
			readJsonText(responseNode, "birthday")
		);
		String gender = normalizeGenderCode(readJsonText(responseNode, "gender"));

		return new SocialUserProfile(
			PROVIDER_NAVER,
			providerUserId,
			email,
			name,
			nickname,
			birth,
			gender
		);
	}

	private SocialUserProfile fetchKakaoSocialUser(String code) {
		String clientId = readRequiredConfig("LQ_SOCIAL_KAKAO_CLIENT_ID", "lq.social.kakao.client-id");
		String redirectUri = readRequiredConfig("LQ_SOCIAL_KAKAO_REDIRECT_URI", "lq.social.kakao.redirect-uri");
		String clientSecret = readConfig("LQ_SOCIAL_KAKAO_CLIENT_SECRET", "lq.social.kakao.client-secret");

		MultiValueMap<String, String> tokenRequestBody = new LinkedMultiValueMap<>();
		tokenRequestBody.add("grant_type", "authorization_code");
		tokenRequestBody.add("client_id", clientId);
		tokenRequestBody.add("redirect_uri", redirectUri);
		tokenRequestBody.add("code", code);
		if (!clientSecret.isEmpty()) {
			tokenRequestBody.add("client_secret", clientSecret);
		}

		JsonNode tokenJson = postFormForJson("https://kauth.kakao.com/oauth/token", tokenRequestBody);
		String accessToken = readJsonText(tokenJson, "access_token");
		if (accessToken.isEmpty()) {
			throw new IllegalStateException("Kakao 액세스 토큰을 발급받지 못했습니다.");
		}

		JsonNode profileRoot = getJsonWithBearer("https://kapi.kakao.com/v2/user/me", accessToken);
		String providerUserId = trimToEmpty(profileRoot.path("id").asText(""));
		JsonNode kakaoAccountNode = profileRoot.path("kakao_account");
		JsonNode profileNode = kakaoAccountNode.path("profile");

		String email = trimToEmpty(kakaoAccountNode.path("email").asText(""));
		if (email.isEmpty()) {
			email = buildSocialFallbackEmail(PROVIDER_KAKAO, providerUserId);
		}
		String name = trimToEmpty(profileNode.path("nickname").asText(""));
		String nickname = trimToEmpty(profileNode.path("nickname").asText(""));
		String birth = "2000-01-01";
		String gender = "M";

		return new SocialUserProfile(
			PROVIDER_KAKAO,
			providerUserId,
			email,
			name,
			nickname,
			birth,
			gender
		);
	}

	private JsonNode postFormForJson(String url, MultiValueMap<String, String> requestBody) {
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
		HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(requestBody, headers);

		try {
			ResponseEntity<String> responseEntity = restTemplate.postForEntity(url, requestEntity, String.class);
			return parseJson(responseEntity.getBody());
		} catch (RestClientException e) {
			throw new IllegalStateException("소셜 로그인 토큰 요청 중 오류가 발생했습니다.");
		}
	}

	private JsonNode getJson(String url) {
		try {
			ResponseEntity<String> responseEntity = restTemplate.getForEntity(url, String.class);
			return parseJson(responseEntity.getBody());
		} catch (RestClientException e) {
			throw new IllegalStateException("소셜 로그인 사용자 정보 요청 중 오류가 발생했습니다.");
		}
	}

	private JsonNode getJsonWithBearer(String url, String accessToken) {
		HttpHeaders headers = new HttpHeaders();
		headers.setBearerAuth(accessToken);
		HttpEntity<String> requestEntity = new HttpEntity<>(headers);

		try {
			ResponseEntity<String> responseEntity = restTemplate.exchange(url, HttpMethod.GET, requestEntity, String.class);
			return parseJson(responseEntity.getBody());
		} catch (RestClientException e) {
			throw new IllegalStateException("소셜 로그인 사용자 정보 요청 중 오류가 발생했습니다.");
		}
	}

	private JsonNode parseJson(String rawJson) {
		try {
			return objectMapper.readTree(trimToEmpty(rawJson));
		} catch (IOException e) {
			throw new IllegalStateException("소셜 로그인 응답 파싱 중 오류가 발생했습니다.");
		}
	}

	private String readJsonText(JsonNode node, String fieldName) {
		return trimToEmpty(node.path(fieldName).asText(""));
	}

	private User createSocialUser(SocialUserProfile socialUser) {
		String providerUserId = trimToEmpty(socialUser.providerUserId);
		if (providerUserId.isEmpty()) {
			throw new IllegalStateException("소셜 계정 식별값을 가져오지 못했습니다.");
		}

		String email = trimToEmpty(socialUser.email);
		if (email.isEmpty()) {
			throw new IllegalStateException("소셜 계정 이메일을 가져오지 못했습니다.");
		}

		String preferredName = trimToEmpty(socialUser.name);
		if (preferredName.isEmpty()) {
			preferredName = localPartFromEmail(email);
		}

		String preferredNickname = trimToEmpty(socialUser.nickname);
		if (preferredNickname.isEmpty()) {
			preferredNickname = preferredName;
		}

		User user = new User();
		user.setUserLoginId(generateUniqueSocialUserLoginId(socialUser.provider, providerUserId));
		user.setName(trimToMaxLength(preferredName, 50));
		user.setEmail(email);
		user.setPassword(BCrypt.hashpw(UUID.randomUUID().toString(), BCrypt.gensalt()));
		user.setNickname(generateUniqueSocialNickname(preferredNickname));
		user.setBirth(trimToEmpty(socialUser.birth).isEmpty() ? null : socialUser.birth);
		user.setGender(normalizeGenderCode(socialUser.gender));
		user.setRole("USER");
		user.setExp(0);
		user.setPoint(0);
		user.setStatus("ACTIVE");
		return user;
	}

	private SocialUserProfile resolveGoogleSocialProfile(SocialUserProfile socialUser) {
		if (socialUser == null) {
			return null;
		}

		String fallbackEmail = buildSocialFallbackEmail(PROVIDER_GOOGLE, socialUser.providerUserId);
		if (fallbackEmail.isEmpty()) {
			return socialUser;
		}

		User fallbackUser = userDAO.findByEmail(fallbackEmail);
		if (fallbackUser != null) {
			return copySocialProfileWithEmail(socialUser, fallbackEmail);
		}

		String realEmail = trimToEmpty(socialUser.email);
		if (realEmail.isEmpty()) {
			return copySocialProfileWithEmail(socialUser, fallbackEmail);
		}

		User realEmailUser = userDAO.findByEmail(realEmail);
		if (realEmailUser == null) {
			return socialUser;
		}

		String existingLoginId = trimToEmpty(realEmailUser.getUserLoginId()).toLowerCase();
		if (existingLoginId.startsWith(PROVIDER_GOOGLE + "_")) {
			return socialUser;
		}

		return copySocialProfileWithEmail(socialUser, fallbackEmail);
	}

	private SocialUserProfile copySocialProfileWithEmail(SocialUserProfile source, String email) {
		return new SocialUserProfile(
			source.provider,
			source.providerUserId,
			email,
			source.name,
			source.nickname,
			source.birth,
			source.gender
		);
	}

	private void syncSocialBirthAndGender(User user, SocialUserProfile socialUser) {
		if (user == null || socialUser == null) {
			return;
		}

		String currentBirth = trimToEmpty(user.getBirth());
		String currentGender = normalizeGenderCode(user.getGender());
		String socialBirth = trimToEmpty(socialUser.birth);
		String socialGender = normalizeGenderCode(socialUser.gender);

		boolean shouldUpdate = false;
		if (shouldReplaceBirth(currentBirth, socialBirth)) {
			user.setBirth(socialBirth);
			shouldUpdate = true;
		}

		if (shouldReplaceGender(user, currentGender, socialGender)) {
			user.setGender(socialGender);
			shouldUpdate = true;
		}

		if (shouldUpdate) {
			userDAO.updateSocialProfileByUserId(user);
		}
	}

	private boolean shouldReplaceBirth(String currentBirth, String socialBirth) {
		String normalizedSocialBirth = trimToEmpty(socialBirth);
		if (normalizedSocialBirth.isEmpty() || isDefaultBirthValue(normalizedSocialBirth)) {
			return false;
		}

		String normalizedCurrentBirth = trimToEmpty(currentBirth);
		return normalizedCurrentBirth.isEmpty() || isDefaultBirthValue(normalizedCurrentBirth);
	}

	private boolean shouldReplaceGender(User user, String currentGender, String socialGender) {
		if (socialGender == null) {
			return false;
		}

		if (currentGender == null) {
			return true;
		}

		if (!isSocialAccount(user)) {
			return false;
		}

		// Social default is currently M; replace it only when provider returns F.
		return "M".equals(currentGender) && "F".equals(socialGender);
	}

	private boolean isDefaultBirthValue(String birth) {
		return trimToEmpty(birth).startsWith("2000-01-01");
	}

	private boolean isSocialAccount(User user) {
		String loginId = trimToEmpty(user.getUserLoginId()).toLowerCase();
		return loginId.startsWith(PROVIDER_GOOGLE + "_") ||
			loginId.startsWith(PROVIDER_NAVER + "_") ||
			loginId.startsWith(PROVIDER_KAKAO + "_");
	}

	private String generateUniqueSocialUserLoginId(String provider, String providerUserId) {
		String base = trimToEmpty((provider + "_" + providerUserId).toLowerCase());
		base = base.replaceAll("[^a-z0-9_]", "_");
		base = collapseUnderscores(base);
		if (base.length() < 4) {
			base = base + randomNumericText(4 - base.length());
		}
		if (base.length() > 20) {
			base = base.substring(0, 20);
		}

		String candidate = base;
		for (int attempt = 0; attempt < 100; attempt++) {
			if (isUserIdAvailable(candidate)) {
				return candidate;
			}

			String suffix = randomNumericText(6);
			int prefixLimit = 20 - suffix.length();
			String prefix = base.length() > prefixLimit ? base.substring(0, prefixLimit) : base;
			candidate = prefix + suffix;
		}

		throw new IllegalStateException("소셜 로그인용 계정 아이디 생성에 실패했습니다.");
	}

	private String generateUniqueSocialNickname(String preferredNickname) {
		String base = trimToEmpty(preferredNickname).replaceAll("\\s+", "");
		if (base.isEmpty()) {
			base = "LQUSER";
		}
		if (base.length() > 20) {
			base = base.substring(0, 20);
		}

		String candidate = base;
		for (int attempt = 0; attempt < 100; attempt++) {
			if (isNicknameAvailable(candidate)) {
				return candidate;
			}

			String suffix = randomNumericText(4);
			int prefixLimit = 20 - suffix.length();
			String prefix = base.length() > prefixLimit ? base.substring(0, prefixLimit) : base;
			candidate = prefix + suffix;
		}

		throw new IllegalStateException("소셜 로그인용 닉네임 생성에 실패했습니다.");
	}

	private String collapseUnderscores(String text) {
		String normalized = text;
		while (normalized.contains("__")) {
			normalized = normalized.replace("__", "_");
		}
		return normalized;
	}

	private String trimToMaxLength(String value, int maxLength) {
		String normalized = trimToEmpty(value);
		if (normalized.length() <= maxLength) {
			return normalized;
		}
		return normalized.substring(0, maxLength);
	}

	private String randomNumericText(int length) {
		StringBuilder builder = new StringBuilder();
		for (int i = 0; i < length; i++) {
			builder.append(SECURE_RANDOM.nextInt(10));
		}
		return builder.toString();
	}

	private String ensureRequiredScopes(String configuredScope, String... requiredScopes) {
		Set<String> scopes = new LinkedHashSet<>();

		String normalizedConfiguredScope = trimToEmpty(configuredScope);
		if (!normalizedConfiguredScope.isEmpty()) {
			String[] configuredTokens = normalizedConfiguredScope.split("\\s+");
			for (String token : configuredTokens) {
				String normalizedToken = trimToEmpty(token);
				if (!normalizedToken.isEmpty()) {
					scopes.add(normalizedToken);
				}
			}
		}

		for (String requiredScope : requiredScopes) {
			String normalizedScope = trimToEmpty(requiredScope);
			if (!normalizedScope.isEmpty()) {
				scopes.add(normalizedScope);
			}
		}

		return String.join(" ", scopes);
	}

	private String buildBirthDate(String yearText, String monthDayText) {
		String yearDigits = trimToEmpty(yearText).replaceAll("[^0-9]", "");
		String monthDayDigits = trimToEmpty(monthDayText).replaceAll("[^0-9]", "");

		if (yearDigits.length() != 4 || monthDayDigits.length() != 4) {
			return null;
		}

		try {
			int year = Integer.parseInt(yearDigits);
			int month = Integer.parseInt(monthDayDigits.substring(0, 2));
			int day = Integer.parseInt(monthDayDigits.substring(2, 4));
			LocalDate birthDate = LocalDate.of(year, month, day);
			return String.format(
				"%04d-%02d-%02d",
				birthDate.getYear(),
				birthDate.getMonthValue(),
				birthDate.getDayOfMonth()
			);
		} catch (Exception e) {
			return null;
		}
	}

	private String normalizeGenderCode(String rawGender) {
		String normalizedGender = trimToEmpty(rawGender).toLowerCase();

		if ("m".equals(normalizedGender) || "male".equals(normalizedGender)) {
			return "M";
		}

		if ("f".equals(normalizedGender) || "female".equals(normalizedGender)) {
			return "F";
		}

		return null;
	}

	private String extractGoogleBirth(JsonNode peopleRoot) {
		JsonNode birthdays = peopleRoot.path("birthdays");
		if (!birthdays.isArray()) {
			return null;
		}

		for (JsonNode birthdayNode : birthdays) {
			if (birthdayNode.path("metadata").path("primary").asBoolean(false)) {
				String primaryBirth = toDateString(birthdayNode.path("date"));
				if (primaryBirth != null) {
					return primaryBirth;
				}
			}
		}

		for (JsonNode birthdayNode : birthdays) {
			String birth = toDateString(birthdayNode.path("date"));
			if (birth != null) {
				return birth;
			}
		}

		return null;
	}

	private String extractGoogleGender(JsonNode peopleRoot) {
		JsonNode genders = peopleRoot.path("genders");
		if (!genders.isArray()) {
			return null;
		}

		for (JsonNode genderNode : genders) {
			if (genderNode.path("metadata").path("primary").asBoolean(false)) {
				String primaryGender = normalizeGenderCode(trimToEmpty(genderNode.path("value").asText("")));
				if (primaryGender != null) {
					return primaryGender;
				}
			}
		}

		for (JsonNode genderNode : genders) {
			String gender = normalizeGenderCode(trimToEmpty(genderNode.path("value").asText("")));
			if (gender != null) {
				return gender;
			}
		}

		return null;
	}

	private String toDateString(JsonNode dateNode) {
		if (dateNode == null || dateNode.isMissingNode()) {
			return null;
		}

		int year = dateNode.path("year").asInt(0);
		int month = dateNode.path("month").asInt(0);
		int day = dateNode.path("day").asInt(0);

		if (year <= 0 || month <= 0 || day <= 0) {
			return null;
		}

		try {
			LocalDate birthDate = LocalDate.of(year, month, day);
			return String.format(
				"%04d-%02d-%02d",
				birthDate.getYear(),
				birthDate.getMonthValue(),
				birthDate.getDayOfMonth()
			);
		} catch (Exception e) {
			return null;
		}
	}

	private String buildSocialFallbackEmail(String provider, String providerUserId) {
		final String fallbackDomain = "@social.localquest";
		final int maxEmailLength = 100;
		final int maxLocalLength = maxEmailLength - fallbackDomain.length();

		String normalizedProvider = trimToEmpty(provider).toLowerCase();
		String normalizedProviderUserId = trimToEmpty(providerUserId).toLowerCase();
		if (normalizedProvider.isEmpty() || normalizedProviderUserId.isEmpty()) {
			return "";
		}

		String localPart = (normalizedProvider + "_" + normalizedProviderUserId)
			.replaceAll("[^a-z0-9._-]", "_");
		localPart = collapseUnderscores(localPart);
		if (localPart.isEmpty()) {
			return "";
		}

		if (localPart.length() > maxLocalLength) {
			String hash = Integer.toHexString(localPart.hashCode());
			int prefixLength = Math.max(1, maxLocalLength - hash.length() - 1);
			localPart = localPart.substring(0, prefixLength) + "_" + hash;
		}

		return localPart + fallbackDomain;
	}

	private String localPartFromEmail(String email) {
		String normalized = trimToEmpty(email);
		int separatorIndex = normalized.indexOf('@');
		if (separatorIndex <= 0) {
			return "LQUSER";
		}
		return normalized.substring(0, separatorIndex);
	}

	private static class IssuedSocialState {
		private final String provider;
		private final long expiresAtMillis;

		private IssuedSocialState(String provider, long expiresAtMillis) {
			this.provider = provider;
			this.expiresAtMillis = expiresAtMillis;
		}
	}

	private static class SocialUserProfile {
		private final String provider;
		private final String providerUserId;
		private final String email;
		private final String name;
		private final String nickname;
		private final String birth;
		private final String gender;

		private SocialUserProfile(
			String provider,
			String providerUserId,
			String email,
			String name,
			String nickname,
			String birth,
			String gender
		) {
			this.provider = provider;
			this.providerUserId = providerUserId;
			this.email = email;
			this.name = name;
			this.nickname = nickname;
			this.birth = birth;
			this.gender = gender;
		}
	}

	private void sendTemporaryPasswordMail(String toEmail, String name, String temporaryPassword) {
		String host = readRequiredConfig("LQ_MAIL_HOST", "lq.mail.host");
		String port = readConfigOrDefault("LQ_MAIL_PORT", "lq.mail.port", "587");
		final String username = readRequiredConfig("LQ_MAIL_USERNAME", "lq.mail.username");
		final String password = readRequiredConfig("LQ_MAIL_PASSWORD", "lq.mail.password");
		String from = readConfigOrDefault("LQ_MAIL_FROM", "lq.mail.from", username);
		boolean smtpAuth = parseBoolean(
			readConfigOrDefault("LQ_MAIL_SMTP_AUTH", "lq.mail.smtp.auth", "true"),
			true
		);
		boolean startTls = parseBoolean(
			readConfigOrDefault("LQ_MAIL_SMTP_STARTTLS", "lq.mail.smtp.starttls", "true"),
			true
		);

		Properties props = new Properties();
		props.put("mail.smtp.host", host);
		props.put("mail.smtp.port", port);
		props.put("mail.smtp.auth", String.valueOf(smtpAuth));
		props.put("mail.smtp.starttls.enable", String.valueOf(startTls));

		Session session;
		if (smtpAuth) {
			session = Session.getInstance(props, new Authenticator() {
				@Override
				protected PasswordAuthentication getPasswordAuthentication() {
					return new PasswordAuthentication(username, password);
				}
			});
		} else {
			session = Session.getInstance(props);
		}

		try {
			MimeMessage message = new MimeMessage(session);
			message.setFrom(new InternetAddress(from));
			message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
			String safeName = trimToEmpty(name).isEmpty() ? "회원" : trimToEmpty(name);
			String mailSubject = "[LOCAL QUEST] 임시 비밀번호 안내";
			String mailBody = String.format(
				"%s님%n%n임시 비밀번호를 발급해드립니다.%n%n임시 비밀번호: %s%n%n로그인 후 반드시 비밀번호를 변경해주세요.%n감사합니다.%nLOCAL QUEST 드림",
				safeName,
				temporaryPassword
			);
			message.setSubject(mailSubject, "UTF-8");
			message.setText(mailBody, "UTF-8");
			Transport.send(message);
		} catch (MessagingException e) {
			throw new IllegalStateException("이메일 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
		}
	}

	private String generateTemporaryPassword() {
		int value = 100000 + SECURE_RANDOM.nextInt(900000);
		return String.valueOf(value);
	}

	private String readRequiredConfig(String envKey, String propertyKey) {
		String value = readConfig(envKey, propertyKey);
		if (value.isEmpty()) {
			throw new IllegalStateException(
				String.format("메일 설정이 누락되었습니다. %s 또는 %s 값을 설정해주세요.", envKey, propertyKey)
			);
		}
		return value;
	}

	private String readConfigOrDefault(String envKey, String propertyKey, String defaultValue) {
		String value = readConfig(envKey, propertyKey);
		return value.isEmpty() ? defaultValue : value;
	}

	private String readConfig(String envKey, String propertyKey) {
		String envValue = trimToEmpty(System.getenv(envKey));
		if (!envValue.isEmpty()) {
			return envValue;
		}

		String systemPropertyValue = trimToEmpty(System.getProperty(envKey));
		if (!systemPropertyValue.isEmpty()) {
			return systemPropertyValue;
		}

		return trimToEmpty(MAIL_PROPERTIES.getProperty(propertyKey));
	}

	private static Properties loadMailProperties() {
		Properties properties = new Properties();
		ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
		if (classLoader == null) {
			return properties;
		}

		try (InputStream inputStream = classLoader.getResourceAsStream("mail.properties")) {
			if (inputStream != null) {
				properties.load(inputStream);
			}
		} catch (IOException ignored) {
			// Optional file; fallback to environment variables or system properties.
		}

		return properties;
	}

	private boolean parseBoolean(String value, boolean defaultValue) {
		String normalized = trimToEmpty(value);
		if (normalized.isEmpty()) {
			return defaultValue;
		}
		return Boolean.parseBoolean(normalized);
	}

	private String trimToEmpty(String value) {
		return value == null ? "" : value.trim();
	}
	@Override
	public List<User> searchUsers(String type, String keyword, String sort) {
	    Map<String, Object> searchParams = new HashMap<>();
	    searchParams.put("type", type);
	    searchParams.put("keyword", keyword);
	    searchParams.put("sort", sort); // 'ASC' 또는 'DESC'
	    
	    return userDAO.searchUsers(searchParams);
	}

    @Override
    public boolean changeUserRole(int userId, String newRole) {
        String normalizedRole = trimToEmpty(newRole).toUpperCase();
        if (!isAllowedUserRole(normalizedRole)) {
            return false;
        }

        Map<String, Object> roleMap = new HashMap<>();
        roleMap.put("userId", userId);
        roleMap.put("newRole", normalizedRole);
        
        // 업데이트 결과값이 1이면 성공(true) 반환
        return userDAO.updateUserRole(roleMap) == 1;
    }

    @Override
    public boolean changeUserStatus(int userId, String newStatus) {
        String normalizedStatus = trimToEmpty(newStatus).toUpperCase();
        if (!isAllowedUserStatus(normalizedStatus)) {
            return false;
        }

        Map<String, Object> statusMap = new HashMap<>();
        statusMap.put("userId", userId);
        statusMap.put("newStatus", normalizedStatus);
        
        return userDAO.updateUserStatus(statusMap) == 1;
    }

    private boolean isAllowedUserRole(String role) {
        return "USER".equals(role) || "BUSINESS".equals(role) || "ADMIN".equals(role);
    }

    private boolean isAllowedUserStatus(String status) {
        return "ACTIVE".equals(status) || "WITHDRAWN".equals(status) || "INACTIVE".equals(status);
    }
}
