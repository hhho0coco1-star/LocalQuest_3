<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>

<c:set var="path" value="${pageContext.request.contextPath}" />
<link rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="${path}/css/admin-qna.css">

<div class="adm-i-container">
    <div class="adm-i-header">
        <div class="adm-i-title-wrap">
            <h2 class="adm-i-title">
                <i class="fas fa-comments"></i> 1:1 문의 관리
            </h2>
            <p class="adm-i-subtitle">
                1단계 기반 작업이 적용된 화면입니다. 다음 단계에서 전체조회와 검색 결과가 연결됩니다.
            </p>
        </div>
    </div>

    <div class="adm-i-controls">
        <select id="adminInquiryStatus" class="adm-i-select">
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
                value="${currentKeyword}">
        </div>

        <div class="adm-i-search-box adm-i-user-box">
            <input
                type="number"
                id="adminInquiryUserId"
                min="1"
                placeholder="회원번호"
                value="${currentUserId}">
        </div>

        <button type="button" class="adm-i-btn-search" disabled>검색</button>
    </div>

    <div class="adm-i-meta">
        <span class="adm-i-meta-badge">상태값 기준: PENDING / ANSWERED</span>
        <span class="adm-i-meta-text">답변, 수정, 삭제 액션은 다음 단계에서 연결합니다.</span>
    </div>

    <div class="adm-i-table-wrap">
        <table class="adm-i-table">
            <thead>
                <tr>
                    <th>문의번호</th>
                    <th>회원번호</th>
                    <th>제목</th>
                    <th>상태</th>
                    <th>등록일</th>
                    <th>답변일</th>
                    <th>관리</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="7" class="adm-i-empty">
                        목록/검색/답변/수정/삭제 기능은 다음 단계부터 순서대로 연결됩니다.
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
