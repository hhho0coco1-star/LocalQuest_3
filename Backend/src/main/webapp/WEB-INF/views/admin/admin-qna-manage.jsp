<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>

<c:set var="path" value="${pageContext.request.contextPath}" />
<link rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="${path}/css/admin-qna-manage.css">

<div class="adm-i-container">
    <div class="adm-i-header">
        <div class="adm-i-title-wrap">
            <h2 class="adm-i-title">
                <i class="fas fa-comments"></i> 1:1 문의 관리
            </h2>
            <p class="adm-i-subtitle">
                문의 상세 내용을 확인하고, 미답변 문의에는 관리자 답변을 등록할 수 있습니다.
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
            문의 목록을 불러오는 중 오류가 발생했습니다:
            <c:out value="${inquiryLoadError}" />
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
                                    <div class="adm-i-actions">
                                        <button
                                            type="button"
                                            class="adm-i-btn-view"
                                            onclick="openAdminInquiryDetailModal(${inquiry.inquiryId}, false)">
                                            상세
                                        </button>
                                        <c:if test="${inquiry.status == 'PENDING'}">
                                            <button
                                                type="button"
                                                class="adm-i-btn-answer"
                                                onclick="openAdminInquiryAnswerModal(${inquiry.inquiryId})">
                                                답변
                                            </button>
                                        </c:if>
                                    </div>
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

<div id="adminInquiryModal" class="adm-i-modal">
    <div class="adm-i-modal-content">
        <div class="adm-i-modal-header">
            <h3 id="adminInquiryModalTitle">문의 상세</h3>
            <span class="adm-i-close" onclick="closeAdminInquiryDetailModal()">&times;</span>
        </div>
        <div class="adm-i-modal-body">
            <input type="hidden" id="adminInquiryDetailId" value="">

            <div class="adm-i-detail-grid">
                <div class="adm-i-detail-item">
                    <span class="adm-i-detail-label">문의번호</span>
                    <strong id="adminInquiryDetailInquiryId">-</strong>
                </div>
                <div class="adm-i-detail-item">
                    <span class="adm-i-detail-label">회원번호</span>
                    <strong id="adminInquiryDetailUserId">-</strong>
                </div>
                <div class="adm-i-detail-item">
                    <span class="adm-i-detail-label">상태</span>
                    <strong id="adminInquiryDetailStatus">-</strong>
                </div>
                <div class="adm-i-detail-item">
                    <span class="adm-i-detail-label">등록일</span>
                    <strong id="adminInquiryDetailCreatedAt">-</strong>
                </div>
                <div class="adm-i-detail-item">
                    <span class="adm-i-detail-label">답변일</span>
                    <strong id="adminInquiryDetailAnsweredAt">-</strong>
                </div>
            </div>

            <div class="adm-i-detail-block">
                <h4>문의 제목</h4>
                <div class="adm-i-detail-content" id="adminInquiryDetailTitle">-</div>
            </div>

            <div class="adm-i-detail-block">
                <h4>문의 내용</h4>
                <div class="adm-i-detail-content" id="adminInquiryDetailContent">-</div>
            </div>

            <div class="adm-i-detail-block" id="adminInquiryAnswerReadBlock">
                <h4>등록된 답변</h4>
                <div class="adm-i-detail-content" id="adminInquiryDetailAnswerContent">-</div>
            </div>

            <div class="adm-i-answer-editor" id="adminInquiryAnswerEditor">
                <label for="adminInquiryAnswerContent">답변 작성</label>
                <textarea
                    id="adminInquiryAnswerContent"
                    rows="6"
                    placeholder="관리자 답변을 입력하세요"></textarea>
                <div class="adm-i-answer-actions">
                    <button type="button" class="adm-i-btn-answer-submit" onclick="submitAdminInquiryAnswer()">
                        답변 등록
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
