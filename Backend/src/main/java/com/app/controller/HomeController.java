package com.app.controller;

import javax.servlet.http.HttpServletRequest;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    private static final String FRONTEND_BASE_URL_PARAM = "lq.frontend.base-url";

    @GetMapping({
        "/",
        "/main",
        "/explore",
        "/explore/{questId}",
        "/quest",
        "/mypage",
        "/mypage/{userQuestId}",
        "/reward",
        "/login",
        "/login/social/callback",
        "/signup",
        "/terms"
    })
    public String redirectToFrontend(HttpServletRequest request) {
        String frontendBaseUrl = request.getServletContext().getInitParameter(FRONTEND_BASE_URL_PARAM);
        String requestUri = request.getRequestURI();
        String contextPath = request.getContextPath();
        String path = requestUri;

        if (contextPath != null && !contextPath.isEmpty() && requestUri.startsWith(contextPath)) {
            path = requestUri.substring(contextPath.length());
        }

        if (frontendBaseUrl != null && !frontendBaseUrl.trim().isEmpty()) {
            StringBuilder redirectUrl = new StringBuilder(frontendBaseUrl.replaceAll("/+$", ""));
            redirectUrl.append(path);

            String queryString = request.getQueryString();
            if (queryString != null && !queryString.trim().isEmpty()) {
                redirectUrl.append('?').append(queryString);
            }

            return "redirect:" + redirectUrl;
        }

        return "redirect:" + (path == null || path.isEmpty() ? "/" : path);
    }
}
