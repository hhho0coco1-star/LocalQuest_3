package com.app.interceptor;

import java.io.IOException;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.web.servlet.HandlerInterceptor;

import com.app.auth.SessionAuthKeys;

public class RoleBasedPageInterceptor implements HandlerInterceptor {
	private static final String ROLE_ADMIN = "ADMIN";
	private static final String FRONTEND_BASE_URL_PARAM = "lq.frontend.base-url";
	private final Map<String, Set<String>> roleRules;
	private final Set<String> authenticatedPathPrefixes;

	public RoleBasedPageInterceptor() {
		Map<String, Set<String>> rules = new LinkedHashMap<>();
		rules.put("/admin", Collections.singleton(ROLE_ADMIN));
		this.roleRules = Collections.unmodifiableMap(rules);

		Set<String> authenticatedPaths = new LinkedHashSet<>();
		authenticatedPaths.add("/mypage");
		this.authenticatedPathPrefixes = Collections.unmodifiableSet(authenticatedPaths);
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
		String requestPath = extractRequestPath(request);

		if (isAuthenticatedPath(requestPath)) {
			HttpSession session = request.getSession(false);
			if (!isLoggedIn(session)) {
				redirectToLogin(request, response);
				return false;
			}
		}

		Set<String> allowedRoles = resolveAllowedRoles(requestPath);
		if (allowedRoles == null) {
			return true;
		}

		HttpSession session = request.getSession(false);
		if (session == null) {
			writeUnauthorizedResponse(request, response);
			return false;
		}

		String role = normalizeRole(session.getAttribute(SessionAuthKeys.USER_ROLE));
		if (!allowedRoles.contains(role)) {
			writeForbiddenResponse(request, response);
			return false;
		}

		return true;
	}

	private String extractRequestPath(HttpServletRequest request) {
		String requestUri = request.getRequestURI();
		String contextPath = request.getContextPath();
		if (contextPath != null && !contextPath.isEmpty() && requestUri.startsWith(contextPath)) {
			return requestUri.substring(contextPath.length());
		}
		return requestUri;
	}

	private boolean isAuthenticatedPath(String requestPath) {
		for (String pathPrefix : authenticatedPathPrefixes) {
			if (requestPath.equals(pathPrefix) || requestPath.startsWith(pathPrefix + "/")) {
				return true;
			}
		}
		return false;
	}

	private Set<String> resolveAllowedRoles(String requestPath) {
		for (Map.Entry<String, Set<String>> rule : roleRules.entrySet()) {
			String routePrefix = rule.getKey();
			if (requestPath.equals(routePrefix) || requestPath.startsWith(routePrefix + "/")) {
				return rule.getValue();
			}
		}
		return null;
	}

	private String normalizeRole(Object roleValue) {
		if (roleValue == null) {
			return "";
		}
		return String.valueOf(roleValue).trim().toUpperCase(Locale.ROOT);
	}

	private boolean isLoggedIn(HttpSession session) {
		return session != null && session.getAttribute(SessionAuthKeys.USER_ID) != null;
	}

	private void redirectToLogin(HttpServletRequest request, HttpServletResponse response) throws IOException {
		if (isAjaxRequest(request)) {
			writeUnauthorizedResponse(request, response);
			return;
		}

		String frontendBaseUrl = request.getServletContext().getInitParameter(FRONTEND_BASE_URL_PARAM);
		if (frontendBaseUrl != null && !frontendBaseUrl.trim().isEmpty()) {
			String trimmedBaseUrl = frontendBaseUrl.replaceAll("/+$", "");
			response.sendRedirect(trimmedBaseUrl + "/login");
			return;
		}

		String contextPath = request.getContextPath();
		String fallbackLoginPath = (contextPath == null || contextPath.isEmpty()) ? "/login" : contextPath + "/login";
		response.sendRedirect(fallbackLoginPath);
	}

	private void writeUnauthorizedResponse(HttpServletRequest request, HttpServletResponse response) throws IOException {
		writeErrorResponse(request, response, HttpServletResponse.SC_UNAUTHORIZED, "Login required");
	}

	private void writeForbiddenResponse(HttpServletRequest request, HttpServletResponse response) throws IOException {
		writeErrorResponse(request, response, HttpServletResponse.SC_FORBIDDEN, "Access denied");
	}

	private void writeErrorResponse(HttpServletRequest request, HttpServletResponse response, int status, String message)
		throws IOException {
		response.setStatus(status);
		if (isAjaxRequest(request)) {
			response.setContentType("application/json;charset=UTF-8");
			response.getWriter().write("{\"message\":\"" + message + "\"}");
			return;
		}

		response.setContentType("text/plain;charset=UTF-8");
		response.getWriter().write(message);
	}

	private boolean isAjaxRequest(HttpServletRequest request) {
		String requestedWith = request.getHeader("X-Requested-With");
		return "XMLHttpRequest".equalsIgnoreCase(requestedWith);
	}
}
