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
                <i class="fas fa-comments"></i> 1:1 &#47928;&#51032; &#44288;&#47532;
            </h2>
            <p class="adm-i-subtitle">
                &#47928;&#51032; &#47785;&#47197; &#51312;&#54924;, &#44160;&#49353;, &#45813;&#48320; &#46321;&#47197; / &#49688;&#51221;, &#49325;&#51228;&#44620;&#51648; &#52376;&#47532;&#54633;&#45768;&#45796;.
            </p>
        </div>
    </div>

    <div class="adm-i-controls">
        <select id="adminInquiryStatus" class="adm-i-select" onchange="searchAdminInquiry()">
            <option value="">&#51204;&#52404; &#49345;&#53468;</option>
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
                placeholder="&#47928;&#51032; &#51228;&#47785; &#46608;&#45716; &#45236;&#50857;&#51004;&#47196; &#44160;&#49353;"
                value="${currentKeyword}"
                onkeypress="if(event.keyCode==13) searchAdminInquiry()">
        </div>

        <button type="button" class="adm-i-btn-search" onclick="searchAdminInquiry()">
            &#44160;&#49353;
        </button>
    </div>

    <c:if test="${not empty inquiryLoadError}">
        <div class="adm-i-alert adm-i-alert-error">
            &#47928;&#51032; &#47785;&#47197;&#51012; &#48520;&#47084;&#50724;&#45716; &#51473; &#50724;&#47448;&#44032; &#48156;&#49373;&#54616;&#50688;&#49845;&#45768;&#45796;:
            <c:out value="${inquiryLoadError}" />
        </div>
    </c:if>

    <div class="adm-i-meta">
        <span class="adm-i-meta-badge">&#49345;&#53468;&#44050; &#44592;&#51456;: PENDING / ANSWERED</span>
        <span class="adm-i-meta-text">&#51204;&#52404; ${fn:length(inquiryList)}&#44148;</span>
    </div>

    <div class="adm-i-table-wrap">
        <table class="adm-i-table">
            <thead>
                <tr>
                    <th>&#47928;&#51032;&#48264;&#54840;</th>
                    <th>&#54924;&#50896;&#48264;&#54840;</th>
                    <th>&#51228;&#47785; / &#45236;&#50857;</th>
                    <th>&#49345;&#53468;</th>
                    <th>&#46321;&#47197;&#51068;</th>
                    <th>&#45813;&#48320;&#51068;</th>
                    <th>&#44288;&#47532;</th>
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
                                            &#49345;&#49464;
                                        </button>
                                        <button
                                            type="button"
                                            class="adm-i-btn-answer"
                                            onclick="openAdminInquiryAnswerModal(${inquiry.inquiryId})">
                                            <c:choose>
                                                <c:when test="${inquiry.status == 'PENDING'}">&#45813;&#48320;</c:when>
                                                <c:otherwise>&#49688;&#51221;</c:otherwise>
                                            </c:choose>
                                        </button>
                                        <button
                                            type="button"
                                            class="adm-i-btn-delete"
                                            onclick="deleteAdminInquiry(${inquiry.inquiryId})">
                                            &#49325;&#51228;
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </c:forEach>
                    </c:when>
                    <c:otherwise>
                        <tr>
                            <td colspan="7" class="adm-i-empty">
                                &#51312;&#54924;&#46108; 1:1 &#47928;&#51032;&#44032; &#50630;&#49845;&#45768;&#45796;.
                            </td>
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
            <h3 id="adminInquiryModalTitle">&#47928;&#51032; &#49345;&#49464;</h3>
            <span class="adm-i-close" onclick="closeAdminInquiryDetailModal()">&times;</span>
        </div>
        <div class="adm-i-modal-body">
            <input type="hidden" id="adminInquiryDetailId" value="">
            <input type="hidden" id="adminInquiryDetailStatusValue" value="">

            <div class="adm-i-detail-grid">
                <div class="adm-i-detail-item">
                    <span class="adm-i-detail-label">&#47928;&#51032;&#48264;&#54840;</span>
                    <strong id="adminInquiryDetailInquiryId">-</strong>
                </div>
                <div class="adm-i-detail-item">
                    <span class="adm-i-detail-label">&#54924;&#50896;&#48264;&#54840;</span>
                    <strong id="adminInquiryDetailUserId">-</strong>
                </div>
                <div class="adm-i-detail-item">
                    <span class="adm-i-detail-label">&#49345;&#53468;</span>
                    <strong id="adminInquiryDetailStatus">-</strong>
                </div>
                <div class="adm-i-detail-item">
                    <span class="adm-i-detail-label">&#46321;&#47197;&#51068;</span>
                    <strong id="adminInquiryDetailCreatedAt">-</strong>
                </div>
                <div class="adm-i-detail-item">
                    <span class="adm-i-detail-label">&#45813;&#48320;&#51068;</span>
                    <strong id="adminInquiryDetailAnsweredAt">-</strong>
                </div>
            </div>

            <div class="adm-i-detail-block">
                <h4>&#47928;&#51032; &#51228;&#47785;</h4>
                <div class="adm-i-detail-content" id="adminInquiryDetailTitle">-</div>
            </div>

            <div class="adm-i-detail-block">
                <h4>&#47928;&#51032; &#45236;&#50857;</h4>
                <div class="adm-i-detail-content" id="adminInquiryDetailContent">-</div>
            </div>

            <div class="adm-i-detail-block" id="adminInquiryAnswerReadBlock">
                <h4>&#46321;&#47197;&#46108; &#45813;&#48320;</h4>
                <div class="adm-i-detail-content" id="adminInquiryDetailAnswerContent">-</div>
            </div>

            <div class="adm-i-answer-editor" id="adminInquiryAnswerEditor">
                <label id="adminInquiryAnswerLabel" for="adminInquiryAnswerContent">
                    &#45813;&#48320; &#51089;&#49457;
                </label>
                <textarea
                    id="adminInquiryAnswerContent"
                    rows="6"
                    placeholder="&#44288;&#47532;&#51088; &#45813;&#48320;&#51012; &#51077;&#47141;&#54616;&#49464;&#50836;."></textarea>
            </div>
        </div>
        <div class="adm-i-modal-footer">
            <div class="adm-i-modal-footer-actions">
                <button
                    type="button"
                    class="adm-i-btn-delete"
                    id="adminInquiryDeleteButton"
                    onclick="deleteAdminInquiry()">
                    &#47928;&#51032; &#49325;&#51228;
                </button>
                <button
                    type="button"
                    class="adm-i-btn-answer adm-i-btn-answer-ghost"
                    id="adminInquiryOpenAnswerButton"
                    onclick="openAdminInquiryAnswerModal(Number($('#adminInquiryDetailId').val()) || 0)">
                    &#45813;&#48320; &#46321;&#47197;
                </button>
                <button
                    type="button"
                    class="adm-i-btn-answer adm-i-btn-answer-ghost"
                    id="adminInquiryAnswerSubmitButton"
                    onclick="submitAdminInquiryAnswer()"
                    style="display:none;">
                    &#45813;&#48320; &#46321;&#47197;
                </button>
            </div>
        </div>
    </div>
</div>

<script>
    function searchAdminInquiry() {
        const keyword = ($('#adminInquiryKeyword').val() || '').trim();
        const status = ($('#adminInquiryStatus').val() || '').trim();
        let url = ctx + "/admin/qna";
        const params = [];

        if (keyword) {
            params.push("keyword=" + encodeURIComponent(keyword));
        }
        if (status) {
            params.push("status=" + encodeURIComponent(status));
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
                alert("\uBB38\uC758 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
            },
            error: function(xhr) {
                closeAdminInquiryDetailModal();
                alert("\uC11C\uBC84 \uD1B5\uC2E0 \uC624\uB958 (" + xhr.status + ")");
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
        $('#adminInquiryModalTitle').text('\uBB38\uC758 \uC0C1\uC138');
        $('#adminInquiryAnswerLabel').text('\uB2F5\uBCC0 \uC791\uC131');
        $('#adminInquiryAnswerSubmitButton').text('\uB2F5\uBCC0 \uB4F1\uB85D');
        $('#adminInquiryAnswerSubmitButton').hide();
        $('#adminInquiryOpenAnswerButton').text('\uB2F5\uBCC0 \uB4F1\uB85D').show();
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
            $('#adminInquiryDetailAnswerContent').text(
                hasAnswer ? data.answerContent : '\uB4F1\uB85D\uB41C \uB2F5\uBCC0\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.'
            );
            $('#adminInquiryAnswerContent').val(data.answerContent || '');
            $('#adminInquiryOpenAnswerButton').text(
                isPending ? '\uB2F5\uBCC0 \uB4F1\uB85D' : '\uB2F5\uBCC0 \uC218\uC815'
            );

            if (hasAnswer) {
                $('#adminInquiryAnswerReadBlock').show();
            }

            if (!shouldShowEditor) {
                $('#adminInquiryModalTitle').text('\uBB38\uC758 \uC0C1\uC138');
                return;
            }

            $('#adminInquiryModalTitle').text(
                isPending ? '\uBB38\uC758 \uB2F5\uBCC0' : '\uB2F5\uBCC0 \uC218\uC815'
            );
            $('#adminInquiryAnswerLabel').text(
                isPending ? '\uB2F5\uBCC0 \uC791\uC131' : '\uB2F5\uBCC0 \uC218\uC815'
            );
            $('#adminInquiryAnswerSubmitButton').text(
                isPending ? '\uB2F5\uBCC0 \uB4F1\uB85D' : '\uB2F5\uBCC0 \uC800\uC7A5'
            );
            $('#adminInquiryAnswerEditor').show();
            $('#adminInquiryOpenAnswerButton').hide();
            $('#adminInquiryAnswerSubmitButton').show();
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
            alert("\uC0AD\uC81C\uD560 \uBB38\uC758 \uC815\uBCF4\uB97C \uB2E4\uC2DC \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
            return;
        }

        if (!confirm("\uC774 \uBB38\uC758\uB97C \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?")) {
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
                    alert("\uBB38\uC758\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
                    searchAdminInquiry();
                    return;
                }
                alert("\uBB38\uC758 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
            },
            error: function(xhr) {
                alert("\uC11C\uBC84 \uD1B5\uC2E0 \uC624\uB958 (" + xhr.status + ")");
            }
        });
    }

    function submitAdminInquiryAnswer() {
        const inquiryId = Number($('#adminInquiryDetailId').val()) || 0;
        const answerContent = ($('#adminInquiryAnswerContent').val() || '').trim();

        if (!inquiryId) {
            alert("\uBB38\uC758 \uC815\uBCF4\uB97C \uB2E4\uC2DC \uBD88\uB7EC\uC640 \uC8FC\uC138\uC694.");
            return;
        }
        if (!answerContent) {
            alert("\uB2F5\uBCC0 \uB0B4\uC6A9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
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
                    alert("\uB2F5\uBCC0\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
                    searchAdminInquiry();
                    return;
                }
                if (normalized === "fail:empty_answer") {
                    alert("\uB2F5\uBCC0 \uB0B4\uC6A9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
                    return;
                }
                alert("\uB2F5\uBCC0 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
            },
            error: function(xhr) {
                alert("\uC11C\uBC84 \uD1B5\uC2E0 \uC624\uB958 (" + xhr.status + ")");
            }
        });
    }
</script>
