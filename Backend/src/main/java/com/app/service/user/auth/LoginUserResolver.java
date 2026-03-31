package com.app.service.user.auth;

import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.app.auth.SessionAuthKeys;

@Component
public class LoginUserResolver {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    public Integer resolveUserId(HttpSession session, String authorizationHeader) {
        Integer sessionUserId = resolveSessionUserId(session);
        if (sessionUserId != null && sessionUserId.intValue() > 0) {
            return sessionUserId;
        }

        Integer tokenUserId = jwtTokenProvider.resolveUserIdFromAuthorizationHeader(authorizationHeader);
        if (tokenUserId != null && tokenUserId.intValue() > 0) {
            return tokenUserId;
        }

        return null;
    }

    public Integer resolveSessionUserId(HttpSession session) {
        if (session == null) {
            return null;
        }

        Object sessionUserId = session.getAttribute(SessionAuthKeys.USER_ID);
        if (sessionUserId instanceof Number) {
            return Integer.valueOf(((Number) sessionUserId).intValue());
        }

        if (sessionUserId instanceof String) {
            try {
                return Integer.valueOf(Integer.parseInt(((String) sessionUserId).trim()));
            } catch (NumberFormatException e) {
                return null;
            }
        }

        return null;
    }
}
