<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt"%>

<c:set var="path" value="${pageContext.request.contextPath}" />
<link rel="stylesheet" href="${path}/css/admin-quest.css">

<div class="adm-q-container">
    <div class="adm-q-header">
        <h2 class="adm-q-title"><i class="fas fa-store"></i> 리워드 아이템 관리</h2>
        
        <div class="adm-q-controls">
            <select id="filterItemStatus" onchange="searchItem()">
                <option value="">모든 상태</option>
                <option value="ON_SALE" ${currentStatus == 'ON_SALE' ? 'selected' : ''}>판매중</option>
                <option value="SOLD_OUT" ${currentStatus == 'SOLD_OUT' ? 'selected' : ''}>품절</option>
                <option value="HIDDEN" ${currentStatus == 'HIDDEN' ? 'selected' : ''}>숨김</option>
            </select>
            
            <div class="adm-q-search-box">
                <input type="text" id="searchItemName" placeholder="아이템 이름 검색..." 
                       value="${currentKeyword}" onkeypress="if(event.keyCode==13) searchItem()">
                <button onclick="searchItem()"><i class="fas fa-search"></i></button>
            </div>

            <button class="adm-q-btn-add" onclick="openItemModal()">
                <i class="fas fa-plus"></i> 새 아이템 등록
            </button>
        </div>
    </div>

    <div class="adm-q-grid">
        <c:forEach var="item" items="${itemList}">
            <div class="adm-q-card ${item.status}">
                <div class="adm-q-card-header">
                    <span class="adm-q-category">ITEM</span>
                    <span class="adm-q-status-badge">${item.status}</span>
                </div>
                
                <div class="adm-q-card-body" 
                     onclick="editItemModal({
                        id: '${item.rewardItemId}',
                        name: '${item.name}',
                        price: '${item.pricePoint}',
                        stock: '${item.stock}',
                        status: '${item.status}',
                        desc: '${item.description.replace("'", "\\'")}'
                     })" 
                     style="cursor:pointer;" title="클릭하여 수정">
                    <h3 class="adm-q-card-title">${item.name}</h3>
                    <p class="adm-q-card-desc">${item.description}</p>
                </div>
                
                <div class="adm-q-reward">
                    <div class="reward-item">
                        <i class="fas fa-coins point-icon"></i> <span>${item.pricePoint} PT</span>
                    </div>
                    <div class="reward-item">
                        <i class="fas fa-boxes-stacked stock-icon"></i> <span>재고: ${item.stock}</span>
                    </div>
                </div>

                <div class="adm-q-card-footer">
                    <c:choose>
                        <c:when test="${item.status == 'ON_SALE'}">
                            <button class="btn-q-stop" onclick="updateItemStatus(${item.rewardItemId}, 'HIDDEN')">숨기기</button>
                        </c:when>
                        <c:otherwise>
                            <button class="btn-q-start" onclick="updateItemStatus(${item.rewardItemId}, 'ON_SALE')">판매개시</button>
                        </c:otherwise>
                    </c:choose>
                    <button class="btn-q-delete" onclick="updateItemStatus(${item.rewardItemId}, 'DELETED')">삭제</button>
                </div>
            </div>
        </c:forEach>
    </div>
</div>

<div id="itemModal" class="adm-q-modal">
    <div class="adm-q-modal-content">
        <div class="adm-q-modal-header">
            <h3 id="itemModalTitleText"><i class="fas fa-plus-circle"></i> 새 리워드 등록</h3>
            <span class="close-modal" onclick="closeItemModal()">&times;</span>
        </div>
        
        <form id="itemForm">
            <input type="hidden" name="rewardItemId" id="modalItemId" value="0"> 
            
            <div class="modal-body">
                <div class="input-group">
                    <label>아이템 명칭</label>
                    <input type="text" id="i_name" name="name" placeholder="아이템 이름을 입력하세요" required>
                </div>
                <div class="input-group">
                    <label>판매 가격 (PT)</label>
                    <input type="number" id="i_price" name="pricePoint" value="0" min="0">
                </div>
                <div class="input-group">
                    <label>초기 재고량</label>
                    <input type="number" id="i_stock" name="stock" value="0" min="0">
                </div>
                <div class="input-group">
                    <label>상태</label>
                    <select id="i_status" name="status">
                        <option value="ON_SALE">판매중 (ON_SALE)</option>
                        <option value="SOLD_OUT">품절 (SOLD_OUT)</option>
                        <option value="HIDDEN">숨김 (HIDDEN)</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>아이템 설명</label>
                    <textarea id="i_desc" name="description" rows="4" placeholder="아이템 상세 설명을 입력하세요" required></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-cancel" onclick="closeItemModal()">취소</button>
                <button type="button" class="btn-submit" id="itemSubmitBtn" onclick="submitItem()">등록하기</button>
            </div>
        </form>
    </div>
</div>