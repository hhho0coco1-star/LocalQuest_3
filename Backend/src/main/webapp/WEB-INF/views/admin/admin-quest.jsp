<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt"%>

<c:set var="path" value="${pageContext.request.contextPath}" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="${path}/css/admin-quest.css?v=20260324-2000">
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
        background: var(--admin-surface-soft, rgba(255, 248, 251, 0.98));
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
        color: var(--admin-text, #172033);
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

    #questModal .adm-q-place-search button {
        background: var(--admin-primary, #d93d5e);
        color: #ffffff;
        box-shadow: 0 12px 22px rgba(217, 61, 94, 0.16);
    }

    #questModal .adm-q-place-search button:hover {
        background: var(--admin-primary-hover, #c73455);
    }

    #questModal .adm-q-help-text {
        display: block;
        color: #9292af;
        font-size: 12px;
        line-height: 1.4;
    }

    #questModal .adm-q-place-guide {
        min-height: 72px;
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
                <option value="DELETED" ${currentStatus == 'DELETED' ? 'selected' : ''}>삭제됨</option>
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

    <c:if test="${not empty questLoadError}">
        <div class="adm-q-empty">${questLoadError}</div>
    </c:if>

    <div class="adm-q-sections">
        <c:if test="${empty currentStatus or currentStatus == 'ACTIVE'}">
            <section class="adm-q-section adm-q-section-active">
                <div class="adm-q-section-header">
                    <div>
                        <h3 class="adm-q-section-title">활성 퀘스트</h3>
                        <p class="adm-q-section-subtitle">현재 사용자에게 노출되고 진행 가능한 퀘스트입니다.</p>
                    </div>
                    <span class="adm-q-section-count">${activeQuestCount}</span>
                </div>

                <c:choose>
                    <c:when test="${not empty activeQuestList}">
                        <div class="adm-q-grid">
                            <c:forEach var="quest" items="${activeQuestList}">
                                <div class="adm-q-card ${quest.status}">
                                    <div class="adm-q-card-header">
                                        <span class="adm-q-status-badge ${quest.status}">
                                            <c:choose>
                                                <c:when test="${quest.status == 'ACTIVE'}">활성화</c:when>
                                                <c:when test="${quest.status == 'INACTIVE'}">비활성화</c:when>
                                                <c:when test="${quest.status == 'DELETED'}">삭제됨</c:when>
                                                <c:otherwise>${quest.status}</c:otherwise>
                                            </c:choose>
                                        </span>
                                    </div>

                                    <div class="adm-q-card-body"
                                        data-id="${quest.questId}"
                                        data-exp="${quest.rewardExp}"
                                        data-point="${quest.rewardPoint}"
                                        data-time-limit="${quest.timeLimit}"
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
                                        <button class="btn-q-stop" onclick="updateQuestStatus(${quest.questId}, 'INACTIVE')">비활성화</button>
                                        <button class="btn-q-delete" onclick="updateQuestStatus(${quest.questId}, 'DELETED')">삭제</button>
                                    </div>
                                </div>
                            </c:forEach>
                        </div>
                    </c:when>
                    <c:otherwise>
                        <div class="adm-q-empty adm-q-section-empty">활성 퀘스트가 없습니다.</div>
                    </c:otherwise>
                </c:choose>
            </section>
        </c:if>

        <c:if test="${empty currentStatus or currentStatus == 'INACTIVE'}">
            <section class="adm-q-section adm-q-section-inactive">
                <div class="adm-q-section-header">
                    <div>
                        <h3 class="adm-q-section-title">비활성 퀘스트</h3>
                        <p class="adm-q-section-subtitle">운영을 중지했지만 필요할 때 다시 활성화할 수 있는 퀘스트입니다.</p>
                    </div>
                    <span class="adm-q-section-count">${inactiveQuestCount}</span>
                </div>

                <c:choose>
                    <c:when test="${not empty inactiveQuestList}">
                        <div class="adm-q-grid">
                            <c:forEach var="quest" items="${inactiveQuestList}">
                                <div class="adm-q-card ${quest.status}">
                                    <div class="adm-q-card-header">
                                        <span class="adm-q-status-badge ${quest.status}">
                                            <c:choose>
                                                <c:when test="${quest.status == 'ACTIVE'}">활성화</c:when>
                                                <c:when test="${quest.status == 'INACTIVE'}">비활성화</c:when>
                                                <c:when test="${quest.status == 'DELETED'}">삭제됨</c:when>
                                                <c:otherwise>${quest.status}</c:otherwise>
                                            </c:choose>
                                        </span>
                                    </div>

                                    <div class="adm-q-card-body"
                                        data-id="${quest.questId}"
                                        data-exp="${quest.rewardExp}"
                                        data-point="${quest.rewardPoint}"
                                        data-time-limit="${quest.timeLimit}"
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
                                        <button class="btn-q-start" onclick="updateQuestStatus(${quest.questId}, 'ACTIVE')">활성화</button>
                                        <button class="btn-q-delete" onclick="updateQuestStatus(${quest.questId}, 'DELETED')">삭제</button>
                                    </div>
                                </div>
                            </c:forEach>
                        </div>
                    </c:when>
                    <c:otherwise>
                        <div class="adm-q-empty adm-q-section-empty">비활성 퀘스트가 없습니다.</div>
                    </c:otherwise>
                </c:choose>
            </section>
        </c:if>

        <c:if test="${empty currentStatus or currentStatus == 'DELETED'}">
            <section class="adm-q-section adm-q-section-deleted">
                <div class="adm-q-section-header">
                    <div>
                        <h3 class="adm-q-section-title">삭제된 퀘스트</h3>
                        <p class="adm-q-section-subtitle">운영 목록에서는 제외되지만 관리 이력 확인이 필요한 퀘스트입니다.</p>
                    </div>
                    <span class="adm-q-section-count">${deletedQuestCount}</span>
                </div>

                <c:choose>
                    <c:when test="${not empty deletedQuestList}">
                        <div class="adm-q-grid">
                            <c:forEach var="quest" items="${deletedQuestList}">
                                <div class="adm-q-card ${quest.status}">
                                    <div class="adm-q-card-header">
                                        <span class="adm-q-status-badge ${quest.status}">
                                            <c:choose>
                                                <c:when test="${quest.status == 'ACTIVE'}">활성화</c:when>
                                                <c:when test="${quest.status == 'INACTIVE'}">비활성화</c:when>
                                                <c:when test="${quest.status == 'DELETED'}">삭제됨</c:when>
                                                <c:otherwise>${quest.status}</c:otherwise>
                                            </c:choose>
                                        </span>
                                    </div>

                                    <div class="adm-q-card-body"
                                        data-id="${quest.questId}"
                                        data-exp="${quest.rewardExp}"
                                        data-point="${quest.rewardPoint}"
                                        data-time-limit="${quest.timeLimit}"
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
                                        <button class="btn-q-start" onclick="updateQuestStatus(${quest.questId}, 'ACTIVE')">복구</button>
                                    </div>
                                </div>
                            </c:forEach>
                        </div>
                    </c:when>
                    <c:otherwise>
                        <div class="adm-q-empty adm-q-section-empty">삭제된 퀘스트가 없습니다.</div>
                    </c:otherwise>
                </c:choose>
            </section>
        </c:if>
    </div>

    <div class="adm-q-grid" style="display:none;">
        <c:choose>
            <c:when test="${not empty questList}">
                <c:forEach var="quest" items="${questList}">
                    <div class="adm-q-card ${quest.status}">
                        <div class="adm-q-card-header">
                            <span class="adm-q-status-badge ${quest.status}">
                                <c:choose>
                                    <c:when test="${quest.status == 'ACTIVE'}">활성화</c:when>
                                    <c:when test="${quest.status == 'INACTIVE'}">비활성화</c:when>
                                    <c:when test="${quest.status == 'DELETED'}">삭제됨</c:when>
                                    <c:otherwise>${quest.status}</c:otherwise>
                                </c:choose>
                            </span>
                        </div>

                        <div class="adm-q-card-body"
                            data-id="${quest.questId}"
                            data-exp="${quest.rewardExp}"
                            data-point="${quest.rewardPoint}"
                            data-time-limit="${quest.timeLimit}"
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
                    <small class="adm-q-help-text">관리자 화면에서는 제한시간이 흐르지 않습니다. 제한시간은 사용자가 퀘스트를 수락한 시점부터 사용자별로 적용됩니다.</small>
                </div>
                <div class="input-group adm-q-place-group">
                    <div class="adm-q-inline-label">
                        <label for="questLocationKeyword">퀘스트 장소 검색</label>
                        <span class="adm-q-help-chip">LQ_LOCATION</span>
                    </div>
                    <div class="adm-q-place-search">
                        <input type="text" id="questLocationKeyword" placeholder="장소명 또는 주소로 목록을 검색하세요."
                            onkeypress="if(event.keyCode==13){ event.preventDefault(); searchQuestLocations(); }">
                        <button type="button" onclick="searchQuestLocations()">검색</button>
                    </div>
                    <div id="questLocationStatus" class="adm-q-place-status"></div>
                    <div class="adm-q-place-guide">
                        등록된 장소 목록에서 퀘스트 경로에 사용할 장소를 선택하세요. 검색어 없이 조회하면 최근 등록 장소가 먼저 표시됩니다.
                    </div>
                    <div class="adm-q-place-panels">
                        <div class="adm-q-place-panel">
                            <div class="adm-q-place-panel-title">장소 목록</div>
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
                <div class="input-group adm-q-review-group">
                    <div class="adm-q-inline-label">
                        <label for="questReviewList">퀘스트 리뷰 관리</label>
                        <span class="adm-q-help-chip">ADMIN</span>
                    </div>
                    <div id="questReviewStatus" class="adm-q-review-status"></div>
                    <div id="questReviewList" class="adm-q-review-list">
                        <div class="adm-q-review-empty">새 퀘스트는 등록 후 리뷰를 관리할 수 있습니다.</div>
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
