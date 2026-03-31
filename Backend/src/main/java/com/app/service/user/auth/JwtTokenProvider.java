package com.app.service.user.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import com.app.dto.user.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
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

	public Integer resolveUserIdFromAuthorizationHeader(String authorizationHeader) {
		String token = resolveBearerToken(authorizationHeader);
		if (token == null) {
			return null;
		}
		return parseUserId(token);
	}

	public String resolveRoleFromAuthorizationHeader(String authorizationHeader) {
		String token = resolveBearerToken(authorizationHeader);
		if (token == null) {
			return null;
		}
		return parseRole(token);
	}

	public Integer parseUserId(String token) {
		try {
			Claims claims = parseClaims(token);
			if (claims == null) {
				return null;
			}

			Object uid = claims.get("uid");
			if (uid instanceof Number) {
				return Integer.valueOf(((Number) uid).intValue());
			}

			if (uid instanceof String) {
				String uidText = ((String) uid).trim();
				if (!uidText.isEmpty()) {
					return Integer.valueOf(Integer.parseInt(uidText));
				}
			}

			return null;
		} catch (NumberFormatException e) {
			return null;
		}
	}

	public String parseRole(String token) {
		Claims claims = parseClaims(token);
		if (claims == null) {
			return null;
		}

		Object role = claims.get("role");
		if (role == null) {
			return null;
		}
		String normalized = String.valueOf(role).trim();
		return normalized.isEmpty() ? null : normalized;
	}

	private Claims parseClaims(String token) {
		if (token == null || token.trim().isEmpty()) {
			return null;
		}
		try {
			return Jwts.parser()
				.verifyWith(secretKey)
				.build()
				.parseSignedClaims(token.trim())
				.getPayload();
		} catch (JwtException | IllegalArgumentException e) {
			return null;
		}
	}

	private String resolveBearerToken(String authorizationHeader) {
		if (authorizationHeader == null) {
			return null;
		}

		String normalizedHeader = authorizationHeader.trim();
		if (normalizedHeader.isEmpty()) {
			return null;
		}

		if (!normalizedHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
			return null;
		}

		String token = normalizedHeader.substring(7).trim();
		if (token.isEmpty()) {
			return null;
		}
		return token;
	}
}
