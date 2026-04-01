<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>

<c:set var="path" value="${pageContext.request.contextPath}" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="${path}/css/admin-business.css">

<div class="adm-b-container"
    data-current-tab="${currentTab}"
    data-business-page="${businessCurrentPage}"
    data-inquiry-page="${inquiryCurrentPage}"
    data-page-size="${pageSize}"
    data-user-id="${currentUserId}">
    <div class="adm-b-header">
        <div class="adm-b-title-wrap">
            <h2 class="adm-b-title"><i class="fas fa-map-marked-alt"></i> 매장 관리</h2>
            <div class="adm-b-tab-nav">
                <button type="button" class="adm-b-tab ${currentTab != 'business' ? 'active' : ''}" data-tab="inquiry" onclick="showBusinessTab('inquiry')">비즈니스 문의</button>
                <button type="button" class="adm-b-tab ${currentTab == 'business' ? 'active' : ''}" data-tab="business" onclick="showBusinessTab('business')">매장 관리</button>
            </div>
        </div>
    </div>

    <section class="adm-b-panel ${currentTab != 'business' ? 'active' : ''}" data-panel="inquiry">
        <div class="adm-b-controls">
            <select id="filterInquiryStatus" class="adm-b-select" onchange="searchBusinessInquiry()">
                <option value="">전체 상태</option>
                <option value="PENDING" ${currentInquiryStatus == 'PENDING' ? 'selected' : ''}>PENDING</option>
                <option value="IN_PROGRESS" ${currentInquiryStatus == 'IN_PROGRESS' ? 'selected' : ''}>IN_PROGRESS</option>
                <option value="ANSWERED" ${currentInquiryStatus == 'ANSWERED' ? 'selected' : ''}>ANSWERED</option>
                <option value="CLOSED" ${currentInquiryStatus == 'CLOSED' ? 'selected' : ''}>CLOSED</option>
            </select>
            <div class="adm-b-search-box">
                <input type="text" id="searchInquiryKeyword" placeholder="문의 제목 또는 내용을 검색하세요" value="${currentInquiryKeyword}" onkeypress="if(event.keyCode==13) searchBusinessInquiry()">
                <button type="button" onclick="searchBusinessInquiry()"><i class="fas fa-search"></i></button>
            </div>
        </div>

        <div class="adm-b-table-wrap">
            <table class="adm-b-table">
                <thead>
                    <tr>
                        <th>문의번호</th>
                        <th>회원번호</th>
                        <th>제목</th>
                        <th>상태</th>
                        <th>등록일</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
                    <c:choose>
                        <c:when test="${not empty businessInquiryList}">
                            <c:forEach var="inquiry" items="${businessInquiryList}">
                                <tr class="adm-b-row" id="business-inquiry-row-${inquiry.inquiryId}">
                                    <td>${inquiry.inquiryId}</td>
                                    <td>${inquiry.userId}</td>
                                    <td class="adm-b-strong">${inquiry.title}</td>
                                    <td><span class="adm-b-status ${inquiry.status}" id="business-inquiry-status-${inquiry.inquiryId}">${inquiry.status}</span></td>
                                    <td>${inquiry.createdAt}</td>
                                    <td>
                                        <div class="adm-b-actions ${inquiry.status == 'ANSWERED' ? 'is-answered' : ''}" id="business-inquiry-actions-${inquiry.inquiryId}">
                                            <button type="button" class="adm-b-btn-view" onclick="viewBusinessInquiryDetail(${inquiry.inquiryId})">상세</button>
                                            <c:if test="${inquiry.status != 'ANSWERED'}">
                                                <button type="button" class="adm-b-btn-contract" id="business-inquiry-accept-${inquiry.inquiryId}" onclick="openBusinessContractModal(${inquiry.inquiryId}, ${inquiry.userId})">수락</button>
                                                <button type="button" class="adm-b-btn-delete" id="business-inquiry-reject-${inquiry.inquiryId}" onclick="openBusinessInquiryRejectModal(${inquiry.inquiryId})">거절</button>
                                            </c:if>
                                        </div>
                                    </td>
                                </tr>
                            </c:forEach>
                        </c:when>
                        <c:otherwise>
                            <tr><td colspan="6" class="adm-b-empty">비즈니스 문의 데이터가 없습니다.</td></tr>
                        </c:otherwise>
                    </c:choose>
                </tbody>
            </table>
        </div>

        <c:if test="${inquiryTotalPages > 1}">
            <div class="adm-b-pagination">
                <button type="button" class="adm-b-page-btn"
                    onclick="goBusinessInquiryPage(${inquiryCurrentPage - 1})"
                    ${inquiryCurrentPage <= 1 ? 'disabled' : ''}>이전</button>
                <c:forEach var="pageNumber" begin="${inquiryStartPage}" end="${inquiryEndPage}">
                    <button type="button"
                        class="adm-b-page-btn ${pageNumber == inquiryCurrentPage ? 'is-active' : ''}"
                        onclick="goBusinessInquiryPage(${pageNumber})">${pageNumber}</button>
                </c:forEach>
                <button type="button" class="adm-b-page-btn"
                    onclick="goBusinessInquiryPage(${inquiryCurrentPage + 1})"
                    ${inquiryCurrentPage >= inquiryTotalPages ? 'disabled' : ''}>다음</button>
            </div>
        </c:if>
    </section>

    <section class="adm-b-panel ${currentTab == 'business' ? 'active' : ''}" data-panel="business">
        <div class="adm-b-controls">
            <div class="adm-b-search-box">
                <input type="text" id="searchBusinessKeyword" placeholder="매장명, 주소, 연락처를 검색하세요" value="${currentBusinessKeyword}" onkeypress="if(event.keyCode==13) searchBusiness()">
                <button type="button" onclick="searchBusiness()"><i class="fas fa-search"></i></button>
            </div>
            <button type="button" class="adm-b-btn-add" onclick="openBusinessModal()"><i class="fas fa-plus"></i> 매장 등록</button>
        </div>

        <div class="adm-b-table-wrap">
            <table class="adm-b-table">
                <thead>
                    <tr>
                        <th>매장번호</th>
                        <th>회원번호</th>
                        <th>매장명</th>
                        <th>연락처</th>
                        <th>주소</th>
                        <th>운영상태</th>
                        <th>등록일</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
                    <c:choose>
                        <c:when test="${not empty businessList}">
                            <c:forEach var="business" items="${businessList}">
                                <tr class="adm-b-row">
                                    <td>${business.businessId}</td>
                                    <td>${business.userId}</td>
                                    <td class="adm-b-strong">${business.businessName}</td>
                                    <td>${empty business.phone ? '-' : business.phone}</td>
                                    <td class="adm-b-address-cell">
                                        <div>${business.address}</div>
                                        <c:if test="${not empty business.addressDetail}">
                                            <small>${business.addressDetail}</small>
                                        </c:if>
                                    </td>
                                    <td>
                                        <span class="adm-b-status ${empty business.operationStatus ? 'UNKNOWN' : business.operationStatus}">
                                            <c:choose>
                                                <c:when test="${business.operationStatus == 'ACTIVE'}">운영중</c:when>
                                                <c:when test="${business.operationStatus == 'INACTIVE'}">운영중지</c:when>
                                                <c:otherwise>상태확인불가</c:otherwise>
                                            </c:choose>
                                        </span>
                                    </td>
                                    <td>${business.createdAt}</td>
                                    <td>
                                        <div class="adm-b-actions">
                                            <button type="button" class="adm-b-btn-view" onclick="viewBusinessDetail(${business.businessId})">상세</button>
                                            <button type="button" class="adm-b-btn-edit" onclick="openBusinessModal(${business.businessId})">수정</button>
                                            <c:choose>
                                                <c:when test="${business.operationStatus == 'INACTIVE'}">
                                                    <button type="button" class="adm-b-btn-contract" onclick="changeBusinessOperation(${business.businessId}, 'INACTIVE')">운영재개</button>
                                                </c:when>
                                                <c:when test="${business.operationStatus == 'ACTIVE'}">
                                                    <button type="button" class="adm-b-btn-delete" onclick="changeBusinessOperation(${business.businessId}, 'ACTIVE')">운영중지</button>
                                                </c:when>
                                                <c:otherwise>
                                                    <button type="button" class="adm-b-btn-delete" disabled>상태확인</button>
                                                </c:otherwise>
                                            </c:choose>
                                        </div>
                                    </td>
                                </tr>
                            </c:forEach>
                        </c:when>
                        <c:otherwise>
                            <tr><td colspan="8" class="adm-b-empty">등록된 매장 데이터가 없습니다.</td></tr>
                        </c:otherwise>
                    </c:choose>
                </tbody>
            </table>
        </div>

        <c:if test="${businessTotalPages > 1}">
            <div class="adm-b-pagination">
                <button type="button" class="adm-b-page-btn"
                    onclick="goBusinessPage(${businessCurrentPage - 1})"
                    ${businessCurrentPage <= 1 ? 'disabled' : ''}>이전</button>
                <c:forEach var="pageNumber" begin="${businessStartPage}" end="${businessEndPage}">
                    <button type="button"
                        class="adm-b-page-btn ${pageNumber == businessCurrentPage ? 'is-active' : ''}"
                        onclick="goBusinessPage(${pageNumber})">${pageNumber}</button>
                </c:forEach>
                <button type="button" class="adm-b-page-btn"
                    onclick="goBusinessPage(${businessCurrentPage + 1})"
                    ${businessCurrentPage >= businessTotalPages ? 'disabled' : ''}>다음</button>
            </div>
        </c:if>
    </section>
</div>

<div id="businessModal" class="adm-b-modal">
    <div class="adm-b-modal-content">
        <div class="adm-b-modal-header">
            <h3 id="businessModalTitleText"><i class="fas fa-plus-circle"></i> 매장 등록</h3>
            <span class="adm-b-close" onclick="closeBusinessModal()">&times;</span>
        </div>
        <form id="businessForm">
            <input type="hidden" name="businessId" id="businessId" value="0">
            <input type="hidden" name="inquiryId" id="businessInquiryId" value="">
            <div class="adm-b-modal-body">
                <div class="adm-b-form-grid">
                    <div class="adm-b-input-group">
                        <label for="businessUserId">회원번호</label>
                        <input type="number" id="businessUserId" name="userId" min="1" required>
                    </div>
                    <div class="adm-b-input-group">
                        <label for="businessName">매장명</label>
                        <input type="text" id="businessName" name="businessName" required>
                    </div>
                    <div class="adm-b-input-group">
                        <label for="businessZipCode">우편번호</label>
                        <input type="text" id="businessZipCode" name="zipCode" required>
                    </div>
                    <div class="adm-b-input-group adm-b-input-group-wide">
                        <label for="businessAddress">주소</label>
                        <input type="text" id="businessAddress" name="address" required>
                    </div>
                    <div class="adm-b-input-group adm-b-input-group-wide">
                        <label for="businessAddressDetail">상세주소</label>
                        <input type="text" id="businessAddressDetail" name="addressDetail">
                    </div>
                    <div class="adm-b-input-group">
                        <label for="businessPhone">연락처</label>
                        <input type="text" id="businessPhone" name="phone">
                    </div>
                    <div class="adm-b-input-group adm-b-input-group-wide">
                        <label for="businessDescription">설명</label>
                        <textarea id="businessDescription" name="description" rows="4"></textarea>
                    </div>
                </div>
            </div>
            <div class="adm-b-modal-footer">
                <button type="button" class="adm-b-btn-cancel" onclick="closeBusinessModal()">취소</button>
                <button type="button" class="adm-b-btn-submit" id="businessSubmitBtn" onclick="submitBusiness()">저장</button>
            </div>
        </form>
    </div>
</div>

<div id="businessDetailModal" class="adm-b-modal">
    <div class="adm-b-modal-content adm-b-detail-modal">
        <div class="adm-b-modal-header">
            <h3><i class="fas fa-store"></i> 매장 상세</h3>
            <div class="adm-b-detail-header-actions">
                <div class="adm-b-detail-tab-nav">
                    <button type="button" class="adm-b-detail-tab is-active" data-detail-tab="basic" onclick="showBusinessDetailTab('basic')">매장 기본정보</button>
                    <button type="button" class="adm-b-detail-tab" data-detail-tab="auth" onclick="showBusinessDetailTab('auth')">비즈니스 정보</button>
                </div>
                <span class="adm-b-close" onclick="closeBusinessDetailModal()">&times;</span>
            </div>
        </div>
        <div class="adm-b-modal-body">
            <div class="adm-b-detail-tab-panel is-active" data-detail-panel="basic">
                <div class="adm-b-detail-grid">
                    <div class="adm-b-detail-item"><span class="adm-b-detail-label">매장번호</span><strong id="detailBusinessId">-</strong></div>
                    <div class="adm-b-detail-item"><span class="adm-b-detail-label">회원번호</span><strong id="detailUserId">-</strong></div>
                    <div class="adm-b-detail-item"><span class="adm-b-detail-label">매장명</span><strong id="detailBusinessName">-</strong></div>
                    <div class="adm-b-detail-item"><span class="adm-b-detail-label">우편번호</span><strong id="detailZipCode">-</strong></div>
                    <div class="adm-b-detail-item adm-b-detail-item-wide"><span class="adm-b-detail-label">주소</span><strong id="detailAddress">-</strong></div>
                    <div class="adm-b-detail-item adm-b-detail-item-wide"><span class="adm-b-detail-label">상세주소</span><strong id="detailAddressDetail">-</strong></div>
                    <div class="adm-b-detail-item"><span class="adm-b-detail-label">연락처</span><strong id="detailPhone">-</strong></div>
                    <div class="adm-b-detail-item"><span class="adm-b-detail-label">등록일</span><strong id="detailCreatedAt">-</strong></div>
                    <div class="adm-b-detail-item"><span class="adm-b-detail-label">운영상태</span><strong><span class="adm-b-status UNKNOWN" id="detailOperationStatus">상태확인불가</span></strong></div>
                    <div class="adm-b-detail-item adm-b-detail-item-wide"><span class="adm-b-detail-label">설명</span><strong id="detailDescription">-</strong></div>
                </div>
            </div>
            <div class="adm-b-detail-tab-panel" data-detail-panel="auth">
                <div id="businessAuthStatus" class="adm-b-auth-status">비즈니스 정보를 불러오는 중입니다.</div>
                <div class="adm-b-auth-summary-grid">
                    <div class="adm-b-auth-summary-card">
                        <span class="adm-b-auth-summary-label">총 인증 건수</span>
                        <strong id="detailAuthTotalCount">0</strong>
                    </div>
                    <div class="adm-b-auth-summary-card">
                        <span class="adm-b-auth-summary-label">QR 인증 건수</span>
                        <strong id="detailAuthQrCount">0</strong>
                    </div>
                    <div class="adm-b-auth-summary-card">
                        <span class="adm-b-auth-summary-label">영수증 인증 건수</span>
                        <strong id="detailAuthReceiptCount">0</strong>
                    </div>
                    <div class="adm-b-auth-summary-card">
                        <span class="adm-b-auth-summary-label">누적 결제 금액</span>
                        <strong id="detailAuthPaymentAmount">0원</strong>
                    </div>
                    <div class="adm-b-auth-summary-card">
                        <span class="adm-b-auth-summary-label">누적 정산 금액</span>
                        <strong id="detailAuthSettlementAmount">0원</strong>
                    </div>
                    <div class="adm-b-auth-summary-card">
                        <span class="adm-b-auth-summary-label">최근 인증 일시</span>
                        <strong id="detailAuthLastAt">-</strong>
                    </div>
                    <div class="adm-b-auth-summary-card">
                        <span class="adm-b-auth-summary-label">인증 사용자 수</span>
                        <strong id="detailAuthUserCount">0</strong>
                    </div>
                    <div class="adm-b-auth-summary-card">
                        <span class="adm-b-auth-summary-label">인증 발생 장소 수</span>
                        <strong id="detailAuthLocationCount">0</strong>
                    </div>
                </div>
            </div>
        </div>
        <div class="adm-b-modal-footer">
            <button type="button" class="adm-b-btn-qr" id="businessDetailQrBtn" data-business-id="0" data-operation-status="UNKNOWN" onclick="openBusinessQrModal()">QR 보기</button>
            <button type="button" class="adm-b-btn-cancel" onclick="closeBusinessDetailModal()">닫기</button>
        </div>
    </div>
</div>

<div id="businessQrModal" class="adm-b-modal">
    <div class="adm-b-modal-content adm-b-qr-modal">
        <div class="adm-b-modal-header">
            <h3><i class="fas fa-qrcode"></i> 매장 QR 코드</h3>
            <span class="adm-b-close" onclick="closeBusinessQrModal()">&times;</span>
        </div>
        <div class="adm-b-modal-body">
            <div id="businessQrStatus" class="adm-b-qr-status">QR 정보를 불러오는 중입니다.</div>
            <div class="adm-b-qr-layout">
                <div class="adm-b-qr-preview">
                    <div class="adm-b-qr-image-wrap">
                        <img id="businessQrImage" class="adm-b-qr-image" alt="매장 QR 코드" />
                    </div>
                </div>
                <div class="adm-b-qr-meta">
                    <div class="adm-b-detail-item">
                        <span class="adm-b-detail-label">매장명</span>
                        <strong id="businessQrBusinessName">-</strong>
                    </div>
                    <div class="adm-b-detail-item">
                        <span class="adm-b-detail-label">대표 장소명</span>
                        <strong id="businessQrLocationName">-</strong>
                    </div>
                    <div class="adm-b-detail-item adm-b-detail-item-wide">
                        <span class="adm-b-detail-label">주소</span>
                        <strong id="businessQrAddress">-</strong>
                    </div>
                    <div class="adm-b-detail-item adm-b-detail-item-wide">
                        <span class="adm-b-detail-label">인증키</span>
                        <strong id="businessQrAuthKey">-</strong>
                    </div>
                </div>
            </div>
        </div>
        <div class="adm-b-modal-footer">
            <button type="button" class="adm-b-btn-print" onclick="printBusinessQr()">출력</button>
            <button type="button" class="adm-b-btn-cancel" onclick="closeBusinessQrModal()">닫기</button>
        </div>
    </div>
</div>

<div id="businessInquiryDetailModal" class="adm-b-modal">
    <div class="adm-b-modal-content adm-b-detail-modal">
        <div class="adm-b-modal-header">
            <h3><i class="fas fa-file-lines"></i> 문의 상세</h3>
            <span class="adm-b-close" onclick="closeBusinessInquiryDetailModal()">&times;</span>
        </div>
        <div class="adm-b-modal-body">
            <div class="adm-b-detail-grid">
                <div class="adm-b-detail-item"><span class="adm-b-detail-label">문의번호</span><strong id="detailInquiryId">-</strong></div>
                <div class="adm-b-detail-item"><span class="adm-b-detail-label">회원번호</span><strong id="detailInquiryUserId">-</strong></div>
                <div class="adm-b-detail-item adm-b-detail-item-wide"><span class="adm-b-detail-label">제목</span><strong id="detailInquiryTitle">-</strong></div>
                <div class="adm-b-detail-item"><span class="adm-b-detail-label">상태</span><strong id="detailInquiryStatus">-</strong></div>
                <div class="adm-b-detail-item"><span class="adm-b-detail-label">등록일</span><strong id="detailInquiryCreatedAt">-</strong></div>
                <div class="adm-b-detail-item adm-b-detail-item-wide"><span class="adm-b-detail-label">내용</span><strong id="detailInquiryContent">-</strong></div>
            </div>
        </div>
        <div class="adm-b-modal-footer">
            <button type="button" class="adm-b-btn-cancel" onclick="closeBusinessInquiryDetailModal()">닫기</button>
        </div>
    </div>
</div>

<div id="businessInquiryRejectModal" class="adm-b-modal">
    <div class="adm-b-modal-content adm-b-reject-modal">
        <div class="adm-b-modal-header">
            <h3><i class="fas fa-ban"></i> 문의 거절</h3>
            <span class="adm-b-close" onclick="closeBusinessInquiryRejectModal()">&times;</span>
        </div>
        <div class="adm-b-modal-body">
            <input type="hidden" id="rejectInquiryId" value="">
            <div class="adm-b-input-group adm-b-input-group-wide">
                <label for="rejectInquiryReason">거절 사유</label>
                <textarea id="rejectInquiryReason" rows="5" placeholder="거절 사유를 입력하세요"></textarea>
            </div>
        </div>
        <div class="adm-b-modal-footer">
            <button type="button" class="adm-b-btn-cancel" onclick="closeBusinessInquiryRejectModal()">취소</button>
            <button type="button" class="adm-b-btn-submit" onclick="submitBusinessInquiryReject()">거절하기</button>
        </div>
    </div>
</div>
