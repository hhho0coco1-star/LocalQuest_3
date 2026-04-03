<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<c:set var="path" value="${pageContext.request.contextPath}" />

<link rel="stylesheet"
	href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="${path}/css/admin-navbar-bright.css">

<nav class="admin-nav-container">
	<div class="admin-nav-inner">
		<div class="admin-nav-topbar">
			<div class="admin-nav-brand">
				<a href="${path}/main" class="admin-nav-main">
					<span class="admin-nav-brand-icon"><i class="fas fa-user-shield"></i></span>
					<span class="admin-nav-brand-copy">
						<span class="admin-nav-brand-label">ADMIN CENTER</span>
						<span class="admin-nav-brand-title">LOCALQUEST</span>
					</span>
				</a>
			</div>
			<div class="admin-nav-tools">
				<button type="button" id="adminThemeToggle" class="admin-theme-toggle" onclick="toggleAdminTheme()" aria-pressed="false" aria-label="관리자 테마 전환">
					<span class="admin-theme-toggle-icon"><i class="fas fa-moon" data-theme-icon></i></span>
					<span class="admin-theme-toggle-label" data-theme-label>다크 모드</span>
				</button>
			</div>
		</div>

		<ul class="admin-nav-menu">
			<li class="admin-nav-item"><a href="${path}/admin?view=users" data-admin-view="users"
				onclick="loadAdminContent('${path}/admin/users', this); return false;"> <i
					class="fas fa-users-cog"></i> 회원 관리
			</a></li>
			<li class="admin-nav-item"><a href="${path}/admin?view=shop" data-admin-view="shop"
				onclick="loadAdminContent('${path}/admin/shop', this); return false;"> <i
					class="fas fa-store"></i> 쿠폰 관리
			</a></li>
			<li class="admin-nav-item"><a href="${path}/admin?view=quests" data-admin-view="quests"
				onclick="loadAdminContent('${path}/admin/quests', this); return false;"> <i
					class="fas fa-scroll"></i> 퀘스트 관리
			</a></li>
			<li class="admin-nav-item"><a href="${path}/admin?view=locations" data-admin-view="locations"
				onclick="loadAdminContent('${path}/admin/locations', this); return false;"> <i
					class="fas fa-location-dot"></i> 장소 관리
			</a></li>
			<li class="admin-nav-item"><a href="${path}/admin?view=store-info" data-admin-view="store-info"
				onclick="loadAdminContent('${path}/admin/store-info', this); return false;"> <i
					class="fas fa-map-marked-alt"></i> 매장 정보 관리
			</a></li>
			<li class="admin-nav-item"><a href="${path}/admin?view=qna" data-admin-view="qna"
				onclick="loadAdminContent('${path}/admin/qna', this); return false;"> <i
					class="fas fa-comments"></i> 1:1 문의
			</a></li>
			<li class="admin-nav-item"><a href="${path}/admin?view=notice" data-admin-view="notice"
				onclick="loadAdminContent('${path}/admin/notice', this); return false;"> <i
					class="fas fa-bullhorn"></i> 공지사항
			</a></li>
			<li class="admin-nav-item"><a href="${path}/admin?view=faq" data-admin-view="faq"
				onclick="loadAdminContent('${path}/admin/faq', this); return false;"> <i
					class="fas fa-question-circle"></i> FAQ
			</a></li>
		</ul>
		
	</div>
</nav>
