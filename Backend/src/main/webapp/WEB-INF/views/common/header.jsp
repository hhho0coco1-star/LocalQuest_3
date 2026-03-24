<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<%-- 테스트를 위해 userRole 설정 (실제 서비스 시 세션 등에서 가져옴) --%>
<c:set var="userRole" value="${not empty sessionScope.userRole ? sessionScope.userRole : 'GUEST'}" />

<%-- header.jsp --%>
<%-- header.jsp --%>
<%-- header.jsp --%>
<c:set var="path" value="${pageContext.request.contextPath}" />
<c:choose>
    <c:when test="${not empty requestScope.logoHref}">
        <c:set var="headerLogoHref" value="${requestScope.logoHref}" />
    </c:when>
    <c:otherwise>
        <c:set var="headerLogoHref" value="${path}/" />
    </c:otherwise>
</c:choose>
<link rel="stylesheet" href="${path}/css/header.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">

<header class="header-main-container">
    <div class="header-top-section">
        <div class="header-inner">
            <a href="${headerLogoHref}" class="header-logo-link">
                <div class="header-logo-wrapper">
                    <i class="fas fa-map-marker-alt header-logo-icon" style="font-size: 28px; color: #D93D5E;"></i>
                    <span class="header-logo-text">LOCAL QUEST</span>
                </div>
            </a>

            <div class="header-utility-btns">
                <c:choose>
                    <c:when test="${userRole eq 'GUEST'}">
                        <button class="header-auth-btn" onclick="location.href='${pageContext.request.contextPath}/login'">로그인</button>
                        <button class="header-signup-btn">회원가입</button>
                    </c:when>
                    <c:otherwise>
                        <span class="header-user-info">[${userRole}]님</span>
                        <button class="header-auth-btn" onclick="location.href='${pageContext.request.contextPath}/logout'">로그아웃</button>
                    </c:otherwise>
                </c:choose>
            </div>
        </div>
    </div>

    <nav class="header-nav-bar">
        <div class="header-inner">
            <ul class="header-nav-list">
                <li class="header-nav-item">
                    <a href="${pageContext.request.contextPath}/explore" class="header-nav-link">퀘스트 목록</a>
                </li>
                <li class="header-nav-item">
                    <a href="${pageContext.request.contextPath}/quest" class="header-nav-link">내 퀘스트</a>
                </li>
                <li class="header-nav-item">
                    <a href="${pageContext.request.contextPath}/reward" class="header-nav-link">성장 및 보상</a>
                </li>

                <c:if test="${userRole eq 'BUSINESS'}">
                    <li class="header-nav-item">
                        <a href="${pageContext.request.contextPath}/business" class="header-nav-link">비즈니스</a>
                    </li>
                </c:if>

                <c:if test="${userRole eq 'ADMIN'}">
                    <li class="header-nav-item">
                        <a href="${pageContext.request.contextPath}/admin" class="header-nav-link">관리자 페이지</a>
                    </li>
                </c:if>

                <c:if test="${userRole ne 'GUEST'}">
                    <li class="header-nav-item">
                        <a href="${pageContext.request.contextPath}/mypage" class="header-nav-link">마이페이지</a>
                    </li>
                </c:if>
            </ul>
        </div>
    </nav>
</header>
<!-- <div class="header-relative-space"></div>	 -->
