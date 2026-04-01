<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>

<c:set var="path" value="${pageContext.request.contextPath}" />
<link rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="${path}/css/admin-faq.css">

<div class="adm-f-container" data-current-page="${currentPage}" data-page-size="${pageSize}">
    <div class="adm-f-header">
        <div class="adm-f-title-wrap">
            <h2 class="adm-f-title">
                <i class="fas fa-question-circle"></i> FAQ 관리
            </h2>
            <p class="adm-f-subtitle">
                관리자가 직접 질문과 답변을 작성하는 공지사항형 FAQ를 조회하고 관리합니다.
            </p>
        </div>
        <button type="button" class="adm-f-btn-add" onclick="openAdminFaqCreateModal()">
            <i class="fas fa-plus"></i> FAQ 등록
        </button>
    </div>

    <div class="adm-f-controls">
        <div class="adm-f-filter-box">
            <input
                type="text"
                id="adminFaqCategoryFilter"
                list="adminFaqCategoryFilterList"
                placeholder="카테고리 입력"
                value="${currentCategory}"
                onkeypress="if(event.keyCode==13) searchAdminFaq()">
            <datalist id="adminFaqCategoryFilterList">
                <c:forEach var="categoryOption" items="${faqCategoryOptions}">
                    <option value="${categoryOption}"></option>
                </c:forEach>
            </datalist>
        </div>

        <div class="adm-f-search-box">
            <input
                type="text"
                id="adminFaqKeyword"
                placeholder="질문, 답변, 카테고리 검색"
                value="${currentKeyword}"
                onkeypress="if(event.keyCode==13) searchAdminFaq()">
            <button type="button" onclick="searchAdminFaq()">
                <i class="fas fa-search"></i>
            </button>
        </div>
    </div>

    <c:if test="${not empty faqLoadError}">
        <div class="adm-f-alert adm-f-alert-error">
            FAQ 목록을 불러오는 중 오류가 발생했습니다:
            <c:out value="${faqLoadError}" />
        </div>
    </c:if>

    <div class="adm-f-meta">
        <span class="adm-f-meta-badge">전체 ${totalCount}건</span>
        <span class="adm-f-meta-text">FAQ 상세 조회는 관리자 화면에서 조회수를 올리지 않습니다.</span>
    </div>

    <div class="adm-f-table-wrap">
        <table class="adm-f-table">
            <thead>
                <tr>
                    <th>FAQ번호</th>
                    <th>카테고리</th>
                    <th>질문</th>
                    <th>답변 요약</th>
                    <th>조회수</th>
                    <th>등록일</th>
                    <th>관리</th>
                </tr>
            </thead>
            <tbody>
                <c:choose>
                    <c:when test="${not empty faqList}">
                        <c:forEach var="faq" items="${faqList}">
                            <tr id="admin-faq-row-${faq.faqId}">
                                <td>${faq.faqId}</td>
                                <td>
                                    <span class="adm-f-category-badge">
                                        <c:out value="${faq.category}" />
                                    </span>
                                </td>
                                <td class="adm-f-question-cell">
                                    <strong><c:out value="${faq.question}" /></strong>
                                </td>
                                <td class="adm-f-answer-cell">
                                    <p><c:out value="${faq.answer}" /></p>
                                </td>
                                <td>${faq.viewCount}</td>
                                <td>${faq.createdAt}</td>
                                <td>
                                    <div class="adm-f-actions">
                                        <button
                                            type="button"
                                            class="adm-f-btn-view"
                                            onclick="openAdminFaqDetailModal(${faq.faqId})">
                                            상세
                                        </button>
                                        <button
                                            type="button"
                                            class="adm-f-btn-edit"
                                            onclick="openAdminFaqEditModal(${faq.faqId})">
                                            수정
                                        </button>
                                        <button
                                            type="button"
                                            class="adm-f-btn-delete"
                                            onclick="deleteAdminFaq(${faq.faqId})">
                                            삭제
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </c:forEach>
                    </c:when>
                    <c:otherwise>
                        <tr>
                            <td colspan="7" class="adm-f-empty">등록된 FAQ가 없습니다.</td>
                        </tr>
                    </c:otherwise>
                </c:choose>
            </tbody>
        </table>
    </div>

    <c:if test="${totalPages > 1}">
        <div class="adm-f-pagination">
            <button type="button" class="adm-f-page-btn"
                onclick="goAdminFaqPage(${currentPage - 1})"
                ${currentPage <= 1 ? 'disabled' : ''}>이전</button>
            <c:forEach var="pageNumber" begin="${startPage}" end="${endPage}">
                <button type="button"
                    class="adm-f-page-btn ${pageNumber == currentPage ? 'is-active' : ''}"
                    onclick="goAdminFaqPage(${pageNumber})">${pageNumber}</button>
            </c:forEach>
            <button type="button" class="adm-f-page-btn"
                onclick="goAdminFaqPage(${currentPage + 1})"
                ${currentPage >= totalPages ? 'disabled' : ''}>다음</button>
        </div>
    </c:if>
</div>

<div id="adminFaqDetailModal" class="adm-f-modal">
    <div class="adm-f-modal-content adm-f-detail-modal">
        <div class="adm-f-modal-header">
            <h3><i class="fas fa-file-lines"></i> FAQ 상세</h3>
            <span class="adm-f-close" onclick="closeAdminFaqDetailModal()">&times;</span>
        </div>
        <div class="adm-f-modal-body">
            <div class="adm-f-detail-grid">
                <div class="adm-f-detail-item">
                    <span class="adm-f-detail-label">FAQ번호</span>
                    <strong id="adminFaqDetailId">-</strong>
                </div>
                <div class="adm-f-detail-item">
                    <span class="adm-f-detail-label">카테고리</span>
                    <strong id="adminFaqDetailCategory">-</strong>
                </div>
                <div class="adm-f-detail-item">
                    <span class="adm-f-detail-label">조회수</span>
                    <strong id="adminFaqDetailViewCount">-</strong>
                </div>
                <div class="adm-f-detail-item">
                    <span class="adm-f-detail-label">등록일</span>
                    <strong id="adminFaqDetailCreatedAt">-</strong>
                </div>
            </div>

            <div class="adm-f-detail-block">
                <h4>질문</h4>
                <div class="adm-f-detail-content" id="adminFaqDetailQuestion">-</div>
            </div>

            <div class="adm-f-detail-block">
                <h4>답변</h4>
                <div class="adm-f-detail-content adm-f-detail-content-body" id="adminFaqDetailAnswer">-</div>
            </div>
        </div>
        <div class="adm-f-modal-footer">
            <button
                type="button"
                class="adm-f-btn-edit"
                onclick="openAdminFaqEditModal(Number($('#adminFaqDetailId').text()) || 0)">
                수정
            </button>
            <button
                type="button"
                class="adm-f-btn-delete"
                onclick="deleteAdminFaq(Number($('#adminFaqDetailId').text()) || 0)">
                삭제
            </button>
            <button type="button" class="adm-f-btn-cancel" onclick="closeAdminFaqDetailModal()">
                닫기
            </button>
        </div>
    </div>
</div>

<div id="adminFaqFormModal" class="adm-f-modal">
    <div class="adm-f-modal-content">
        <div class="adm-f-modal-header">
            <h3 id="adminFaqFormTitle"><i class="fas fa-pen-to-square"></i> FAQ 등록</h3>
            <span class="adm-f-close" onclick="closeAdminFaqFormModal()">&times;</span>
        </div>
        <div class="adm-f-modal-body">
            <input type="hidden" id="adminFaqFormId" value="0">

            <div class="adm-f-form-grid">
                <div class="adm-f-input-group">
                    <label for="adminFaqFormCategory">카테고리</label>
                    <input
                        type="text"
                        id="adminFaqFormCategory"
                        list="adminFaqCategoryFormList"
                        maxlength="50"
                        placeholder="예: ACCOUNT, QUEST, REWARD">
                    <datalist id="adminFaqCategoryFormList">
                        <c:forEach var="categoryOption" items="${faqCategoryOptions}">
                            <option value="${categoryOption}"></option>
                        </c:forEach>
                    </datalist>
                </div>

                <div class="adm-f-input-group adm-f-input-group-wide">
                    <label for="adminFaqFormQuestion">질문</label>
                    <input
                        type="text"
                        id="adminFaqFormQuestion"
                        maxlength="500"
                        placeholder="관리자가 노출할 질문을 입력하세요.">
                </div>

                <div class="adm-f-input-group adm-f-input-group-wide">
                    <label for="adminFaqFormAnswer">답변</label>
                    <textarea
                        id="adminFaqFormAnswer"
                        rows="10"
                        maxlength="4000"
                        placeholder="사용자에게 보여줄 답변을 작성하세요."></textarea>
                </div>
            </div>
        </div>
        <div class="adm-f-modal-footer">
            <button type="button" class="adm-f-btn-cancel" onclick="closeAdminFaqFormModal()">취소</button>
            <button type="button" class="adm-f-btn-submit" onclick="submitAdminFaq()">저장</button>
        </div>
    </div>
</div>

<script>
    function buildAdminFaqListUrl(page) {
        const keyword = ($('#adminFaqKeyword').val() || '').trim();
        const category = ($('#adminFaqCategoryFilter').val() || '').trim();
        const params = new URLSearchParams();

        params.set("page", String(page > 0 ? page : 1));
        params.set("size", "30");
        if (category) {
            params.set("category", category);
        }
        if (keyword) {
            params.set("keyword", keyword);
        }
        return ctx + "/admin/faq?" + params.toString();
    }

    function searchAdminFaq() {
        loadAdminContent(buildAdminFaqListUrl(1));
    }

    function goAdminFaqPage(page) {
        loadAdminContent(buildAdminFaqListUrl(page));
    }

    function loadAdminFaqDetail(faqId, onSuccess) {
        $.ajax({
            url: ctx + "/admin/faq/detail",
            type: "GET",
            dataType: "json",
            data: { faqId: faqId },
            success: function(res) {
                if (res && typeof onSuccess === "function") {
                    onSuccess(res);
                    return;
                }
                alert("FAQ 정보를 찾을 수 없습니다.");
            },
            error: function(xhr) {
                alert("서버 통신 오류 (" + xhr.status + ")");
            }
        });
    }

    function resetAdminFaqDetailModal() {
        $('#adminFaqDetailId').text('-');
        $('#adminFaqDetailCategory').text('-');
        $('#adminFaqDetailViewCount').text('-');
        $('#adminFaqDetailCreatedAt').text('-');
        $('#adminFaqDetailQuestion').text('-');
        $('#adminFaqDetailAnswer').text('-');
    }

    function resetAdminFaqFormModal() {
        $('#adminFaqFormId').val('0');
        $('#adminFaqFormTitle').html('<i class="fas fa-pen-to-square"></i> FAQ 등록');
        $('#adminFaqFormCategory').val('');
        $('#adminFaqFormQuestion').val('');
        $('#adminFaqFormAnswer').val('');
    }

    function openAdminFaqCreateModal() {
        resetAdminFaqFormModal();
        $('#adminFaqFormModal').fadeIn(200);
        setTimeout(function() {
            $('#adminFaqFormCategory').trigger('focus');
        }, 0);
    }

    function openAdminFaqDetailModal(faqId) {
        resetAdminFaqDetailModal();
        $('#adminFaqDetailModal').fadeIn(200);

        loadAdminFaqDetail(faqId, function(data) {
            $('#adminFaqDetailId').text(data.faqId || '-');
            $('#adminFaqDetailCategory').text(data.category || '-');
            $('#adminFaqDetailViewCount').text(data.viewCount || 0);
            $('#adminFaqDetailCreatedAt').text(data.createdAt || '-');
            $('#adminFaqDetailQuestion').text(data.question || '-');
            $('#adminFaqDetailAnswer').text(data.answer || '-');
        });
    }

    function openAdminFaqEditModal(faqId) {
        if ($('#adminFaqDetailModal').is(':visible')) {
            closeAdminFaqDetailModal();
        }
        resetAdminFaqFormModal();
        $('#adminFaqFormTitle').html('<i class="fas fa-pen-to-square"></i> FAQ 수정');
        $('#adminFaqFormModal').fadeIn(200);

        loadAdminFaqDetail(faqId, function(data) {
            $('#adminFaqFormId').val(data.faqId || 0);
            $('#adminFaqFormCategory').val(data.category || '');
            $('#adminFaqFormQuestion').val(data.question || '');
            $('#adminFaqFormAnswer').val(data.answer || '');
            setTimeout(function() {
                $('#adminFaqFormQuestion').trigger('focus');
            }, 0);
        });
    }

    function closeAdminFaqDetailModal() {
        $('#adminFaqDetailModal').fadeOut(200);
    }

    function closeAdminFaqFormModal() {
        $('#adminFaqFormModal').fadeOut(200);
    }

    function submitAdminFaq() {
        const faqId = Number($('#adminFaqFormId').val()) || 0;
        const category = ($('#adminFaqFormCategory').val() || '').trim();
        const question = ($('#adminFaqFormQuestion').val() || '').trim();
        const answer = ($('#adminFaqFormAnswer').val() || '').trim();
        const payload = {
            category: category,
            question: question,
            answer: answer
        };

        if (!category) {
            alert("FAQ 카테고리를 입력해주세요.");
            return;
        }

        if (!question) {
            alert("FAQ 질문을 입력해주세요.");
            return;
        }

        if (!answer) {
            alert("FAQ 답변을 입력해주세요.");
            return;
        }

        $.ajax({
            url: faqId > 0 ? ctx + "/api/faqs/" + faqId : ctx + "/api/faqs",
            type: faqId > 0 ? "PUT" : "POST",
            contentType: "application/json; charset=UTF-8",
            data: JSON.stringify(payload),
            success: function() {
                closeAdminFaqFormModal();
                alert(faqId > 0 ? "FAQ를 수정했습니다." : "FAQ를 등록했습니다.");
                searchAdminFaq();
            },
            error: function(xhr) {
                alert("FAQ 저장에 실패했습니다. (" + xhr.status + ")");
            }
        });
    }

    function deleteAdminFaq(faqId) {
        const targetFaqId = Number(faqId) || 0;

        if (!(targetFaqId > 0)) {
            alert("삭제할 FAQ 정보를 다시 확인해주세요.");
            return;
        }

        if (!confirm("이 FAQ를 삭제하시겠습니까?")) {
            return;
        }

        $.ajax({
            url: ctx + "/api/faqs/" + targetFaqId,
            type: "DELETE",
            success: function() {
                closeAdminFaqDetailModal();
                alert("FAQ를 삭제했습니다.");
                searchAdminFaq();
            },
            error: function(xhr) {
                alert("FAQ 삭제에 실패했습니다. (" + xhr.status + ")");
            }
        });
    }
</script>
