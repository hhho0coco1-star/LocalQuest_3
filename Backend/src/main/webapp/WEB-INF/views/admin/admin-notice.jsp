<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>

<c:set var="path" value="${pageContext.request.contextPath}" />
<link rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="${path}/css/admin-notice.css">

<div class="adm-n-container">
    <div class="adm-n-header">
        <div class="adm-n-title-wrap">
            <h2 class="adm-n-title">
                <i class="fas fa-bullhorn"></i> 공지사항 관리
            </h2>
            <p class="adm-n-subtitle">
                관리자 공지사항 목록 조회와 등록, 수정, 삭제를 처리합니다.
            </p>
        </div>
        <button type="button" class="adm-n-btn-add" onclick="openAdminNoticeCreateModal()">
            <i class="fas fa-plus"></i> 공지 등록
        </button>
    </div>

    <div class="adm-n-controls">
        <select id="adminNoticePinned" class="adm-n-select" onchange="searchAdminNotice()">
            <option value="">전체 고정 상태</option>
            <option value="1" ${currentPinned == 1 ? 'selected' : ''}>고정 공지</option>
            <option value="0" ${currentPinned == 0 ? 'selected' : ''}>일반 공지</option>
        </select>

        <div class="adm-n-search-box">
            <input
                type="text"
                id="adminNoticeKeyword"
                placeholder="공지 제목 또는 내용 검색"
                value="${currentKeyword}"
                onkeypress="if(event.keyCode==13) searchAdminNotice()">
            <button type="button" onclick="searchAdminNotice()">
                <i class="fas fa-search"></i>
            </button>
        </div>
    </div>

    <c:if test="${not empty noticeLoadError}">
        <div class="adm-n-alert adm-n-alert-error">
            공지사항 목록을 불러오는 중 오류가 발생했습니다:
            <c:out value="${noticeLoadError}" />
        </div>
    </c:if>

    <div class="adm-n-meta">
        <span class="adm-n-meta-badge">전체 ${fn:length(noticeList)}건</span>
        <span class="adm-n-meta-text">고정 공지는 목록 상단에 우선 노출됩니다.</span>
    </div>

    <div class="adm-n-table-wrap">
        <table class="adm-n-table">
            <thead>
                <tr>
                    <th>공지번호</th>
                    <th>구분</th>
                    <th>제목</th>
                    <th>조회수</th>
                    <th>등록일</th>
                    <th>관리</th>
                </tr>
            </thead>
            <tbody>
                <c:choose>
                    <c:when test="${not empty noticeList}">
                        <c:forEach var="notice" items="${noticeList}">
                            <tr id="admin-notice-row-${notice.noticeId}">
                                <td>${notice.noticeId}</td>
                                <td>
                                    <span class="adm-n-badge ${notice.isPinned == 1 ? 'is-pinned' : 'is-normal'}">
                                        <c:choose>
                                            <c:when test="${notice.isPinned == 1}">고정</c:when>
                                            <c:otherwise>일반</c:otherwise>
                                        </c:choose>
                                    </span>
                                </td>
                                <td class="adm-n-title-cell">
                                    <strong><c:out value="${notice.title}" /></strong>
                                    <p><c:out value="${notice.content}" /></p>
                                </td>
                                <td>${notice.viewCount}</td>
                                <td>${notice.createdAt}</td>
                                <td>
                                    <div class="adm-n-actions">
                                        <button
                                            type="button"
                                            class="adm-n-btn-view"
                                            onclick="openAdminNoticeDetailModal(${notice.noticeId})">
                                            상세
                                        </button>
                                        <button
                                            type="button"
                                            class="adm-n-btn-edit"
                                            onclick="openAdminNoticeEditModal(${notice.noticeId})">
                                            수정
                                        </button>
                                        <button
                                            type="button"
                                            class="adm-n-btn-delete"
                                            onclick="deleteAdminNotice(${notice.noticeId})">
                                            삭제
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </c:forEach>
                    </c:when>
                    <c:otherwise>
                        <tr>
                            <td colspan="6" class="adm-n-empty">등록된 공지사항이 없습니다.</td>
                        </tr>
                    </c:otherwise>
                </c:choose>
            </tbody>
        </table>
    </div>
</div>

<div id="adminNoticeDetailModal" class="adm-n-modal">
    <div class="adm-n-modal-content adm-n-detail-modal">
        <div class="adm-n-modal-header">
            <h3><i class="fas fa-file-lines"></i> 공지 상세</h3>
            <span class="adm-n-close" onclick="closeAdminNoticeDetailModal()">&times;</span>
        </div>
        <div class="adm-n-modal-body">
            <div class="adm-n-detail-grid">
                <div class="adm-n-detail-item">
                    <span class="adm-n-detail-label">공지번호</span>
                    <strong id="adminNoticeDetailId">-</strong>
                </div>
                <div class="adm-n-detail-item">
                    <span class="adm-n-detail-label">구분</span>
                    <strong id="adminNoticeDetailPinned">-</strong>
                </div>
                <div class="adm-n-detail-item">
                    <span class="adm-n-detail-label">조회수</span>
                    <strong id="adminNoticeDetailViewCount">-</strong>
                </div>
                <div class="adm-n-detail-item">
                    <span class="adm-n-detail-label">등록일</span>
                    <strong id="adminNoticeDetailCreatedAt">-</strong>
                </div>
            </div>

            <div class="adm-n-detail-block">
                <h4>공지 제목</h4>
                <div class="adm-n-detail-content" id="adminNoticeDetailTitle">-</div>
            </div>

            <div class="adm-n-detail-block">
                <h4>공지 내용</h4>
                <div class="adm-n-detail-content adm-n-detail-content-body" id="adminNoticeDetailContent">-</div>
            </div>
        </div>
        <div class="adm-n-modal-footer">
            <button
                type="button"
                class="adm-n-btn-edit"
                id="adminNoticeDetailEditButton"
                onclick="openAdminNoticeEditModal(Number($('#adminNoticeDetailId').text()) || 0)">
                수정
            </button>
            <button
                type="button"
                class="adm-n-btn-delete"
                id="adminNoticeDetailDeleteButton"
                onclick="deleteAdminNotice(Number($('#adminNoticeDetailId').text()) || 0)">
                삭제
            </button>
            <button type="button" class="adm-n-btn-cancel" onclick="closeAdminNoticeDetailModal()">
                닫기
            </button>
        </div>
    </div>
</div>

<div id="adminNoticeFormModal" class="adm-n-modal">
    <div class="adm-n-modal-content">
        <div class="adm-n-modal-header">
            <h3 id="adminNoticeFormTitle"><i class="fas fa-pen-to-square"></i> 공지 등록</h3>
            <span class="adm-n-close" onclick="closeAdminNoticeFormModal()">&times;</span>
        </div>
        <div class="adm-n-modal-body">
            <input type="hidden" id="adminNoticeFormId" value="0">

            <div class="adm-n-form-grid">
                <div class="adm-n-input-group adm-n-input-group-wide">
                    <label for="adminNoticeFormTitleInput">공지 제목</label>
                    <input type="text" id="adminNoticeFormTitleInput" maxlength="200">
                </div>

                <div class="adm-n-input-group adm-n-input-group-checkbox">
                    <label for="adminNoticeFormPinned">고정 공지</label>
                    <input type="checkbox" id="adminNoticeFormPinned">
                </div>

                <div class="adm-n-input-group adm-n-input-group-wide">
                    <label for="adminNoticeFormContent">공지 내용</label>
                    <textarea id="adminNoticeFormContent" rows="10"></textarea>
                </div>
            </div>
        </div>
        <div class="adm-n-modal-footer">
            <button type="button" class="adm-n-btn-cancel" onclick="closeAdminNoticeFormModal()">취소</button>
            <button type="button" class="adm-n-btn-submit" onclick="submitAdminNotice()">저장</button>
        </div>
    </div>
</div>

<script>
    function searchAdminNotice() {
        const keyword = ($('#adminNoticeKeyword').val() || '').trim();
        const pinned = ($('#adminNoticePinned').val() || '').trim();
        let url = ctx + "/admin/notice";
        const params = [];

        if (keyword) {
            params.push("keyword=" + encodeURIComponent(keyword));
        }
        if (pinned !== '') {
            params.push("pinned=" + encodeURIComponent(pinned));
        }
        if (params.length > 0) {
            url += "?" + params.join("&");
        }

        loadAdminContent(url);
    }

    function loadAdminNoticeDetail(noticeId, onSuccess) {
        $.ajax({
            url: ctx + "/admin/notice/detail",
            type: "GET",
            dataType: "json",
            data: { noticeId: noticeId },
            success: function(res) {
                if (res && typeof onSuccess === "function") {
                    onSuccess(res);
                    return;
                }
                alert("공지 정보를 찾을 수 없습니다.");
            },
            error: function(xhr) {
                alert("서버 통신 오류 (" + xhr.status + ")");
            }
        });
    }

    function resetAdminNoticeDetailModal() {
        $('#adminNoticeDetailId').text('-');
        $('#adminNoticeDetailPinned').text('-');
        $('#adminNoticeDetailViewCount').text('-');
        $('#adminNoticeDetailCreatedAt').text('-');
        $('#adminNoticeDetailTitle').text('-');
        $('#adminNoticeDetailContent').text('-');
    }

    function resetAdminNoticeFormModal() {
        $('#adminNoticeFormId').val('0');
        $('#adminNoticeFormTitle').html('<i class="fas fa-pen-to-square"></i> 공지 등록');
        $('#adminNoticeFormTitleInput').val('');
        $('#adminNoticeFormPinned').prop('checked', false);
        $('#adminNoticeFormContent').val('');
    }

    function openAdminNoticeCreateModal() {
        resetAdminNoticeFormModal();
        $('#adminNoticeFormModal').fadeIn(200);
        setTimeout(function() {
            $('#adminNoticeFormTitleInput').trigger('focus');
        }, 0);
    }

    function openAdminNoticeDetailModal(noticeId) {
        resetAdminNoticeDetailModal();
        $('#adminNoticeDetailModal').fadeIn(200);

        loadAdminNoticeDetail(noticeId, function(data) {
            $('#adminNoticeDetailId').text(data.noticeId || '-');
            $('#adminNoticeDetailPinned').text(Number(data.isPinned) === 1 ? '고정 공지' : '일반 공지');
            $('#adminNoticeDetailViewCount').text(data.viewCount || 0);
            $('#adminNoticeDetailCreatedAt').text(data.createdAt || '-');
            $('#adminNoticeDetailTitle').text(data.title || '-');
            $('#adminNoticeDetailContent').text(data.content || '-');
        });
    }

    function openAdminNoticeEditModal(noticeId) {
        resetAdminNoticeFormModal();
        $('#adminNoticeFormTitle').html('<i class="fas fa-pen-to-square"></i> 공지 수정');
        $('#adminNoticeFormModal').fadeIn(200);

        loadAdminNoticeDetail(noticeId, function(data) {
            $('#adminNoticeFormId').val(data.noticeId || 0);
            $('#adminNoticeFormTitleInput').val(data.title || '');
            $('#adminNoticeFormPinned').prop('checked', Number(data.isPinned) === 1);
            $('#adminNoticeFormContent').val(data.content || '');
            setTimeout(function() {
                $('#adminNoticeFormTitleInput').trigger('focus');
            }, 0);
        });
    }

    function closeAdminNoticeDetailModal() {
        $('#adminNoticeDetailModal').fadeOut(200);
    }

    function closeAdminNoticeFormModal() {
        $('#adminNoticeFormModal').fadeOut(200);
    }

    function submitAdminNotice() {
        const noticeId = Number($('#adminNoticeFormId').val()) || 0;
        const title = ($('#adminNoticeFormTitleInput').val() || '').trim();
        const content = ($('#adminNoticeFormContent').val() || '').trim();
        const isPinned = $('#adminNoticeFormPinned').is(':checked') ? 1 : 0;
        const payload = {
            title: title,
            content: content,
            isPinned: isPinned
        };

        if (!title) {
            alert("공지 제목을 입력해 주세요.");
            return;
        }

        if (!content) {
            alert("공지 내용을 입력해 주세요.");
            return;
        }

        $.ajax({
            url: noticeId > 0 ? ctx + "/api/notices/" + noticeId : ctx + "/api/notices",
            type: noticeId > 0 ? "PUT" : "POST",
            contentType: "application/json; charset=UTF-8",
            data: JSON.stringify(payload),
            success: function() {
                closeAdminNoticeFormModal();
                alert(noticeId > 0 ? "공지사항이 수정되었습니다." : "공지사항이 등록되었습니다.");
                searchAdminNotice();
            },
            error: function(xhr) {
                alert("공지사항 저장에 실패했습니다. (" + xhr.status + ")");
            }
        });
    }

    function deleteAdminNotice(noticeId) {
        const targetNoticeId = Number(noticeId) || 0;

        if (!(targetNoticeId > 0)) {
            alert("삭제할 공지 정보를 다시 확인해 주세요.");
            return;
        }

        if (!confirm("이 공지사항을 삭제하시겠습니까?")) {
            return;
        }

        $.ajax({
            url: ctx + "/api/notices/" + targetNoticeId,
            type: "DELETE",
            success: function() {
                closeAdminNoticeDetailModal();
                alert("공지사항이 삭제되었습니다.");
                searchAdminNotice();
            },
            error: function(xhr) {
                alert("공지사항 삭제에 실패했습니다. (" + xhr.status + ")");
            }
        });
    }
</script>
