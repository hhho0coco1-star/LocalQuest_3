<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>

<c:set var="path" value="${pageContext.request.contextPath}" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="${path}/css/admin-reward-item.css">

<div class="adm-r-shell" data-current-tab="${currentTab}">
    <div class="adm-r-container">
        <div class="adm-r-header">
            <div class="adm-r-title-wrap">
                <h2 class="adm-r-title"><i class="fas fa-ticket-alt"></i> 쿠폰 관리</h2>
                <p class="adm-r-subtitle">비즈니스 매장을 선택하지 않으면 일반 쿠폰으로 즉시 생성되고, 매장을 선택하면 비즈니스 제안 요청으로 전환됩니다.</p>
            </div>
            <button type="button" class="adm-r-create-btn" onclick="openItemModal()">
                <i class="fas fa-plus"></i> 새 쿠폰 등록
            </button>
        </div>

        <div class="adm-r-tab-nav">
            <button type="button" class="adm-r-tab ${currentTab != 'requests' ? 'is-active' : ''}" onclick="showRewardAdminTab('items')">
                즉시 생성 쿠폰
                <span class="adm-r-tab-count">${itemCount}</span>
            </button>
            <button type="button" class="adm-r-tab ${currentTab == 'requests' ? 'is-active' : ''}" onclick="showRewardAdminTab('requests')">
                비즈니스 요청
                <span class="adm-r-tab-count">${requestCount}</span>
            </button>
        </div>

        <section class="adm-r-panel ${currentTab != 'requests' ? 'is-active' : ''}" data-panel="items">
            <div class="adm-r-controls">
                <select id="filterItemStatus" class="adm-r-select" onchange="searchItem()">
                    <option value="">모든 상태</option>
                    <option value="ON_SALE" ${currentStatus == 'ON_SALE' ? 'selected' : ''}>판매중</option>
                    <option value="SOLD_OUT" ${currentStatus == 'SOLD_OUT' ? 'selected' : ''}>품절</option>
                    <option value="HIDDEN" ${currentStatus == 'HIDDEN' ? 'selected' : ''}>숨김</option>
                </select>

                <div class="adm-r-search-box">
                    <input
                        type="text"
                        id="searchItemName"
                        placeholder="쿠폰 이름을 검색하세요"
                        value="${currentKeyword}"
                        onkeypress="if(event.keyCode==13) searchItem()">
                    <button type="button" onclick="searchItem()"><i class="fas fa-search"></i></button>
                </div>
            </div>

            <c:choose>
                <c:when test="${not empty itemList}">
                    <div class="adm-r-card-grid">
                        <c:forEach var="item" items="${itemList}">
                            <article class="adm-r-card ${item.status}">
                                <div class="adm-r-card-header">
                                    <span class="adm-r-card-chip">일반 쿠폰</span>
                                    <span class="adm-r-status ${item.status}">
                                        <c:choose>
                                            <c:when test="${item.status == 'ON_SALE'}">판매중</c:when>
                                            <c:when test="${item.status == 'SOLD_OUT'}">품절</c:when>
                                            <c:when test="${item.status == 'HIDDEN'}">숨김</c:when>
                                            <c:when test="${item.status == 'DELETED'}">삭제됨</c:when>
                                            <c:otherwise><c:out value="${item.status}" /></c:otherwise>
                                        </c:choose>
                                    </span>
                                </div>
                                <div class="adm-r-card-body">
                                    <h3 class="adm-r-card-title"><c:out value="${item.name}" /></h3>
                                    <p class="adm-r-card-desc">
                                        <c:choose>
                                            <c:when test="${empty item.description}">등록된 설명이 없습니다.</c:when>
                                            <c:otherwise><c:out value="${item.description}" /></c:otherwise>
                                        </c:choose>
                                    </p>
                                </div>
                                <div class="adm-r-card-meta">
                                    <div class="adm-r-card-metric">
                                        <span>교환 포인트</span>
                                        <strong>${item.pricePoint} PT</strong>
                                    </div>
                                    <div class="adm-r-card-metric">
                                        <span>재고</span>
                                        <strong>${item.stock}</strong>
                                    </div>
                                </div>
                                <div class="adm-r-card-footer">
                                    <button
                                        type="button"
                                        class="adm-r-btn adm-r-btn-secondary"
                                        data-item-id="${item.rewardItemId}"
                                        data-item-name="${fn:escapeXml(item.name)}"
                                        data-item-price="${item.pricePoint}"
                                        data-item-stock="${item.stock}"
                                        data-item-status="${item.status}"
                                        data-item-desc="${fn:escapeXml(item.description)}"
                                        onclick="openRewardItemEdit(this)">
                                        수정
                                    </button>
                                    <c:choose>
                                        <c:when test="${item.status == 'ON_SALE'}">
                                            <button type="button" class="adm-r-btn adm-r-btn-ghost" onclick="updateItemStatus(${item.rewardItemId}, 'HIDDEN')">숨기기</button>
                                        </c:when>
                                        <c:otherwise>
                                            <button type="button" class="adm-r-btn adm-r-btn-primary" onclick="updateItemStatus(${item.rewardItemId}, 'ON_SALE')">판매개시</button>
                                        </c:otherwise>
                                    </c:choose>
                                    <button type="button" class="adm-r-btn adm-r-btn-danger" onclick="updateItemStatus(${item.rewardItemId}, 'DELETED')">삭제</button>
                                </div>
                            </article>
                        </c:forEach>
                    </div>
                </c:when>
                <c:otherwise>
                    <div class="adm-r-empty">등록된 일반 쿠폰이 없습니다.</div>
                </c:otherwise>
            </c:choose>
        </section>

        <section class="adm-r-panel ${currentTab == 'requests' ? 'is-active' : ''}" data-panel="requests">
            <div class="adm-r-controls">
                <select id="filterRequestStatus" class="adm-r-select" onchange="searchRewardRequests()">
                    <option value="">모든 요청상태</option>
                    <option value="REQUESTED" ${currentRequestStatus == 'REQUESTED' ? 'selected' : ''}>요청중</option>
                    <option value="HOLD" ${currentRequestStatus == 'HOLD' ? 'selected' : ''}>보류</option>
                    <option value="ACCEPTED" ${currentRequestStatus == 'ACCEPTED' ? 'selected' : ''}>수락</option>
                    <option value="CANCELLED" ${currentRequestStatus == 'CANCELLED' ? 'selected' : ''}>취소</option>
                </select>

                <div class="adm-r-search-box">
                    <input
                        type="text"
                        id="searchRequestKeyword"
                        placeholder="쿠폰명, 비즈니스명, 매장명을 검색하세요"
                        value="${currentRequestKeyword}"
                        onkeypress="if(event.keyCode==13) searchRewardRequests()">
                    <button type="button" onclick="searchRewardRequests()"><i class="fas fa-search"></i></button>
                </div>
            </div>

            <div class="adm-r-table-wrap">
                <table class="adm-r-table">
                    <thead>
                        <tr>
                            <th>요청번호</th>
                            <th>쿠폰 정보</th>
                            <th>비즈니스 매장</th>
                            <th>목표 상태</th>
                            <th>요청 상태</th>
                            <th>버전</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        <c:choose>
                            <c:when test="${not empty requestList}">
                                <c:forEach var="request" items="${requestList}">
                                    <tr class="adm-r-row">
                                        <td>#${request.requestId}</td>
                                        <td class="adm-r-info-cell">
                                            <strong><c:out value="${request.couponName}" /></strong>
                                            <span>${request.pricePoint} PT · 재고 ${request.stock}</span>
                                            <c:if test="${not empty request.lastHoldReason}">
                                                <small>보류사유: <c:out value="${request.lastHoldReason}" /></small>
                                            </c:if>
                                        </td>
                                        <td class="adm-r-info-cell">
                                            <strong><c:out value="${request.businessName}" /></strong>
                                            <span><c:out value="${request.locationName}" /></span>
                                            <small><c:out value="${request.locationAddress}" /></small>
                                        </td>
                                        <td>
                                            <span class="adm-r-status ${request.targetStatus}">
                                                <c:choose>
                                                    <c:when test="${request.targetStatus == 'ON_SALE'}">판매중</c:when>
                                                    <c:when test="${request.targetStatus == 'SOLD_OUT'}">품절</c:when>
                                                    <c:when test="${request.targetStatus == 'HIDDEN'}">숨김</c:when>
                                                    <c:otherwise><c:out value="${request.targetStatus}" /></c:otherwise>
                                                </c:choose>
                                            </span>
                                        </td>
                                        <td>
                                            <span class="adm-r-status adm-r-request-status ${request.requestStatus}">
                                                <c:choose>
                                                    <c:when test="${request.requestStatus == 'REQUESTED'}">요청중</c:when>
                                                    <c:when test="${request.requestStatus == 'HOLD'}">보류</c:when>
                                                    <c:when test="${request.requestStatus == 'ACCEPTED'}">수락</c:when>
                                                    <c:when test="${request.requestStatus == 'CANCELLED'}">취소</c:when>
                                                    <c:otherwise><c:out value="${request.requestStatus}" /></c:otherwise>
                                                </c:choose>
                                            </span>
                                        </td>
                                        <td>v${request.requestVersion}</td>
                                        <td>
                                            <div class="adm-r-action-group">
                                                <button type="button" class="adm-r-btn adm-r-btn-secondary" onclick="openRewardRequestDetail(${request.requestId})">상세</button>
                                                <c:if test="${request.requestStatus != 'ACCEPTED' && request.requestStatus != 'CANCELLED'}">
                                                    <button type="button" class="adm-r-btn adm-r-btn-primary" onclick="openRewardRequestEdit(${request.requestId})">
                                                        <c:choose>
                                                            <c:when test="${request.requestStatus == 'HOLD'}">보완 후 재요청</c:when>
                                                            <c:otherwise>수정</c:otherwise>
                                                        </c:choose>
                                                    </button>
                                                    <button type="button" class="adm-r-btn adm-r-btn-danger" onclick="cancelRewardRequest(${request.requestId})">취소</button>
                                                </c:if>
                                            </div>
                                        </td>
                                    </tr>
                                </c:forEach>
                            </c:when>
                            <c:otherwise>
                                <tr>
                                    <td colspan="7" class="adm-r-empty-cell">등록된 비즈니스 쿠폰 요청이 없습니다.</td>
                                </tr>
                            </c:otherwise>
                        </c:choose>
                    </tbody>
                </table>
            </div>
        </section>
    </div>
</div>

<div id="itemModal" class="adm-r-modal">
    <div class="adm-r-modal-content">
        <div class="adm-r-modal-header">
            <h3 id="itemModalTitleText"><i class="fas fa-plus-circle"></i> 새 쿠폰 등록</h3>
            <button type="button" class="adm-r-modal-close" onclick="closeItemModal()">&times;</button>
        </div>

        <form id="itemForm" class="adm-r-modal-form">
            <input type="hidden" name="rewardItemId" id="modalItemId" value="0">
            <input type="hidden" name="requestId" id="modalRequestId" value="">
            <input type="hidden" name="requestAction" id="modalRequestAction" value="create">
            <input type="hidden" name="businessLocationId" id="modalBusinessLocationId" value="">
            <input type="hidden" id="modalFormMode" value="direct-create">

            <div class="adm-r-modal-body">
                <div class="adm-r-form-grid">
                    <div class="adm-r-input-group adm-r-input-group-wide">
                        <label for="i_name">쿠폰 명칭</label>
                        <input type="text" id="i_name" name="name" placeholder="쿠폰 이름을 입력하세요" required>
                    </div>
                    <div class="adm-r-input-group">
                        <label for="i_price">판매 가격 (PT)</label>
                        <input type="number" id="i_price" name="pricePoint" value="0" min="0">
                    </div>
                    <div class="adm-r-input-group">
                        <label for="i_stock">초기 재고량</label>
                        <input type="number" id="i_stock" name="stock" value="0" min="0">
                    </div>
                    <div class="adm-r-input-group">
                        <label for="i_status">상태</label>
                        <select id="i_status" name="status">
                            <option value="ON_SALE">판매중 (ON_SALE)</option>
                            <option value="SOLD_OUT">품절 (SOLD_OUT)</option>
                            <option value="HIDDEN">숨김 (HIDDEN)</option>
                        </select>
                    </div>
                    <div class="adm-r-input-group adm-r-input-group-wide">
                        <label for="i_desc">쿠폰 설명</label>
                        <textarea id="i_desc" name="description" rows="4" placeholder="쿠폰 상세 설명을 입력하세요"></textarea>
                    </div>
                </div>

                <div class="adm-r-location-panel">
                    <div class="adm-r-location-header">
                        <div>
                            <h4 class="adm-r-section-title">비즈니스 매장 선택</h4>
                            <p class="adm-r-section-subtitle">선택하지 않으면 일반 쿠폰으로 즉시 생성됩니다.</p>
                        </div>
                        <button type="button" id="rewardLocationClearBtn" class="adm-r-btn adm-r-btn-secondary" onclick="clearRewardBusinessLocation()">선택 해제</button>
                    </div>

                    <div id="rewardLocationModeHint" class="adm-r-inline-status">
                        비즈니스 매장을 선택하면 관리자 저장 후 바로 생성되지 않고, 비즈니스 매장에 제안 요청이 전달됩니다.
                    </div>

                    <div class="adm-r-location-search">
                        <input
                            type="text"
                            id="rewardLocationKeyword"
                            placeholder="비즈니스 매장명 또는 주소를 검색하세요"
                            onkeypress="if(event.keyCode==13){ event.preventDefault(); searchRewardBusinessLocations(); }">
                        <button type="button" class="adm-r-btn adm-r-btn-primary" onclick="searchRewardBusinessLocations()">검색</button>
                    </div>

                    <div id="rewardLocationStatus" class="adm-r-inline-status is-muted">선택된 매장이 없으면 일반 쿠폰으로 저장됩니다.</div>
                    <div id="rewardSelectedLocation" class="adm-r-selected-location is-empty">선택된 비즈니스 매장이 없습니다.</div>
                    <div id="rewardLocationSearchResults" class="adm-r-location-results"></div>
                </div>
            </div>

            <div class="adm-r-modal-footer">
                <button type="button" class="adm-r-btn adm-r-btn-secondary" onclick="closeItemModal()">취소</button>
                <button type="button" class="adm-r-btn adm-r-btn-primary" id="itemSubmitBtn" onclick="submitItem()">등록하기</button>
            </div>
        </form>
    </div>
</div>

<div id="rewardRequestDetailModal" class="adm-r-modal">
    <div class="adm-r-modal-content adm-r-modal-content-wide">
        <div class="adm-r-modal-header">
            <h3 id="rewardRequestDetailTitle"><i class="fas fa-clipboard-list"></i> 비즈니스 쿠폰 요청 상세</h3>
            <button type="button" class="adm-r-modal-close" onclick="closeRewardRequestDetailModal()">&times;</button>
        </div>
        <div class="adm-r-modal-body">
            <div id="rewardRequestDetailBody" class="adm-r-detail-layout">
                <div class="adm-r-empty">비즈니스 쿠폰 요청 정보를 불러오는 중입니다.</div>
            </div>
        </div>
        <div class="adm-r-modal-footer" id="rewardRequestDetailFooter">
            <button type="button" class="adm-r-btn adm-r-btn-secondary" onclick="closeRewardRequestDetailModal()">닫기</button>
        </div>
    </div>
</div>
