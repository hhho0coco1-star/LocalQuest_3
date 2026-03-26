<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>

<c:set var="path" value="${pageContext.request.contextPath}" />
<link rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="${path}/css/admin-qna-manage-v2.css">

<div class="adm-i-container">
    <div class="adm-i-header">
        <div class="adm-i-title-wrap">
            <h2 class="adm-i-title">
                <i class="fas fa-comments"></i> 1:1 문의 관리
            </h2>
            <p class="adm-i-subtitle">
                문의 목록 조회, 검색, 답변 등록 및 수정, 삭제를 한 화면에서 처리합니다.
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
                placeholder="문의 제목 또는 내용으로 검색"
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
                            <tr class="adm-i-row" id="admin-inquiry-row-${inquiry.inquiryId}">
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
                                        <button
                                            type="button"
                                            class="adm-i-btn-answer"
                                            onclick="openAdminInquiryAnswerModal(${inquiry.inquiryId})">
                                            <c:choose>
                                                <c:when test="${inquiry.status == 'PENDING'}">답변</c:when>
                                                <c:otherwise>수정</c:otherwise>
                                            </c:choose>
                                        </button>
                                        <button
                                            type="button"
                                            class="adm-i-btn-delete"
                                            onclick="deleteAdminInquiry(${inquiry.inquiryId})">
                                            삭제
                                        </button>
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
            <input type="hidden" id="adminInquiryDetailStatusValue" value="">

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
                <label id="adminInquiryAnswerLabel" for="adminInquiryAnswerContent">답변 작성</label>
                <textarea
                    id="adminInquiryAnswerContent"
                    rows="6"
                    placeholder="관리자 답변을 입력하세요."></textarea>
                <div class="adm-i-answer-actions">
                    <button
                        type="button"
                        class="adm-i-btn-answer-submit"
                        id="adminInquiryAnswerSubmitButton"
                        onclick="submitAdminInquiryAnswer()">
                        답변 등록
                    </button>
                </div>
            </div>
        </div>
        <div class="adm-i-modal-footer">
            <div class="adm-i-modal-footer-actions">
                <button
                    type="button"
                    class="adm-i-btn-delete"
                    id="adminInquiryDeleteButton"
                    onclick="deleteAdminInquiry()">
                    문의 삭제
                </button>
                <button
                    type="button"
                    class="adm-i-btn-answer adm-i-btn-answer-ghost"
                    id="adminInquiryOpenAnswerButton"
                    onclick="openAdminInquiryAnswerModal(Number($('#adminInquiryDetailId').val()) || 0)">
                    답변 등록
                </button>
            </div>
        </div>
    </div>
</div>

<script>
    function searchAdminInquiry() {
        const keyword = ($('#adminInquiryKeyword').val() || '').trim();
        const status = ($('#adminInquiryStatus').val() || '').trim();
        const userId = ($('#adminInquiryUserId').val() || '').trim();
        let url = ctx + "/admin/qna";
        const params = [];

        if (keyword) {
            params.push("keyword=" + encodeURIComponent(keyword));
        }
        if (status) {
            params.push("status=" + encodeURIComponent(status));
        }
        if (userId) {
            params.push("userId=" + encodeURIComponent(userId));
        }
        if (params.length > 0) {
            url += "?" + params.join("&");
        }

        loadAdminContent(url);
    }

    function loadAdminInquiryDetail(inquiryId, onSuccess) {
        $.ajax({
            url: ctx + "/admin/qna/detail",
            type: "GET",
            dataType: "json",
            data: { inquiryId: inquiryId },
            success: function(res) {
                if (res && typeof onSuccess === "function") {
                    onSuccess(res);
                    return;
                }
                closeAdminInquiryDetailModal();
                alert("문의 정보를 찾을 수 없습니다.");
            },
            error: function(xhr) {
                closeAdminInquiryDetailModal();
                alert("서버 통신 오류 (" + xhr.status + ")");
            }
        });
    }

    function resetAdminInquiryModal() {
        $('#adminInquiryDetailId').val('');
        $('#adminInquiryDetailStatusValue').val('');
        $('#adminInquiryDetailInquiryId').text('-');
        $('#adminInquiryDetailUserId').text('-');
        $('#adminInquiryDetailStatus').text('-');
        $('#adminInquiryDetailCreatedAt').text('-');
        $('#adminInquiryDetailAnsweredAt').text('-');
        $('#adminInquiryDetailTitle').text('-');
        $('#adminInquiryDetailContent').text('-');
        $('#adminInquiryDetailAnswerContent').text('-');
        $('#adminInquiryAnswerContent').val('');
        $('#adminInquiryAnswerReadBlock').hide();
        $('#adminInquiryAnswerEditor').hide();
        $('#adminInquiryModalTitle').text('문의 상세');
        $('#adminInquiryAnswerLabel').text('답변 작성');
        $('#adminInquiryAnswerSubmitButton').text('답변 등록');
        $('#adminInquiryOpenAnswerButton').text('답변 등록').show();
        $('#adminInquiryDeleteButton').show();
    }

    function openAdminInquiryDetailModal(inquiryId, focusAnswer) {
        resetAdminInquiryModal();
        $('#adminInquiryModal').fadeIn(200);

        loadAdminInquiryDetail(inquiryId, function(data) {
            const status = String(data.status || '').toUpperCase();
            const isPending = status === 'PENDING';
            const hasAnswer = !!String(data.answerContent || '').trim();
            const shouldShowEditor = !!focusAnswer;

            $('#adminInquiryDetailId').val(data.inquiryId || '');
            $('#adminInquiryDetailStatusValue').val(status);
            $('#adminInquiryDetailInquiryId').text(data.inquiryId || '-');
            $('#adminInquiryDetailUserId').text(data.userId || '-');
            $('#adminInquiryDetailStatus').text(data.status || '-');
            $('#adminInquiryDetailCreatedAt').text(data.createdAt || '-');
            $('#adminInquiryDetailAnsweredAt').text(data.answeredAt || '-');
            $('#adminInquiryDetailTitle').text(data.title || '-');
            $('#adminInquiryDetailContent').text(data.content || '-');
            $('#adminInquiryDetailAnswerContent').text(hasAnswer ? data.answerContent : '등록된 답변이 없습니다.');
            $('#adminInquiryAnswerContent').val(data.answerContent || '');
            $('#adminInquiryOpenAnswerButton').text(isPending ? '답변 등록' : '답변 수정');

            if (hasAnswer) {
                $('#adminInquiryAnswerReadBlock').show();
            }

            if (!shouldShowEditor) {
                $('#adminInquiryModalTitle').text('문의 상세');
                return;
            }

            $('#adminInquiryModalTitle').text(isPending ? '문의 답변' : '답변 수정');
            $('#adminInquiryAnswerLabel').text(isPending ? '답변 작성' : '답변 수정');
            $('#adminInquiryAnswerSubmitButton').text(isPending ? '답변 등록' : '답변 저장');
            $('#adminInquiryAnswerEditor').show();
            $('#adminInquiryOpenAnswerButton').hide();
            setTimeout(function() {
                $('#adminInquiryAnswerContent').trigger('focus');
            }, 0);
        });
    }

    function openAdminInquiryAnswerModal(inquiryId) {
        openAdminInquiryDetailModal(inquiryId, true);
    }

    function closeAdminInquiryDetailModal() {
        $('#adminInquiryModal').fadeOut(200);
    }

    function deleteAdminInquiry(inquiryId) {
        const targetInquiryId = Number(inquiryId) || Number($('#adminInquiryDetailId').val()) || 0;

        if (!targetInquiryId) {
            alert("삭제할 문의 정보를 다시 확인해 주세요.");
            return;
        }

        if (!confirm("이 문의를 삭제하시겠습니까?")) {
            return;
        }

        $.ajax({
            url: ctx + "/admin/qna/delete",
            type: "POST",
            data: { inquiryId: targetInquiryId },
            success: function(res) {
                const normalized = String(res || '').trim();
                if (normalized === "success") {
                    closeAdminInquiryDetailModal();
                    alert("문의가 삭제되었습니다.");
                    searchAdminInquiry();
                    return;
                }
                alert("문의 삭제에 실패했습니다.");
            },
            error: function(xhr) {
                alert("서버 통신 오류 (" + xhr.status + ")");
            }
        });
    }

    function submitAdminInquiryAnswer() {
        const inquiryId = Number($('#adminInquiryDetailId').val()) || 0;
        const answerContent = ($('#adminInquiryAnswerContent').val() || '').trim();

        if (!inquiryId) {
            alert("문의 정보를 다시 불러와 주세요.");
            return;
        }
        if (!answerContent) {
            alert("답변 내용을 입력해 주세요.");
            return;
        }

        $.ajax({
            url: ctx + "/admin/qna/answer",
            type: "POST",
            data: {
                inquiryId: inquiryId,
                answerContent: answerContent
            },
            success: function(res) {
                const normalized = String(res || '').trim();
                if (normalized === "success") {
                    closeAdminInquiryDetailModal();
                    alert("답변이 저장되었습니다.");
                    searchAdminInquiry();
                    return;
                }
                if (normalized === "fail:empty_answer") {
                    alert("답변 내용을 입력해 주세요.");
                    return;
                }
                alert("답변 저장에 실패했습니다.");
            },
            error: function(xhr) {
                alert("서버 통신 오류 (" + xhr.status + ")");
            }
        });
    }
</script>
