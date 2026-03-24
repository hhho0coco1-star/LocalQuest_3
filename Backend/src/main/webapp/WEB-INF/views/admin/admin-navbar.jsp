<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<c:set var="path" value="${pageContext.request.contextPath}" />

<link rel="stylesheet"
	href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="${path}/css/admin-navbar.css">

<nav class="admin-nav-container">
	<div class="admin-nav-inner">
		<div class="admin-nav-brand">
			<i class="fas fa-user-shield"></i> <span>ADMIN CENTER</span>
		</div>

		<ul class="admin-nav-menu">
			<li class="admin-nav-item"><a href="javascript:void(0)"
				onclick="loadAdminContent('${path}/admin/users', this)"> <i
					class="fas fa-users-cog"></i> 회원 관리
			</a></li>
			<li class="admin-nav-item"><a href="javascript:void(0)"
				onclick="loadAdminContent('${path}/admin/shop', this)"> <i
					class="fas fa-store"></i> 상점 관리
			</a></li>
			<li class="admin-nav-item"><a href="javascript:void(0)"
				onclick="loadAdminContent('${path}/admin/quests', this)"> <i
					class="fas fa-scroll"></i> 퀘스트 관리
			</a></li>
			<li class="admin-nav-item"><a href="javascript:void(0)"
				onclick="loadAdminContent('${path}/admin/store-info', this)"> <i
					class="fas fa-map-marked-alt"></i> 매장 정보 관리
			</a></li>
			<li class="admin-nav-item"><a href="javascript:void(0)"
				onclick="loadAdminContent('${path}/admin/qna', this)"> <i
					class="fas fa-comments"></i> 1:1 문의
			</a></li>
			<li class="admin-nav-item"><a href="javascript:void(0)"
				onclick="loadAdminContent('${path}/admin/notice', this)"> <i
					class="fas fa-bullhorn"></i> 공지사항
			</a></li>
			<li class="admin-nav-item"><a href="javascript:void(0)"
				onclick="loadAdminContent('${path}/admin/faq', this)"> <i
					class="fas fa-question-circle"></i> FAQ
			</a></li>
		</ul>
		
	</div>
</nav>