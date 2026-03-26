<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>

<c:set var="path" value="${pageContext.request.contextPath}" />
<link rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="${path}/css/admin-qna-list.css">

<div class="adm-i-container">
    <div class="adm-i-header">
        <div class="adm-i-title-wrap">
            <h2 class="adm-i-title">
                <i class="fas fa-comments"></i> 1:1 문의 관리
            </h2>
            <p class="adm-i-subtitle">
                전체 문의 목록과 검색 결과를 확인할 수 있습니다.
            </p>
        </div>
    </div>

    <div class="adm-i-controls">
        <select id="adminInquiryStatus" class="adm-i-select" onchange="searchAdminInquiry()">
            <option value="">전체 상태</option>
            <c:forEach var="statusOption" items="${statusOptions}">
                <option value="${statusOption}" ${currentStatus == statusOption ? 'selected' : ''}>
                    ${statusOption}
                </option>
            </c:forEach>
        </select>

        <div class="adm-i-search-box">
            <input
                type="text"
                id="adminInquiryKeyword"
                placeholder="문의 제목 또는 내용을 검색하세요"
                value="${currentKeyword}"
                onkeypress="if(event.keyCode==13) searchAdminInquiry()">
        </div>

        <div class="adm-i-search-box adm-i-user-box">
            <input
                type="number"
                id="adminInquiryUserId"
                min="1"
                placeholder="회원번호"
                value="${currentUserId}"
                onkeypress="if(event.keyCode==13) searchAdminInquiry()">
        </div>

        <button type="button" class="adm-i-btn-search" onclick="searchAdminInquiry()">검색</button>
    </div>

    <c:if test="${not empty inquiryLoadError}">
        <div class="adm-i-alert adm-i-alert-error">
            문의 목록을 불러오는 중 오류가 발생했습니다: <c:out value="${inquiryLoadError}" />
        </div>
    </c:if>

    <div class="adm-i-meta">
        <span class="adm-i-meta-badge">상태값 기준: PENDING / ANSWERED</span>
        <span class="adm-i-meta-text">전체 ${fn:length(inquiryList)}건</span>
    </div>

    <div class="adm-i-table-wrap">
        <table class="adm-i-table">
            <thead>
                <tr>
                    <th>문의번호</th>
                    <th>회원번호</th>
                    <th>제목 / 내용</th>
                    <th>상태</th>
                    <th>등록일</th>
                    <th>답변일</th>
                    <th>관리</th>
                </tr>
            </thead>
            <tbody>
                <c:choose>
                    <c:when test="${not empty inquiryList}">
                        <c:forEach var="inquiry" items="${inquiryList}">
                            <tr class="adm-i-row">
                                <td>${inquiry.inquiryId}</td>
                                <td>${inquiry.userId}</td>
                                <td class="adm-i-title-cell">
                                    <strong><c:out value="${inquiry.title}" /></strong>
                                    <p><c:out value="${inquiry.content}" /></p>
                                </td>
                                <td>
                                    <span class="adm-i-status ${inquiry.status}">${inquiry.status}</span>
                                </td>
                                <td>${inquiry.createdAt}</td>
                                <td>
                                    <c:choose>
                                        <c:when test="${not empty inquiry.answeredAt}">
                                            ${inquiry.answeredAt}
                                        </c:when>
                                        <c:otherwise>-</c:otherwise>
                                    </c:choose>
                                </td>
                                <td>
                                    <span class="adm-i-action-placeholder">다음 단계에서 연결</span>
                                </td>
                            </tr>
                        </c:forEach>
                    </c:when>
                    <c:otherwise>
                        <tr>
                            <td colspan="7" class="adm-i-empty">조회된 1:1 문의가 없습니다.</td>
                        </tr>
                    </c:otherwise>
                </c:choose>
            </tbody>
        </table>
    </div>
</div>
