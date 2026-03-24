package com.app.service.user.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import com.app.dto.user.User;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtTokenProvider {
	private static final long ACCESS_TOKEN_EXPIRE_MS = 1000L * 60 * 60 * 24; // 24시간
	private static final String DEFAULT_SECRET = "LocalQuestJwtSecretKey_ChangeThisInProduction_2026";
	private final SecretKey secretKey;

	public JwtTokenProvider() {
		String secret = System.getenv("LQ_JWT_SECRET");
		if (secret == null || secret.trim().length() < 32) {
			secret = DEFAULT_SECRET;
		}
		this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
	}

	public String createAccessToken(User user) {
		Instant now = Instant.now();
		Instant expiresAt = now.plusMillis(ACCESS_TOKEN_EXPIRE_MS);

		return Jwts.builder()
				.subject(user.getUserLoginId())
				.claim("uid", user.getUserId())
				.claim("role", user.getRole())
				.issuedAt(Date.from(now))
				.expiration(Date.from(expiresAt))
				.signWith(secretKey)
				.compact();
	}

	public long getAccessTokenExpireSeconds() {
		return ACCESS_TOKEN_EXPIRE_MS / 1000L;
	}
}
