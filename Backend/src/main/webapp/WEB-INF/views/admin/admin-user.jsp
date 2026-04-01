<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>

<c:set var="path" value="${pageContext.request.contextPath}" />
<link rel="stylesheet"
	href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="${path}/css/admin-user.css">

<div class="adm-u-container" data-current-page="${currentPage}" data-page-size="${pageSize}">
	<div class="adm-u-header">
		<h2 class="adm-u-title">
			<i class="fas fa-users-cog"></i> 회원 관리
		</h2>
		<div class="adm-u-search-group">
			<select id="searchType" class="adm-u-select">
				<option value="userLoginId"
					${searchType == 'userLoginId' ? 'selected' : ''}>아이디</option>
				<option value="name" ${searchType == 'name' ? 'selected' : ''}>이름</option>
				<option value="nickname"
					${searchType == 'nickname' ? 'selected' : ''}>닉네임</option>
			</select> <input type="text" id="keyword" class="adm-u-input"
				placeholder="검색어를 입력하세요" value="${keyword}"
				onkeyup="if(window.event.keyCode==13){searchUser()}">

			<button onclick="searchUser()" class="adm-u-btn-search">검색</button>
		</div>
	</div>

	<div class="adm-u-summary">총 <strong>${totalCount}</strong>명</div>

	<table class="adm-u-table">
		<thead>
			<tr>
				<th onclick="sortUserList()" style="cursor: pointer;">
					번호 <i
					class="fas ${sort == 'ASC' ? 'fa-sort-up' : (sort == 'DESC' ? 'fa-sort-down' : 'fa-sort')}"
					id="sortIcon"></i>
				</th>
				<th>아이디</th>
				<th>이름</th>
				<th>닉네임</th>
				<th>타입</th>
				<th>상태</th>
				<th>가입일</th>
				<th>설정</th>
			</tr>
		</thead>
		<tbody id="userTableBody">
			<c:if test="${empty userList}">
				<tr class="adm-u-row adm-u-empty">
					<td colspan="8">조건에 맞는 회원이 없습니다.</td>
				</tr>
			</c:if>
			<c:forEach var="user" items="${userList}">
				<tr class="adm-u-row">
					<td>${user.userId}</td>
					<td class="adm-u-bold">${user.userLoginId}</td>
					<td>${user.name}</td>
					<td>${user.nickname}</td>
					<td><select class="adm-u-table-select"
						onchange="updateRole(${user.userId}, this.value)"
						<%-- 1번 마스터이거나(OR) 상태가 정지(WITHDRAWN)인 경우 비활성화 --%>
            ${(user.userId==
						1 || user.status=='WITHDRAWN') ? 'disabled' : ''}>

							<option value="USER" ${user.role == 'USER' ? 'selected' : ''}>일반</option>
							<option value="BUSINESS"
								${user.role == 'BUSINESS' ? 'selected' : ''}>비즈니스</option>
							<option value="ADMIN" ${user.role == 'ADMIN' ? 'selected' : ''}>관리자</option>
					</select> <%-- 안내 문구 추가 (선택사항) --%> <c:choose>
							<c:when test="${user.userId == 1}">
								<small class="adm-u-role-note adm-u-role-note-master">Master</small>
							</c:when>
							<c:when test="${user.status == 'WITHDRAWN'}">
								<small class="adm-u-role-note adm-u-role-note-withdrawn">정지된 회원</small>
							</c:when>
						</c:choose></td>
					<td><span class="adm-u-badge ${user.status}">${user.status}</span>
					</td>
					<td class="adm-u-date">${user.createdAt}</td>
					<td><c:choose>
							<%-- 정지 상태일 때 -> 활성화 버튼 --%>
							<c:when test="${user.status == 'WITHDRAWN'}">
								<button class="adm-u-btn-activate"
									onclick="updateStatus(${user.userId}, 'ACTIVE')">활성화</button>
							</c:when>

							<%-- 정상 상태일 때 -> 정지 버튼 --%>
							<c:otherwise>
								<c:if test="${user.userId != 1}">
									<%-- 마스터는 버튼 아예 안나오게 --%>
									<button class="adm-u-btn-stop"
										onclick="updateStatus(${user.userId}, 'WITHDRAWN')">
										정지</button>
								</c:if>
							</c:otherwise>
						</c:choose></td>
				</tr>
			</c:forEach>
		</tbody>
	</table>

	<c:if test="${totalPages > 1}">
		<div class="adm-u-pagination">
			<button type="button" class="adm-u-page-btn"
				onclick="goUserPage(${currentPage - 1})"
				${currentPage <= 1 ? 'disabled' : ''}>이전</button>
			<c:forEach var="pageNumber" begin="${startPage}" end="${endPage}">
				<button type="button"
					class="adm-u-page-btn ${pageNumber == currentPage ? 'is-active' : ''}"
					onclick="goUserPage(${pageNumber})">${pageNumber}</button>
			</c:forEach>
			<button type="button" class="adm-u-page-btn"
				onclick="goUserPage(${currentPage + 1})"
				${currentPage >= totalPages ? 'disabled' : ''}>다음</button>
		</div>
	</c:if>
</div>
