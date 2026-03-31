<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>

<c:set var="path" value="${pageContext.request.contextPath}" />
<c:set var="kakaoMapKey" value="0ee4eff9fa2ac60452126f417cc94a0c" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="${path}/css/admin-quest.css?v=20260326-2315">
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
<style>
    .adm-l-card-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 16px;
    }

    .adm-l-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(114, 57, 234, 0.12);
        color: #d9c9ff;
        font-size: 12px;
        font-weight: 700;
    }

    .adm-l-address {
        margin-top: 10px;
        color: #c7c7dc;
        font-size: 13px;
        line-height: 1.5;
    }

    .adm-l-coords {
        color: #9292af;
        word-break: break-all;
    }

    .adm-l-desc {
        min-height: 42px;
    }

    .adm-l-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }

    .adm-l-category-select {
        min-width: 140px;
        height: 42px;
        padding: 0 14px;
        border: 1px solid #323248;
        border-radius: 10px;
        background: #252537;
        color: #ffffff;
    }

    .adm-l-btn-add {
        height: 42px;
        padding: 0 16px;
        border: none;
        border-radius: 10px;
        background: #7239ea;
        color: #ffffff;
        font-weight: 700;
        cursor: pointer;
    }

    .adm-l-btn-add:hover {
        background: #8c5bff;
    }

    .adm-l-modal {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 2000;
        padding: 24px;
        background: rgba(15, 23, 42, 0.72);
        box-sizing: border-box;
    }

    .adm-l-modal-content {
        width: min(760px, 100%);
        margin: 4vh auto;
        border-radius: 20px;
        overflow: hidden;
        background: #252537;
        border: 1px solid #323248;
        color: #ffffff;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.32);
    }

    .adm-l-modal-header,
    .adm-l-modal-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 22px;
        background: #1e1e2d;
    }

    .adm-l-modal-header h3 {
        margin: 0;
        font-size: 20px;
    }

    .adm-l-modal-close {
        border: none;
        background: transparent;
        color: #ffffff;
        font-size: 26px;
        cursor: pointer;
    }

    .adm-l-modal-body {
        padding: 22px;
    }

    #locationModal #locationForm {
        display: flex;
        flex-direction: column;
        min-height: 0;
        flex: 1 1 auto;
    }

    #locationModal .adm-l-modal-body {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
    }

    #locationModal .adm-l-modal-footer {
        flex-shrink: 0;
    }

    .adm-l-form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
    }

    .adm-l-input-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .adm-l-input-group-wide {
        grid-column: 1 / -1;
    }

    .adm-l-input-group label {
        font-size: 13px;
        font-weight: 700;
        color: #d9d9e8;
    }

    .adm-l-input-group input,
    .adm-l-input-group textarea,
    .adm-l-input-group select {
        width: 100%;
        min-height: 44px;
        padding: 10px 12px;
        border: 1px solid #323248;
        border-radius: 10px;
        background: #1a1a27;
        color: #ffffff;
        box-sizing: border-box;
    }

    .adm-l-input-group textarea {
        min-height: 120px;
        resize: vertical;
    }

    .adm-l-address-row {
        display: flex;
        gap: 10px;
    }

    .adm-l-address-row input {
        flex: 1;
    }

    .adm-l-address-row button {
        flex: 0 0 auto;
        min-width: 110px;
        border: none;
        border-radius: 10px;
        background: #0ea5e9;
        color: #ffffff;
        font-weight: 700;
        cursor: pointer;
    }

    .adm-l-geo-status {
        margin-top: 8px;
        color: #a5b4fc;
        font-size: 12px;
    }

    .adm-l-geo-status.is-error {
        color: #fda4af;
    }

    .adm-l-btn-cancel,
    .adm-l-btn-submit {
        min-width: 110px;
        height: 42px;
        border: none;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
    }

    .adm-l-btn-cancel {
        background: #3b3b52;
        color: #ffffff;
    }

    .adm-l-btn-submit {
        background: #7239ea;
        color: #ffffff;
    }

    .adm-l-btn-submit:disabled {
        opacity: 0.65;
        cursor: not-allowed;
    }
</style>

<div class="adm-q-container">
    <div class="adm-q-header">
        <h2 class="adm-q-title">
            <i class="fas fa-location-dot"></i> 장소 관리
        </h2>

        <div class="adm-q-controls adm-l-controls">
            <select id="filterLocationCategory" class="adm-l-category-select" onchange="searchLocation()">
                <option value="">모든 장소</option>
                <option value="VISIT" ${currentCategory == 'VISIT' ? 'selected' : ''}>방문형</option>
                <option value="EXPERIENCE" ${currentCategory == 'EXPERIENCE' ? 'selected' : ''}>체험형</option>
                <option value="PURCHASE" ${currentCategory == 'PURCHASE' ? 'selected' : ''}>구매형</option>
            </select>

            <div class="adm-q-search-box">
                <input
                    type="text"
                    id="searchLocationKeyword"
                    placeholder="장소명 또는 주소 검색"
                    value="${currentKeyword}"
                    onkeypress="if(event.keyCode==13) searchLocation()">
                <button type="button" onclick="searchLocation()">
                    <i class="fas fa-search"></i>
                </button>
            </div>

            <button type="button" class="adm-l-btn-add" onclick="openLocationModal()">
                <i class="fas fa-plus"></i> 장소 등록
            </button>
        </div>
    </div>

    <c:if test="${not empty locationLoadError}">
        <div class="adm-q-empty">${locationLoadError}</div>
    </c:if>

    <div class="adm-q-sections">
        <section class="adm-q-section adm-q-section-active">
            <div class="adm-q-section-header">
                <div>
                    <h3 class="adm-q-section-title">등록된 장소</h3>
                    <p class="adm-q-section-subtitle">현재 lq_location 테이블에 등록된 장소 목록입니다.</p>
                </div>
                <span class="adm-q-section-count">${locationCount}</span>
            </div>

            <c:choose>
                <c:when test="${not empty locationList}">
                    <div class="adm-q-grid">
                        <c:forEach var="location" items="${locationList}">
                            <div class="adm-q-card">
                                <div class="adm-q-card-header">
                                    <span class="adm-q-status-badge ${empty location.locationCategory ? 'VISIT' : location.locationCategory}">
                                        <c:choose>
                                            <c:when test="${empty location.locationCategory or location.locationCategory == 'VISIT'}">방문형</c:when>
                                            <c:when test="${location.locationCategory == 'EXPERIENCE'}">체험형</c:when>
                                            <c:when test="${location.locationCategory == 'PURCHASE'}">구매형</c:when>
                                            <c:otherwise>${location.locationCategory}</c:otherwise>
                                        </c:choose>
                                    </span>
                                </div>

                                <div class="adm-q-card-body"
                                    data-id="${location.locationId}"
                                    data-name="${location.name}"
                                    data-zipcode="${location.zipCode}"
                                    data-address="${location.address}"
                                    data-address-detail="${location.addressDetail}"
                                    data-latitude="${location.latitude}"
                                    data-longitude="${location.longitude}"
                                    data-location-type="${location.locationType}"
                                    data-location-category="${location.locationCategory}"
                                    data-description="${location.description}"
                                    onclick="openLocationEditModal(this)"
                                    style="cursor:pointer;"
                                    title="클릭해서 수정">
                                    <h3 class="adm-q-card-title">${location.name}</h3>
                                    <p class="adm-q-card-desc adm-l-desc">
                                        <c:choose>
                                            <c:when test="${not empty location.description}">${location.description}</c:when>
                                            <c:otherwise>등록된 장소 설명이 없습니다.</c:otherwise>
                                        </c:choose>
                                    </p>
                                    <div class="adm-l-address">
                                        <div>${location.address}</div>
                                        <c:if test="${not empty location.addressDetail}">
                                            <div>${location.addressDetail}</div>
                                        </c:if>
                                        <c:if test="${not empty location.zipCode}">
                                            <div>우편번호 ${location.zipCode}</div>
                                        </c:if>
                                    </div>
                                </div>

                                <div class="adm-q-reward">
                                    <div class="adm-l-card-meta">
                                        <span class="adm-l-chip"><i class="fas fa-hashtag"></i> ${location.locationId}</span>
                                        <c:if test="${not empty location.locationType}">
                                            <span class="adm-l-chip">
                                                <i class="fas fa-layer-group"></i>
                                                <c:choose>
                                                    <c:when test="${location.locationType == 'QUEST_SPOT'}">퀘스트 장소</c:when>
                                                    <c:when test="${location.locationType == 'BUSINESS_STORE'}">사업장</c:when>
                                                    <c:otherwise>${location.locationType}</c:otherwise>
                                                </c:choose>
                                            </span>
                                        </c:if>
                                        <c:if test="${not empty location.locationCategory}">
                                            <span class="adm-l-chip">
                                                <i class="fas fa-tag"></i>
                                                <c:choose>
                                                    <c:when test="${location.locationCategory == 'VISIT'}">방문형</c:when>
                                                    <c:when test="${location.locationCategory == 'EXPERIENCE'}">체험형</c:when>
                                                    <c:when test="${location.locationCategory == 'PURCHASE'}">구매형</c:when>
                                                    <c:otherwise>${location.locationCategory}</c:otherwise>
                                                </c:choose>
                                            </span>
                                        </c:if>
                                        <c:if test="${location.businessId != null}">
                                            <span class="adm-l-chip"><i class="fas fa-store"></i> 사업장 ${location.businessId}</span>
                                        </c:if>
                                        <span class="adm-l-chip adm-l-coords"><i class="fas fa-crosshairs"></i> ${location.latitude}, ${location.longitude}</span>
                                    </div>
                                </div>
                            </div>
                        </c:forEach>
                    </div>
                </c:when>
                <c:otherwise>
                    <div class="adm-q-empty adm-q-section-empty">등록된 장소가 없습니다.</div>
                </c:otherwise>
            </c:choose>
        </section>
    </div>
</div>

<div id="locationModal" class="adm-l-modal">
    <div class="adm-l-modal-content">
        <div class="adm-l-modal-header">
            <h3 id="locationModalTitle"><i class="fas fa-plus-circle"></i> 장소 등록</h3>
            <button type="button" class="adm-l-modal-close" onclick="closeLocationModal()">&times;</button>
        </div>

        <form id="locationForm">
            <div class="adm-l-modal-body">
                <input type="hidden" id="locationId" name="locationId" value="0">
                <input type="hidden" id="locationLatitude" name="latitude">
                <input type="hidden" id="locationLongitude" name="longitude">

                <div class="adm-l-form-grid">
                    <div class="adm-l-input-group">
                        <label for="locationName">장소 이름</label>
                        <input type="text" id="locationName" name="name" required>
                    </div>

                    <div class="adm-l-input-group">
                        <label for="locationType">장소 타입</label>
                        <input type="text" id="locationType" name="locationType" value="QUEST_SPOT" required>
                    </div>

                    <div class="adm-l-input-group adm-l-input-group-wide">
                        <label for="locationZipCode">우편번호</label>
                        <div class="adm-l-address-row">
                            <input type="text" id="locationZipCode" name="zipCode" readonly required>
                            <button type="button" onclick="openLocationPostcode()">찾기</button>
                        </div>
                    </div>

                    <div class="adm-l-input-group adm-l-input-group-wide">
                        <label for="locationAddress">주소</label>
                        <input type="text" id="locationAddress" name="address" readonly required>
                    </div>

                    <div class="adm-l-input-group adm-l-input-group-wide">
                        <label for="locationAddressDetail">상세주소</label>
                        <input type="text" id="locationAddressDetail" name="addressDetail">
                    </div>

                    <div class="adm-l-input-group">
                        <label for="locationCategory">장소 카테고리</label>
                        <select id="locationCategory" name="locationCategory" required>
                            <option value="VISIT">방문형</option>
                            <option value="EXPERIENCE">체험형</option>
                            <option value="PURCHASE">구매형</option>
                        </select>
                    </div>

                    <div class="adm-l-input-group">
                        <label for="locationCoordinates">위도 / 경도</label>
                        <input type="text" id="locationCoordinates" value="" readonly placeholder="주소 선택 시 자동 입력">
                        <div id="locationGeoStatus" class="adm-l-geo-status">도로명주소를 선택하면 위도와 경도가 자동 입력됩니다.</div>
                    </div>

                    <div class="adm-l-input-group adm-l-input-group-wide">
                        <label for="locationDescription">장소 설명</label>
                        <textarea id="locationDescription" name="description" rows="4"></textarea>
                    </div>
                </div>
            </div>

            <div class="adm-l-modal-footer">
                <button type="button" class="adm-l-btn-cancel" onclick="closeLocationModal()">취소</button>
                <button type="button" id="locationSubmitBtn" class="adm-l-btn-submit" onclick="submitLocation()">등록</button>
            </div>
        </form>
    </div>
</div>

<script>
    const LOCATION_KAKAO_MAP_KEY = '${kakaoMapKey}';
    const LOCATION_KAKAO_SCRIPT_SELECTOR = 'script[data-location-kakao-sdk="true"]';
    let locationKakaoSdkPromise = null;

    function loadLocationKakaoSdk() {
        if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
            return Promise.resolve(window.kakao);
        }

        if (locationKakaoSdkPromise) {
            return locationKakaoSdkPromise;
        }

        locationKakaoSdkPromise = new Promise(function(resolve, reject) {
            const existingScript = document.querySelector(LOCATION_KAKAO_SCRIPT_SELECTOR);

            if (existingScript) {
                if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
                    resolve(window.kakao);
                    return;
                }

                existingScript.addEventListener('load', function() {
                    if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
                        resolve(window.kakao);
                    } else {
                        reject(new Error('kakao-sdk-unavailable'));
                    }
                }, { once: true });
                existingScript.addEventListener('error', function() {
                    reject(new Error('kakao-sdk-load-failed'));
                }, { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=' + encodeURIComponent(LOCATION_KAKAO_MAP_KEY) + '&autoload=false&libraries=services';
            script.async = true;
            script.defer = true;
            script.dataset.locationKakaoSdk = 'true';
            script.onload = function() {
                if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
                    resolve(window.kakao);
                } else {
                    reject(new Error('kakao-sdk-unavailable'));
                }
            };
            script.onerror = function() {
                reject(new Error('kakao-sdk-load-failed'));
            };
            document.head.appendChild(script);
        });

        return locationKakaoSdkPromise;
    }

    function searchLocation() {
        const keyword = document.getElementById('searchLocationKeyword').value.trim();
        const category = document.getElementById('filterLocationCategory').value;
        const params = new URLSearchParams();

        if (keyword) {
            params.set('keyword', keyword);
        }
        if (category) {
            params.set('category', category);
        }

        const query = params.toString() ? '?' + params.toString() : '';
        loadAdminContent('${path}/admin/locations' + query);
    }

    function resetLocationForm() {
        if ($('#locationForm').length > 0) {
            $('#locationForm')[0].reset();
        }
        $('#locationId').val('0');
        $('#locationType').val('QUEST_SPOT');
        $('#locationLatitude').val('');
        $('#locationLongitude').val('');
        $('#locationCoordinates').val('');
        $('#locationModalTitle').html('<i class="fas fa-plus-circle"></i> 장소 등록');
        $('#locationSubmitBtn').text('등록');
        $('#locationGeoStatus')
            .removeClass('is-error')
            .text('도로명주소를 선택하면 위도와 경도가 자동 입력됩니다.');
        $('#locationSubmitBtn').prop('disabled', false);
    }

    function openLocationModal() {
        resetLocationForm();
        $('#locationModal').fadeIn(180);
    }

    function openLocationEditModal(element) {
        resetLocationForm();

        const $element = $(element);
        const latitude = $element.data('latitude');
        const longitude = $element.data('longitude');

        $('#locationId').val(Number($element.data('id')) || 0);
        $('#locationName').val($element.data('name') || '');
        $('#locationZipCode').val($element.data('zipcode') || '');
        $('#locationAddress').val($element.data('address') || '');
        $('#locationAddressDetail').val($element.data('address-detail') || '');
        $('#locationType').val($element.data('location-type') || 'QUEST_SPOT');
        $('#locationCategory').val($element.data('location-category') || 'VISIT');
        $('#locationDescription').val($element.data('description') || '');
        $('#locationLatitude').val(latitude || '');
        $('#locationLongitude').val(longitude || '');

        if (latitude && longitude) {
            $('#locationCoordinates').val(Number(latitude).toFixed(6) + ', ' + Number(longitude).toFixed(6));
            $('#locationGeoStatus')
                .removeClass('is-error')
                .text('등록된 위도와 경도를 불러왔습니다.');
        }

        $('#locationModalTitle').html('<i class="fas fa-edit"></i> 장소 수정');
        $('#locationSubmitBtn').text('수정');
        $('#locationModal').fadeIn(180);
    }

    function closeLocationModal() {
        $('#locationModal').fadeOut(180);
        setTimeout(resetLocationForm, 200);
    }

    function openLocationPostcode() {
        new daum.Postcode({
            oncomplete: function(data) {
                const roadAddress = data.roadAddress || data.jibunAddress || '';

                $('#locationZipCode').val(data.zonecode || '');
                $('#locationAddress').val(roadAddress);
                $('#locationAddressDetail').focus();

                if (!roadAddress) {
                    $('#locationGeoStatus')
                        .addClass('is-error')
                        .text('선택한 주소를 확인할 수 없습니다. 다시 시도해 주세요.');
                    return;
                }

                geocodeLocationAddress(roadAddress);
            }
        }).open();
    }

    function geocodeLocationAddress(address) {
        $('#locationGeoStatus')
            .removeClass('is-error')
            .text('주소를 좌표로 변환하는 중입니다.');
        $('#locationLatitude').val('');
        $('#locationLongitude').val('');
        $('#locationCoordinates').val('');

        loadLocationKakaoSdk()
            .then(function(kakao) {
                kakao.maps.load(function() {
                    if (!kakao.maps.services || typeof kakao.maps.services.Geocoder !== 'function') {
                        $('#locationGeoStatus')
                            .addClass('is-error')
                            .text('카카오 지오코더 서비스를 불러오지 못했습니다.');
                        return;
                    }

                    const geocoder = new kakao.maps.services.Geocoder();

                    geocoder.addressSearch(address, function(results, status) {
                        if (status !== kakao.maps.services.Status.OK || !Array.isArray(results) || results.length === 0) {
                            $('#locationGeoStatus')
                                .addClass('is-error')
                                .text('좌표를 자동으로 찾지 못했습니다. 다른 주소를 선택해 주세요.');
                            return;
                        }

                        const first = results[0];
                        const latitude = Number(first.y);
                        const longitude = Number(first.x);

                        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                            $('#locationGeoStatus')
                                .addClass('is-error')
                                .text('좌표 변환 결과가 올바르지 않습니다. 주소를 다시 선택해 주세요.');
                            return;
                        }

                        $('#locationLatitude').val(latitude);
                        $('#locationLongitude').val(longitude);
                        $('#locationCoordinates').val(latitude.toFixed(6) + ', ' + longitude.toFixed(6));
                        $('#locationGeoStatus')
                            .removeClass('is-error')
                            .text('카카오 지오코더로 위도와 경도가 자동 입력되었습니다.');
                    });
                });
            })
            .catch(function() {
                $('#locationGeoStatus')
                    .addClass('is-error')
                    .text('카카오 지도 서비스를 불러오지 못했습니다.');
            });
    }

    function submitLocation() {
        const latitude = $('#locationLatitude').val();
        const longitude = $('#locationLongitude').val();
        const isEditMode = Number($('#locationId').val() || 0) > 0;

        if (!latitude || !longitude) {
            alert('주소를 선택해서 위도와 경도를 먼저 자동 입력해 주세요.');
            return;
        }

        $('#locationSubmitBtn').prop('disabled', true);

        $.ajax({
            url: ctx + '/admin/locations/save',
            type: 'POST',
            data: $('#locationForm').serialize(),
            success: function(res) {
                const result = String(res || '').trim();

                if (result === 'success') {
                    alert(isEditMode ? '장소가 수정되었습니다.' : '장소가 등록되었습니다.');
                    closeLocationModal();
                    searchLocation();
                    return;
                }

                if (result === 'fail:location_name_empty') {
                    alert('장소 이름을 입력해 주세요.');
                } else if (result === 'fail:zip_code_empty') {
                    alert('우편번호를 입력해 주세요.');
                } else if (result === 'fail:address_empty') {
                    alert('주소를 입력해 주세요.');
                } else if (result === 'fail:coordinate_empty') {
                    alert('위도와 경도가 자동 입력되지 않았습니다. 주소를 다시 선택해 주세요.');
                } else if (result === 'fail:location_category_empty') {
                    alert('장소 카테고리를 선택해 주세요.');
                } else {
                    alert(isEditMode ? '장소 수정에 실패했습니다.' : '장소 등록에 실패했습니다.');
                }
            },
            error: function(xhr) {
                alert('서버 통신 오류 (' + xhr.status + ')');
            },
            complete: function() {
                $('#locationSubmitBtn').prop('disabled', false);
            }
        });
    }
</script>
