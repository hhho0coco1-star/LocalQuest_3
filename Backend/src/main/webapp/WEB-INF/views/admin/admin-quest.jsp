<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt"%>

<c:set var="path" value="${pageContext.request.contextPath}" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="${path}/css/admin-quest.css?v=20260323-2315">
<style>
    #questModal.adm-q-modal {
        padding: 24px;
        box-sizing: border-box;
    }

    #questModal .adm-q-modal-content {
        width: min(760px, 100%);
        max-height: 88vh;
        margin: 3vh auto;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    #questModal #questForm {
        display: flex;
        flex-direction: column;
        min-height: 0;
        flex: 1 1 auto;
    }

    #questModal .modal-body {
        flex: 1 1 auto;
        overflow-y: auto;
    }

    #questModal .modal-footer {
        flex-shrink: 0;
        background: #252537;
    }

    #questModal .adm-q-time-limit-group {
        padding: 14px;
        border: 1px solid #323248;
        border-radius: 10px;
        background: rgba(30, 30, 45, 0.85);
    }

    #questModal .adm-q-inline-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 8px;
    }

    #questModal .adm-q-inline-label > label:first-child {
        margin-bottom: 0;
    }

    #questModal .adm-q-check-label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 0;
        color: #ffffff;
        font-size: 13px;
        cursor: pointer;
        white-space: nowrap;
    }

    #questModal .adm-q-check-label input[type="checkbox"] {
        width: auto;
    }

    #questModal .adm-q-time-limit-group input[type="number"] {
        margin-bottom: 8px;
    }

    #questModal .adm-q-help-text {
        display: block;
        color: #9292af;
        font-size: 12px;
        line-height: 1.4;
    }

    #questModal .adm-q-place-map {
        height: 300px;
    }
</style>

<div class="adm-q-container">
    <div class="adm-q-header">
        <h2 class="adm-q-title">
            <i class="fas fa-scroll"></i> 퀘스트 관리
        </h2>

        <div class="adm-q-controls">
            <select id="filterStatus" onchange="searchQuest()">
                <option value="">모든 상태</option>
                <option value="ACTIVE" ${currentStatus == 'ACTIVE' ? 'selected' : ''}>활성화</option>
                <option value="INACTIVE" ${currentStatus == 'INACTIVE' ? 'selected' : ''}>비활성화</option>
            </select>

            <div class="adm-q-search-box">
                <input type="text" id="searchQuestName" placeholder="퀘스트 이름 검색.." value="${currentKeyword}"
                    onkeypress="if(event.keyCode==13) searchQuest()">
                <button onclick="searchQuest()">
                    <i class="fas fa-search"></i>
                </button>
            </div>

            <button class="adm-q-btn-add" onclick="openQuestModal()">
                <i class="fas fa-plus"></i> 새 퀘스트 등록
            </button>
        </div>
    </div>

    <div class="adm-q-grid">
        <c:choose>
            <c:when test="${not empty questList}">
                <c:forEach var="quest" items="${questList}">
                    <div class="adm-q-card ${quest.status}">
                        <div class="adm-q-card-header">
                            <span class="adm-q-category">${quest.category}</span>
                            <span class="adm-q-status-badge">${quest.status}</span>
                        </div>

                        <div class="adm-q-card-body"
                            data-id="${quest.questId}"
                            data-exp="${quest.rewardExp}"
                            data-point="${quest.rewardPoint}"
                            data-time-limit="${quest.timeLimit}"
                            data-created-at="<fmt:formatDate value='${quest.createdAt}' pattern='yyyy-MM-dd HH:mm:ss'/>"
                            data-status="${quest.status}"
                            onclick="openQuestEditFromCard(this)"
                            style="cursor:pointer;"
                            title="클릭하여 수정">
                            <h3 class="adm-q-card-title">${quest.title}</h3>
                            <p class="adm-q-card-desc">${quest.description}</p>
                        </div>

                        <div class="adm-q-reward">
                            <div class="reward-item">
                                <i class="fas fa-star exp-icon"></i>
                                <span>${quest.rewardExp} EXP</span>
                            </div>
                            <div class="reward-item">
                                <i class="fas fa-coins point-icon"></i>
                                <span>${quest.rewardPoint} PT</span>
                            </div>
                            <div class="reward-item">
                                <i class="fas fa-hourglass-half time-icon quest-timer-icon"></i>
                                <span class="quest-timer-text">
                                    <c:choose>
                                        <c:when test="${not empty quest.timeLimit}">${quest.timeLimit}분 제한</c:when>
                                        <c:otherwise>제한 없음</c:otherwise>
                                    </c:choose>
                                </span>
                            </div>
                        </div>

                        <div class="adm-q-card-footer">
                            <c:choose>
                                <c:when test="${quest.status == 'ACTIVE'}">
                                    <button class="btn-q-stop" onclick="updateQuestStatus(${quest.questId}, 'INACTIVE')">비활성화</button>
                                </c:when>
                                <c:otherwise>
                                    <button class="btn-q-start" onclick="updateQuestStatus(${quest.questId}, 'ACTIVE')">활성화</button>
                                </c:otherwise>
                            </c:choose>
                            <button class="btn-q-delete" onclick="updateQuestStatus(${quest.questId}, 'DELETED')">삭제</button>
                        </div>
                    </div>
                </c:forEach>
            </c:when>
            <c:otherwise>
                <div class="adm-q-empty">등록된 퀘스트가 없습니다.</div>
            </c:otherwise>
        </c:choose>
    </div>
</div>

<div id="questModal" class="adm-q-modal">
    <div class="adm-q-modal-content">
        <div class="adm-q-modal-header">
            <h3 id="modalTitleText">
                <i class="fas fa-plus-circle"></i> 새 퀘스트 등록
            </h3>
            <span class="close-modal" onclick="closeQuestModal()">&times;</span>
        </div>

        <form id="questForm">
            <input type="hidden" name="questId" id="modalQuestId" value="0">
            <input type="hidden" name="status" id="modalQuestStatus" value="ACTIVE">
            <input type="hidden" name="locationsJson" id="questLocationsJson" value="[]">

            <div class="modal-body">
                <div class="input-group">
                    <label>퀘스트 제목</label>
                    <input type="text" id="m_title" name="title" placeholder="퀘스트 제목을 입력하세요." required>
                </div>
                <div class="input-group">
                    <label>카테고리</label>
                    <select id="m_category" name="category" required>
                        <option value="">카테고리 선택</option>
                        <c:forEach var="categoryName" items="${questCategoryList}">
                            <option value="${categoryName}">${categoryName}</option>
                        </c:forEach>
                    </select>
                </div>
                <div class="input-group">
                    <label>보상 경험치(EXP)</label>
                    <input type="number" id="m_exp" name="rewardExp" value="0" min="0">
                </div>
                <div class="input-group">
                    <label>보상 포인트(PT)</label>
                    <input type="number" id="m_point" name="rewardPoint" value="0" min="0">
                </div>
                <div class="input-group">
                    <label>설명</label>
                    <textarea id="m_desc" name="description" rows="4" placeholder="퀘스트 상세 내용을 입력하세요." required></textarea>
                </div>
                <div class="input-group adm-q-time-limit-group">
                    <div class="adm-q-inline-label">
                        <label for="m_time_limit">제한시간(분)</label>
                        <label class="adm-q-check-label" for="m_time_limit_enabled">
                            <input type="checkbox" id="m_time_limit_enabled" onchange="toggleQuestTimeLimitInput()">
                            제한 사용
                        </label>
                    </div>
                    <input type="number" id="m_time_limit" name="timeLimit" value="" min="1" placeholder="제한 시간을 분 단위로 입력하세요." disabled>
                    <small class="adm-q-help-text">설정한 분이 지나면 퀘스트가 자동으로 비활성화됩니다. 만료 후 시간을 수정하면 다시 활성화되며 카운트다운이 재시작됩니다.</small>
                </div>
                <div class="input-group adm-q-place-group">
                    <div class="adm-q-inline-label">
                        <label for="questLocationKeyword">퀘스트 장소 검색</label>
                        <span class="adm-q-help-chip">천안 / 카카오지도</span>
                    </div>
                    <div class="adm-q-place-search">
                        <input type="text" id="questLocationKeyword" placeholder="장소명 또는 주소를 검색하세요."
                            onkeypress="if(event.keyCode==13){ event.preventDefault(); searchQuestLocations(); }">
                        <button type="button" onclick="searchQuestLocations()">검색</button>
                    </div>
                    <div id="questLocationStatus" class="adm-q-place-status"></div>
                    <div id="questLocationMap" class="adm-q-place-map"></div>
                    <div class="adm-q-place-panels">
                        <div class="adm-q-place-panel">
                            <div class="adm-q-place-panel-title">검색 결과</div>
                            <div id="questLocationSearchResults" class="adm-q-place-list">
                                <div class="adm-q-place-empty">검색 결과가 없습니다.</div>
                            </div>
                        </div>
                        <div class="adm-q-place-panel">
                            <div class="adm-q-place-panel-title">선택된 장소 / 방문 순서</div>
                            <div id="questSelectedLocationList" class="adm-q-place-list">
                                <div class="adm-q-place-empty">선택된 장소가 없습니다.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-cancel" onclick="closeQuestModal()">취소</button>
                <button type="button" class="btn-submit" id="modalSubmitBtn" onclick="submitQuest()">등록하기</button>
            </div>
        </form>
    </div>
</div>
