<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>LOCALQUEST ADMIN</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        // 전역 경로 변수 (JSP 어디서든 사용 가능)
        const ctx = "${pageContext.request.contextPath}";
        let questCountdownTimer = null;
        let adminQuestSelectedLocations = [];
        let adminQuestSearchResults = [];
        let adminQuestFocusedSearchIndex = -1;
        let adminQuestReviews = [];
        let adminQuestReviewLoading = false;
        let adminQuestEditingReviewId = 0;
        let adminQuestReviewDraft = {
            rating: 5,
            content: ''
        };
        let businessDetailAuthLoadedFor = 0;
        let businessDetailAuthLoading = false;

        /**
         * 콘텐츠 로더
         */
        function loadAdminContent(url, element) {
            $('.admin-content-area').empty(); 
            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'html',
                success: function(response) {
                    $('.admin-content-area').html(response);
                    initializeAdminView(url);
                    if (element) {
                        $('.admin-nav-item a').removeClass('active');
                        $(element).addClass('active');
                    }
                },
                error: function(xhr) {
                    console.error("로드 실패:", xhr.status);
                    $('.admin-content-area').html(
                        '<div style="padding:24px; color:#fff; background:#252537; border-radius:12px;">'
                        + '<h3 style="margin:0 0 12px;">관리자 화면 로딩 실패</h3>'
                        + '<div>요청 URL: ' + url + '</div>'
                        + '<div>HTTP 상태: ' + xhr.status + '</div>'
                        + '</div>'
                    );
                }
            });
        }

        function initializeAdminView(url) {
            if ($('#questLocationSearchResults').length === 0) {
                adminQuestSelectedLocations = [];
                adminQuestSearchResults = [];
                adminQuestFocusedSearchIndex = -1;
            }
            if ($('#questReviewList').length === 0) {
                adminQuestReviews = [];
                adminQuestReviewLoading = false;
                adminQuestEditingReviewId = 0;
                adminQuestReviewDraft = { rating: 5, content: '' };
            }
            initializeQuestCountdowns();
        }

        function initializeQuestCountdowns() {
            if (questCountdownTimer) {
                clearInterval(questCountdownTimer);
                questCountdownTimer = null;
            }

            const $timerCards = $('.adm-q-card-body[data-time-limit]');
            if ($timerCards.length === 0) {
                return;
            }

            $timerCards.each(function() {
                updateQuestCountdown($(this));
            });
        }

        function updateQuestCountdown($cardBody) {
            const timeLimit = Number($cardBody.data('time-limit'));
            const $card = $cardBody.closest('.adm-q-card');
            const $timerItem = $card.find('.quest-timer-icon').closest('.reward-item');
            const $timerText = $card.find('.quest-timer-text');

            $timerItem.removeClass('is-urgent is-expired');

            if (!timeLimit) {
                $timerText.text('제한 없음');
                return;
            }

            $timerText.text(timeLimit + '분 제한');
        }

        function escapeAdminHtml(value) {
            return String(value == null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function resetQuestLocationState() {
            adminQuestSearchResults = [];
            adminQuestSelectedLocations = [];
            adminQuestFocusedSearchIndex = -1;
            syncQuestLocationsInput();
            renderQuestSearchResults();
            renderQuestSelectedLocations();
        }

        function showQuestLocationStatus(message, isError) {
            const $status = $('#questLocationStatus');
            if ($status.length === 0) {
                return;
            }

            if (!message) {
                $status.removeClass('is-error is-visible').text('');
                return;
            }

            $status
                .toggleClass('is-error', !!isError)
                .addClass('is-visible')
                .text(message);
        }

        function syncQuestLocationsInput() {
            const payload = adminQuestSelectedLocations.map(function(location, index) {
                return {
                    locationId: Number(location.locationId) || 0,
                    visitOrder: index + 1,
                    name: location.name,
                    zipCode: location.zipCode || '',
                    address: location.address || '',
                    addressDetail: location.addressDetail || '',
                    latitude: Number(location.latitude),
                    longitude: Number(location.longitude),
                    locationType: location.locationType || 'QUEST_SPOT',
                    description: location.description || ''
                };
            });

            $('#questLocationsJson').val(JSON.stringify(payload));
        }

        function renderQuestSearchResults() {
            const $list = $('#questLocationSearchResults');
            if ($list.length === 0) {
                return;
            }

            if (adminQuestSearchResults.length === 0) {
                $list.html('<div class="adm-q-place-empty">검색 결과가 없습니다.</div>');
                return;
            }

            const html = adminQuestSearchResults.map(function(result, index) {
                const meta = [result.categoryText, result.distanceText].filter(Boolean).join(' · ');
                return ''
                    + '<div class="adm-q-place-result' + (index === adminQuestFocusedSearchIndex ? ' is-focused' : '') + '" onclick="focusQuestSearchResult(' + index + ')">'
                    + '  <div class="adm-q-place-result-text">'
                    + '    <strong>' + escapeAdminHtml(result.name) + '</strong>'
                    + '    <span>' + escapeAdminHtml(result.address) + '</span>'
                    + (meta ? '    <small class="adm-q-place-result-meta">' + escapeAdminHtml(meta) + '</small>' : '')
                    + '  </div>'
                    + '  <button type="button" class="adm-q-place-pick" onclick="event.stopPropagation(); addQuestLocation(' + index + ')">선택</button>'
                    + '</div>';
            }).join('');

            $list.html(html);
        }

        function renderQuestSelectedLocations() {
            const $list = $('#questSelectedLocationList');
            if ($list.length === 0) {
                return;
            }

            syncQuestLocationsInput();

            if (adminQuestSelectedLocations.length === 0) {
                $list.html('<div class="adm-q-place-empty">선택된 장소가 없습니다.</div>');
                return;
            }

            const html = adminQuestSelectedLocations.map(function(location, index) {
                return ''
                    + '<div class="adm-q-place-chip">'
                    + '  <div class="adm-q-place-chip-order">' + (index + 1) + '</div>'
                    + '  <div class="adm-q-place-chip-text">'
                    + '    <strong>' + escapeAdminHtml(location.name) + '</strong>'
                    + '    <span>' + escapeAdminHtml(location.address) + '</span>'
                    + '  </div>'
                    + '  <div class="adm-q-place-chip-actions">'
                    + '    <button type="button" onclick="moveQuestLocation(' + index + ', -1)" ' + (index === 0 ? 'disabled' : '') + '>위</button>'
                    + '    <button type="button" onclick="moveQuestLocation(' + index + ', 1)" ' + (index === adminQuestSelectedLocations.length - 1 ? 'disabled' : '') + '>아래</button>'
                    + '    <button type="button" class="is-danger" onclick="removeQuestLocation(' + index + ')">삭제</button>'
                    + '  </div>'
                    + '</div>';
            }).join('');

            $list.html(html);
        }

        function searchQuestLocations() {
            const keyword = ($('#questLocationKeyword').val() || '').trim();
            showQuestLocationStatus(
                keyword
                    ? '등록된 장소 목록을 검색 중입니다.'
                    : '최근 등록된 장소 목록을 불러오는 중입니다.',
                false
            );

            $.ajax({
                url: ctx + '/admin/locations/search',
                type: 'GET',
                dataType: 'json',
                data: { keyword: keyword },
                success: function(res) {
                    adminQuestSearchResults = Array.isArray(res) ? res.map(function(result) {
                        return {
                            locationId: Number(result.locationId) || 0,
                            name: result.name || '',
                            zipCode: result.zipCode || '',
                            address: result.address || '',
                            addressDetail: result.addressDetail || '',
                            latitude: Number(result.latitude),
                            longitude: Number(result.longitude),
                            locationType: result.locationType || 'QUEST_SPOT',
                            description: result.description || '',
                            categoryText: result.locationType || '등록 장소'
                        };
                    }).filter(function(result) {
                        return result.locationId > 0
                            && result.name
                            && result.address
                            && Number.isFinite(result.latitude)
                            && Number.isFinite(result.longitude);
                    }) : [];

                    adminQuestFocusedSearchIndex = adminQuestSearchResults.length > 0 ? 0 : -1;
                    renderQuestSearchResults();

                    if (adminQuestSearchResults.length === 0) {
                        showQuestLocationStatus('조건에 맞는 등록 장소가 없습니다.', true);
                        return;
                    }

                    showQuestLocationStatus(
                        keyword
                            ? '검색된 장소 목록입니다. 퀘스트 경로에 추가할 장소를 선택해 주세요.'
                            : '최근 등록 장소 목록입니다. 퀘스트 경로에 추가할 장소를 선택해 주세요.',
                        false
                    );
                },
                error: function() {
                    adminQuestSearchResults = [];
                    adminQuestFocusedSearchIndex = -1;
                    renderQuestSearchResults();
                    showQuestLocationStatus('장소 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', true);
                }
            });
        }

        function focusQuestSearchResult(index) {
            const result = adminQuestSearchResults[index];
            if (!result) {
                return;
            }

            adminQuestFocusedSearchIndex = index;
            renderQuestSearchResults();
        }

        function addQuestLocation(index) {
            const result = adminQuestSearchResults[index];
            if (!result) {
                return;
            }

            const isDuplicated = adminQuestSelectedLocations.some(function(location) {
                if (Number(location.locationId) > 0 && Number(result.locationId) > 0) {
                    return Number(location.locationId) === Number(result.locationId);
                }

                return location.name === result.name
                    && Number(location.latitude) === Number(result.latitude)
                    && Number(location.longitude) === Number(result.longitude);
            });

            if (isDuplicated) {
                showQuestLocationStatus('이미 추가된 장소입니다.', true);
                return;
            }

            adminQuestSelectedLocations.push({
                locationId: Number(result.locationId) || 0,
                name: result.name,
                zipCode: result.zipCode || '',
                address: result.address || '',
                addressDetail: result.addressDetail || '',
                latitude: Number(result.latitude),
                longitude: Number(result.longitude),
                locationType: result.locationType || 'QUEST_SPOT',
                description: result.description || ''
            });

            renderQuestSelectedLocations();
            showQuestLocationStatus('장소가 퀘스트 경로에 추가되었습니다.', false);
        }

        function removeQuestLocation(index) {
            adminQuestSelectedLocations.splice(index, 1);
            renderQuestSelectedLocations();
        }

        function moveQuestLocation(index, direction) {
            const targetIndex = index + direction;
            if (targetIndex < 0 || targetIndex >= adminQuestSelectedLocations.length) {
                return;
            }

            const selected = adminQuestSelectedLocations[index];
            adminQuestSelectedLocations[index] = adminQuestSelectedLocations[targetIndex];
            adminQuestSelectedLocations[targetIndex] = selected;
            renderQuestSelectedLocations();
        }

        function loadQuestLocationsForEdit(questId) {
            if (!questId) {
                resetQuestLocationState();
                return;
            }

            showQuestLocationStatus('저장된 장소 정보를 불러오는 중입니다.', false);

            $.ajax({
                url: ctx + '/api/quests/' + questId,
                type: 'GET',
                dataType: 'json',
                success: function(res) {
                    adminQuestSelectedLocations = Array.isArray(res.locations) ? res.locations.map(function(location) {
                        return {
                            locationId: Number(location.locationId) || 0,
                            name: location.name || '',
                            zipCode: location.zipCode || '',
                            address: location.address || '',
                            addressDetail: location.addressDetail || '',
                            latitude: Number(location.latitude),
                            longitude: Number(location.longitude),
                            locationType: location.locationType || 'QUEST_SPOT',
                            description: location.description || ''
                        };
                    }).filter(function(location) {
                        return location.name
                            && location.address
                            && Number.isFinite(location.latitude)
                            && Number.isFinite(location.longitude);
                    }) : [];

                    renderQuestSelectedLocations();
                    showQuestLocationStatus(
                        adminQuestSelectedLocations.length > 0
                            ? '저장된 장소 정보를 불러왔습니다.'
                            : '저장된 장소가 없습니다. 새 장소를 선택할 수 있습니다.',
                        false
                    );
                },
                error: function() {
                    adminQuestSelectedLocations = [];
                    renderQuestSelectedLocations();
                    showQuestLocationStatus('기존 장소 정보를 불러오지 못했습니다. 새로 다시 선택해 주세요.', true);
                }
            });
        }

        function resetQuestReviewState() {
            adminQuestReviews = [];
            adminQuestReviewLoading = false;
            adminQuestEditingReviewId = 0;
            adminQuestReviewDraft = { rating: 5, content: '' };
            renderQuestReviewList(Number($('#modalQuestId').val()) || 0);
            showQuestReviewStatus('새 퀘스트는 등록 후 리뷰를 관리할 수 있습니다.', false);
        }

        function showQuestReviewStatus(message, isError) {
            const $status = $('#questReviewStatus');
            if ($status.length === 0) {
                return;
            }

            if (!message) {
                $status.removeClass('is-error is-visible').text('');
                return;
            }

            $status
                .toggleClass('is-error', !!isError)
                .addClass('is-visible')
                .text(message);
        }

        function formatAdminReviewDate(value) {
            if (!value) {
                return '';
            }

            const parsed = new Date(value);
            if (Number.isNaN(parsed.getTime())) {
                return escapeAdminHtml(value);
            }

            const year = parsed.getFullYear();
            const month = String(parsed.getMonth() + 1).padStart(2, '0');
            const day = String(parsed.getDate()).padStart(2, '0');
            const hours = String(parsed.getHours()).padStart(2, '0');
            const minutes = String(parsed.getMinutes()).padStart(2, '0');
            return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
        }

        function renderQuestReviewRating(rating) {
            const normalized = Math.max(1, Math.min(5, Number(rating) || 0));
            return '★'.repeat(normalized) + '☆'.repeat(5 - normalized);
        }

        function renderQuestReviewList(questId) {
            const $list = $('#questReviewList');
            if ($list.length === 0) {
                return;
            }

            if (!(questId > 0)) {
                $list.html('<div class="adm-q-review-empty">새 퀘스트는 등록 후 리뷰를 관리할 수 있습니다.</div>');
                return;
            }

            if (adminQuestReviewLoading) {
                $list.html('<div class="adm-q-review-empty">리뷰를 불러오는 중입니다.</div>');
                return;
            }

            if (adminQuestReviews.length === 0) {
                $list.html('<div class="adm-q-review-empty">등록된 리뷰가 없습니다.</div>');
                return;
            }

            const html = adminQuestReviews.map(function(review) {
                if (adminQuestEditingReviewId === Number(review.reviewId)) {
                    const options = [1, 2, 3, 4, 5].map(function(score) {
                        return '<option value="' + score + '"'
                            + (Number(adminQuestReviewDraft.rating) === score ? ' selected' : '')
                            + '>' + score + '점</option>';
                    }).join('');

                    return ''
                        + '<div class="adm-q-review-card is-editing">'
                        + '  <div class="adm-q-review-head">'
                        + '    <div class="adm-q-review-meta">'
                        + '      <strong>' + escapeAdminHtml(review.authorName || ('USER #' + review.userId)) + '</strong>'
                        + '      <span>' + formatAdminReviewDate(review.createdAt) + '</span>'
                        + '    </div>'
                        + '  </div>'
                        + '  <div class="adm-q-review-edit-row">'
                        + '    <label for="adminQuestReviewRating">별점</label>'
                        + '    <select id="adminQuestReviewRating" onchange="setAdminQuestReviewRating(this.value)">'
                        + options
                        + '    </select>'
                        + '  </div>'
                        + '  <textarea id="adminQuestReviewContent" oninput="setAdminQuestReviewContent(this.value)">'
                        + escapeAdminHtml(adminQuestReviewDraft.content || '')
                        + '</textarea>'
                        + '  <div class="adm-q-review-actions">'
                        + '    <button type="button" onclick="submitAdminQuestReviewEdit()">저장</button>'
                        + '    <button type="button" class="is-secondary" onclick="cancelAdminQuestReviewEdit()">취소</button>'
                        + '  </div>'
                        + '</div>';
                }

                return ''
                    + '<div class="adm-q-review-card">'
                    + '  <div class="adm-q-review-head">'
                    + '    <div class="adm-q-review-meta">'
                    + '      <strong>' + escapeAdminHtml(review.authorName || ('USER #' + review.userId)) + '</strong>'
                    + '      <span>' + formatAdminReviewDate(review.createdAt) + '</span>'
                    + '    </div>'
                    + '    <div class="adm-q-review-side">'
                    + '      <span class="adm-q-review-rating">' + renderQuestReviewRating(review.rating) + '</span>'
                    + '      <div class="adm-q-review-actions">'
                    + '        <button type="button" onclick="startAdminQuestReviewEdit(' + review.reviewId + ')">수정</button>'
                    + '        <button type="button" class="is-danger" onclick="deleteAdminQuestReview(' + review.reviewId + ')">삭제</button>'
                    + '      </div>'
                    + '    </div>'
                    + '  </div>'
                    + '  <p class="adm-q-review-content">' + escapeAdminHtml(review.content || '') + '</p>'
                    + '</div>';
            }).join('');

            $list.html(html);
        }

        function loadQuestReviewsForEdit(questId) {
            if (!(questId > 0)) {
                resetQuestReviewState();
                return;
            }

            adminQuestReviewLoading = true;
            adminQuestEditingReviewId = 0;
            renderQuestReviewList(questId);
            showQuestReviewStatus('리뷰를 불러오는 중입니다.', false);

            $.ajax({
                url: ctx + '/api/quests/' + questId + '/reviews',
                type: 'GET',
                dataType: 'json',
                success: function(res) {
                    adminQuestReviews = Array.isArray(res) ? res : [];
                    adminQuestReviewLoading = false;
                    renderQuestReviewList(questId);
                    showQuestReviewStatus(
                        adminQuestReviews.length > 0
                            ? '등록된 리뷰를 불러왔습니다.'
                            : '등록된 리뷰가 없습니다.',
                        false
                    );
                },
                error: function() {
                    adminQuestReviews = [];
                    adminQuestReviewLoading = false;
                    renderQuestReviewList(questId);
                    showQuestReviewStatus('리뷰를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', true);
                }
            });
        }

        function startAdminQuestReviewEdit(reviewId) {
            const review = adminQuestReviews.find(function(item) {
                return Number(item.reviewId) === Number(reviewId);
            });

            if (!review) {
                return;
            }

            adminQuestEditingReviewId = Number(reviewId);
            adminQuestReviewDraft = {
                rating: Number(review.rating) || 5,
                content: review.content || ''
            };
            renderQuestReviewList(Number($('#modalQuestId').val()) || 0);
            showQuestReviewStatus('리뷰 수정 내용을 편집할 수 있습니다.', false);
        }

        function cancelAdminQuestReviewEdit() {
            adminQuestEditingReviewId = 0;
            adminQuestReviewDraft = { rating: 5, content: '' };
            renderQuestReviewList(Number($('#modalQuestId').val()) || 0);
            showQuestReviewStatus('리뷰 수정이 취소되었습니다.', false);
        }

        function setAdminQuestReviewRating(value) {
            adminQuestReviewDraft.rating = Number(value) || 1;
        }

        function setAdminQuestReviewContent(value) {
            adminQuestReviewDraft.content = value;
        }

        function submitAdminQuestReviewEdit() {
            const questId = Number($('#modalQuestId').val()) || 0;
            const reviewId = Number(adminQuestEditingReviewId) || 0;
            const rating = Number(adminQuestReviewDraft.rating) || 0;
            const content = (adminQuestReviewDraft.content || '').trim();

            if (!(questId > 0) || !(reviewId > 0)) {
                return;
            }

            if (rating < 1 || rating > 5) {
                showQuestReviewStatus('별점은 1점부터 5점까지 입력해 주세요.', true);
                return;
            }

            if (!content) {
                showQuestReviewStatus('리뷰 내용을 입력해 주세요.', true);
                return;
            }

            $.ajax({
                url: ctx + '/api/quests/' + questId + '/reviews/' + reviewId,
                type: 'PUT',
                contentType: 'application/json; charset=UTF-8',
                data: JSON.stringify({
                    rating: rating,
                    content: content
                }),
                success: function(res) {
                    adminQuestEditingReviewId = 0;
                    adminQuestReviewDraft = { rating: 5, content: '' };
                    loadQuestReviewsForEdit(questId);
                    showQuestReviewStatus(
                        res && res.message ? res.message : '리뷰가 수정되었습니다.',
                        false
                    );
                },
                error: function(xhr) {
                    const message = xhr.responseJSON && xhr.responseJSON.message
                        ? xhr.responseJSON.message
                        : '리뷰 수정에 실패했습니다. 잠시 후 다시 시도해 주세요.';
                    showQuestReviewStatus(message, true);
                }
            });
        }

        function deleteAdminQuestReview(reviewId) {
            const questId = Number($('#modalQuestId').val()) || 0;
            if (!(questId > 0) || !(Number(reviewId) > 0)) {
                return;
            }

            if (!confirm('이 리뷰를 삭제하시겠습니까?')) {
                return;
            }

            $.ajax({
                url: ctx + '/api/quests/' + questId + '/reviews/' + reviewId,
                type: 'DELETE',
                success: function(res) {
                    if (Number(adminQuestEditingReviewId) === Number(reviewId)) {
                        adminQuestEditingReviewId = 0;
                        adminQuestReviewDraft = { rating: 5, content: '' };
                    }
                    loadQuestReviewsForEdit(questId);
                    showQuestReviewStatus(
                        res && res.message ? res.message : '리뷰가 삭제되었습니다.',
                        false
                    );
                },
                error: function(xhr) {
                    const message = xhr.responseJSON && xhr.responseJSON.message
                        ? xhr.responseJSON.message
                        : '리뷰 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.';
                    showQuestReviewStatus(message, true);
                }
            });
        }

        /**
         * [통합] 회원 권한 변경 함수
         */
        function updateRole(userId, newRole) {
            if (userId === 1) {
                alert("마스터 관리자는 변경할 수 없습니다.");
                return;
            }

            if (!confirm("권한을 변경하시겠습니까?")) {
                loadAdminContent(ctx + '/admin/users');
                return;
            }

            $.ajax({
                url: ctx + '/admin/users/updateRole',
                type: 'POST',
                data: { userId: userId, role: newRole },
                success: function(res) {
                    if (res.trim() === "success") {
                        alert("권한이 변경되었습니다.");
                    } else {
                        alert("변경 실패");
                        loadAdminContent(ctx + '/admin/users');
                    }
                },
                error: function(xhr) {
                    alert("서버 통신 오류 (코드: " + xhr.status + ")");
                }
            });
        }
        
        let currentSortOrder = 'DESC'; // 기본 정렬 상태 (최신순)

        /**
         * 회원 검색 함수
         */
        function searchUser() {
            const type = $('#searchType').val();
            const keyword = $('#keyword').val();
            
            // 검색 시에도 contextPath(ctx)를 사용합니다.
            const url = ctx + "/admin/search?type=" + type + "&keyword=" + encodeURIComponent(keyword);
            loadAdminContent(url);
        }

        /**
         * 회원번호 정렬 함수 (서버 정렬 기준 유지)
         * 현재는 서버 요청 방식으로 처리합니다.
         */
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
                    alert("문의 정보를 찾을 수 없습니다.");
                },
                error: function(xhr) {
                    alert("서버 통신 오류 (" + xhr.status + ")");
                }
            });
        }

        function resetAdminInquiryModal() {
            $('#adminInquiryDetailId').val('');
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
        }

        function openAdminInquiryDetailModal(inquiryId, focusAnswer) {
            resetAdminInquiryModal();
            $('#adminInquiryModal').fadeIn(200);

            loadAdminInquiryDetail(inquiryId, function(data) {
                const status = String(data.status || '').toUpperCase();
                const isPending = status === 'PENDING';

                $('#adminInquiryDetailId').val(data.inquiryId || '');
                $('#adminInquiryDetailInquiryId').text(data.inquiryId || '-');
                $('#adminInquiryDetailUserId').text(data.userId || '-');
                $('#adminInquiryDetailStatus').text(data.status || '-');
                $('#adminInquiryDetailCreatedAt').text(data.createdAt || '-');
                $('#adminInquiryDetailAnsweredAt').text(data.answeredAt || '-');
                $('#adminInquiryDetailTitle').text(data.title || '-');
                $('#adminInquiryDetailContent').text(data.content || '-');
                $('#adminInquiryDetailAnswerContent').text(data.answerContent || '-');

                if (isPending) {
                    $('#adminInquiryModalTitle').text('문의 답변');
                    $('#adminInquiryAnswerEditor').show();
                    if (focusAnswer) {
                        $('#adminInquiryAnswerContent').trigger('focus');
                    }
                } else {
                    $('#adminInquiryModalTitle').text('문의 상세');
                    $('#adminInquiryAnswerReadBlock').show();
                }
            });
        }

        function openAdminInquiryAnswerModal(inquiryId) {
            openAdminInquiryDetailModal(inquiryId, true);
        }

        function closeAdminInquiryDetailModal() {
            $('#adminInquiryModal').fadeOut(200);
        }

        function submitAdminInquiryAnswer() {
            const inquiryId = Number($('#adminInquiryDetailId').val()) || 0;
            const answerContent = ($('#adminInquiryAnswerContent').val() || '').trim();

            if (!inquiryId) {
                alert("문의 정보를 다시 불러와주세요.");
                return;
            }
            if (!answerContent) {
                alert("답변 내용을 입력해주세요.");
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
                        alert("답변이 등록되었습니다.");
                        closeAdminInquiryDetailModal();
                        searchAdminInquiry();
                        return;
                    }
                    if (normalized === "fail:empty_answer") {
                        alert("답변 내용을 입력해주세요.");
                        return;
                    }
                    alert("답변 등록에 실패했습니다.");
                },
                error: function(xhr) {
                    alert("서버 통신 오류 (" + xhr.status + ")");
                }
            });
        }

        function sortUserList() {
            currentSortOrder = (currentSortOrder === 'DESC') ? 'ASC' : 'DESC';
            const type = $('#searchType').val();
            const keyword = $('#keyword').val();
            
            // 기존 검색 조건을 유지한 채 정렬만 변경합니다.
            const url = ctx + "/admin/users?sort=" + currentSortOrder + "&type=" + type + "&keyword=" + keyword;
            loadAdminContent(url);
        }
        
        /**
         * 회원 상태 변경 함수
         */
        function updateStatus(userId, newStatus) {
            if (userId === 1) {
                alert("마스터 관리자는 상태를 변경할 수 없습니다.");
                return;
            }

            // 확인 문구 설정
            const actionText = (newStatus === 'WITHDRAWN') ? "삭제" : "변경";
            if (!confirm("해당 회원을 정말로 " + actionText + "하시겠습니까?")) {
                return;
            }

            $.ajax({
                url: ctx + '/admin/users/updateStatus',
                type: 'POST',
                data: { 
                    userId: userId, 
                    status: newStatus 
                },
                success: function(res) {
                    if (res.trim() === "success") {
                        alert("상태가 정상적으로 변경되었습니다.");
                        
                        // 현재 검색어/정렬 조건을 유지한 채 다시 로드합니다.
                        const type = $('#searchType').val();
                        const keyword = $('#keyword').val();
                        // 정렬 아이콘 상태로 현재 정렬을 확인합니다.
                        const sort = $('#sortIcon').hasClass('fa-sort-up') ? 'ASC' : 'DESC';
                        
                        const url = ctx + "/admin/search?type=" + type + "&keyword=" + encodeURIComponent(keyword) + "&sort=" + sort;
                        loadAdminContent(url);
                    } else {
                        alert("변경에 실패했습니다.");
                    }
                },
                error: function(xhr) {
                    alert("서버 통신 오류가 발생했습니다.");
                }
            });
        }
        
        function updateQuestStatus(questId, status) {
            const msg = status === 'DELETED'
                ? "퀘스트를 삭제하시겠습니까?"
                : `퀘스트 상태를 ${status}(으)로 변경하시겠습니까?`;
            
            if (!confirm(msg)) return;

            $.ajax({
                url: ctx + "/admin/quests/updateStatus",
                type: "POST",
                data: { questId: questId, status: status },
                success: function(res) {
                    if (res === "success") {
                        alert("상태가 반영되었습니다.");
                        loadAdminContent(ctx + "/admin/quests");
                    } else {
                        alert("상태 변경에 실패했습니다.");
                    }
                },
                error: function(xhr) {
                    alert("서버 통신 오류 (" + xhr.status + ")");
                }
            });
        }
        

        /**
         * [기존 함수 보완] 등록/수정 통합 제출
         */
        function updateQuestStatus(questId, status, actionType) {
            const normalizedStatus = String(status || '').toUpperCase();
            const currentFilterStatus = String($('#filterStatus').val() || '').toUpperCase();
            const clickEvent = typeof event !== 'undefined' ? event : window.event;
            const $sourceButton = clickEvent
                ? $(clickEvent.currentTarget || clickEvent.target || clickEvent.srcElement)
                : $();
            const $sourceSection = $sourceButton.closest('.adm-q-section');

            let resolvedAction = String(actionType || '').toLowerCase();
            if (!resolvedAction) {
                if (normalizedStatus === 'DELETED') {
                    resolvedAction = 'delete';
                } else if ($sourceSection.hasClass('adm-q-section-deleted') || currentFilterStatus === 'DELETED') {
                    resolvedAction = 'restore';
                } else if (normalizedStatus === 'INACTIVE') {
                    resolvedAction = 'deactivate';
                } else {
                    resolvedAction = 'activate';
                }
            }

            let confirmMessage = '\uD018\uC2A4\uD2B8 \uC0C1\uD0DC\uB97C \uBCC0\uACBD\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?';
            let successMessage = '\uD018\uC2A4\uD2B8 \uC0C1\uD0DC\uAC00 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.';
            let failMessage = '\uD018\uC2A4\uD2B8 \uC0C1\uD0DC \uBCC0\uACBD\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.';

            if (resolvedAction === 'delete') {
                confirmMessage = '\uD018\uC2A4\uD2B8\uB97C \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?';
                successMessage = '\uD018\uC2A4\uD2B8\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.';
                failMessage = '\uD018\uC2A4\uD2B8 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.';
            } else if (resolvedAction === 'restore') {
                confirmMessage = '\uC0AD\uC81C\uB41C \uD018\uC2A4\uD2B8\uB97C \uBCF5\uAD6C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?';
                successMessage = '\uD018\uC2A4\uD2B8\uAC00 \uBCF5\uAD6C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.';
                failMessage = '\uD018\uC2A4\uD2B8 \uBCF5\uAD6C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.';
            } else if (resolvedAction === 'deactivate') {
                confirmMessage = '\uD018\uC2A4\uD2B8\uB97C \uBE44\uD65C\uC131\uD654\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?';
                successMessage = '\uD018\uC2A4\uD2B8\uAC00 \uBE44\uD65C\uC131\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4.';
                failMessage = '\uD018\uC2A4\uD2B8 \uBE44\uD65C\uC131\uD654\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.';
            } else if (resolvedAction === 'activate') {
                confirmMessage = '\uD018\uC2A4\uD2B8\uB97C \uD65C\uC131\uD654\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?';
                successMessage = '\uD018\uC2A4\uD2B8\uAC00 \uD65C\uC131\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4.';
                failMessage = '\uD018\uC2A4\uD2B8 \uD65C\uC131\uD654\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.';
            }

            if (!confirm(confirmMessage)) {
                return;
            }

            $.ajax({
                url: ctx + "/admin/quests/updateStatus",
                type: "POST",
                data: { questId: questId, status: normalizedStatus },
                success: function(res) {
                    if (res === "success") {
                        alert(successMessage);
                        searchQuest();
                    } else {
                        alert(failMessage);
                    }
                },
                error: function(xhr) {
                    alert("서버 통신 오류 (" + xhr.status + ")");
                }
            });
        }

        function submitQuest() {
            const form = $('#questForm')[0];
            const questId = $('#modalQuestId').val();
            const timeLimitEnabled = $('#m_time_limit_enabled').is(':checked');
            const timeLimitValue = ($('#m_time_limit').val() || '').trim();
            
            if (timeLimitEnabled) {
                if (!timeLimitValue) {
                    alert("제한기간을 사용하려면 제한 시간을 입력해 주세요.");
                    $('#m_time_limit').focus();
                    return;
                }
                if (Number(timeLimitValue) <= 0) {
                    alert("제한 시간은 1분 이상이어야 합니다.");
                    $('#m_time_limit').focus();
                    return;
                }
            } else {
                $('#m_time_limit').val('');
            }

            syncQuestLocationsInput();

            const url = (questId === "0") ? ctx + "/admin/quests/register" : ctx + "/admin/quests/update";
            
            const formData = $(form).serialize();

            $.ajax({
                url: url,
                type: "POST",
                data: formData,
                success: function(res) {
                    if (res.trim() === "success") {
                        alert(questId === "0" ? "퀘스트가 등록되었습니다." : "퀘스트가 수정되었습니다.");
                        closeQuestModal();
                        loadAdminContent(ctx + "/admin/quests");
                    } else {
                        if (res.trim() === "fail:title_empty") {
                            alert("퀘스트 제목을 입력해 주세요.");
                        } else if (res.trim() === "fail:description_empty") {
                            alert("퀘스트 설명을 입력해 주세요.");
                        } else if (res.trim() === "fail:invalid_id") {
                            alert("수정할 퀘스트 정보가 올바르지 않습니다.");
                        } else if (res.trim() === "fail:locations_invalid") {
                            alert("선택한 장소 정보가 올바르지 않습니다. 다시 선택해 주세요.");
                        } else if (res.trim() === "fail:location_name_empty") {
                            alert("선택한 장소명 정보가 비어 있습니다.");
                        } else if (res.trim() === "fail:location_address_empty") {
                            alert("선택한 장소 주소 정보가 비어 있습니다.");
                        } else if (res.trim() === "fail:location_coordinate_empty") {
                            alert("선택한 장소 좌표 정보가 비어 있습니다.");
                        } else if (res.trim() === "fail:location_tables_missing") {
                            alert("퀘스트 장소 저장에 필요한 테이블 또는 시퀀스를 찾지 못했습니다. LQ_LOCATION, LQ_QUEST_LOCATION, SEQ_LQ_LOCATION_PK, SEQ_LQ_QUEST_LOCATION_PK를 확인해 주세요.");
                        } else if (res.trim() === "fail:location_reference_missing") {
                            alert("선택한 장소가 현재 DB에 없어 저장할 수 없습니다. 장소를 다시 선택해 주세요.");
                        } else if (res.trim() === "fail:location_conflict") {
                            alert("선택한 장소 목록에 중복되거나 순서가 충돌하는 항목이 있습니다. 장소 목록을 다시 확인해 주세요.");
                        } else {
                            alert("저장에 실패했습니다: " + res.trim());
                        }
                    }
                },
                error: function(xhr) {
                    alert("서버 통신 오류 (" + xhr.status + ")");
                }
            });
        }

        /* --- admin.jsp 스크립트 영역 수정 --- */

        /**
         * [추가/수정] 퀘스트 모달 열기
         * 수정 모드와 등록 모드를 모두 초기화합니다.
         */
        function openQuestModal() {
            $('#questForm')[0].reset();
            $('#modalQuestId').val("0");
            $('#modalQuestStatus').val("ACTIVE");
            $('#m_time_limit_enabled').prop('checked', false);
            $('#m_time_limit').val('').prop('disabled', true);
            $('#questLocationKeyword').val('');
            $('#modalTitleText').html('<i class="fas fa-plus-circle"></i> 새 퀘스트 등록');
            $('#modalSubmitBtn').text('등록하기');
            resetQuestLocationState();
            resetQuestReviewState();
            showQuestLocationStatus('등록된 장소 목록을 불러올 준비가 되었습니다.', false);
            $('#questModal').fadeIn(200, function() {
                searchQuestLocations();
            });
        }

        /**
         * 수정 모달 열기 (기존 값 채우기)
         */
        function editQuestModal(data) {
            $('#modalTitleText').html('<i class="fas fa-edit"></i> 퀘스트 수정');
            $('#modalSubmitBtn').text('수정하기');
            $('#modalQuestId').val(data.id); 
            $('#modalQuestStatus').val(data.status || 'ACTIVE');
            $('#m_title').val(data.title);
            $('#m_exp').val(data.exp);
            $('#m_point').val(data.point);
            $('#m_desc').val(data.desc);
            if (data.timeLimit) {
                $('#m_time_limit_enabled').prop('checked', true);
                $('#m_time_limit').val(data.timeLimit).prop('disabled', false);
            } else {
                $('#m_time_limit_enabled').prop('checked', false);
                $('#m_time_limit').val('').prop('disabled', true);
            }
            $('#questLocationKeyword').val('');
            resetQuestLocationState();
            resetQuestReviewState();
            $('#questModal').fadeIn(200, function() {
                searchQuestLocations();
                loadQuestLocationsForEdit(data.id);
                loadQuestReviewsForEdit(data.id);
            });
        }

        function openQuestEditFromCard(cardBody) {
            const $card = $(cardBody);
            const $questCard = $card.closest('.adm-q-card');
            editQuestModal({
                id: $card.data('id'),
                title: $.trim($card.find('.adm-q-card-title').text()),
                exp: $card.data('exp'),
                point: $card.data('point'),
                desc: $.trim($card.find('.adm-q-card-desc').text()),
                timeLimit: $card.data('time-limit'),
                status: $card.data('status')
            });
        }

        function toggleQuestTimeLimitInput() {
            const enabled = $('#m_time_limit_enabled').is(':checked');
            $('#m_time_limit').prop('disabled', !enabled);
            if (!enabled) {
                $('#m_time_limit').val('');
            } else {
                $('#m_time_limit').focus();
            }
        }

        /**
         * 모달을 닫을 때 초기화
         */
        function closeQuestModal() {
            $('#questModal').fadeOut(200);
            setTimeout(function() {
                $('#questForm')[0].reset();
                $('#modalQuestId').val("0");
                $('#modalQuestStatus').val("ACTIVE");
                $('#m_time_limit_enabled').prop('checked', false);
                $('#m_time_limit').val('').prop('disabled', true);
                $('#questLocationKeyword').val('');
                resetQuestLocationState();
                resetQuestReviewState();
                showQuestLocationStatus('', false);
                showQuestReviewStatus('', false);
                $('#modalTitleText').html('<i class="fas fa-plus-circle"></i> 새 퀘스트 등록');
                $('#modalSubmitBtn').text('등록하기');
            }, 200);
        }
        
        /**
         * 퀘스트 검색 및 필터
         */
        function searchQuest() {
            const status = $('#filterStatus').val(); // 상태 선택값
            const keyword = $('#searchQuestName').val(); // 검색어
            
            // URL 파라미터 조합
            const url = ctx + "/admin/quests?status=" + status + "&keyword=" + encodeURIComponent(keyword);
            
            // 공통 콘텐츠 로더 호출
            loadAdminContent(url);
        }
        
        /* --- Reward Item 관련 JS --- */

        function searchItem() {
            const status = $('#filterItemStatus').val();
            const keyword = $('#searchItemName').val();
            loadAdminContent(ctx + "/admin/shop?status=" + status + "&keyword=" + encodeURIComponent(keyword));
        }

        function openItemModal() {
            $('#modalItemId').val("0");
            $('#itemForm')[0].reset();
            $('#itemModalTitleText').html('<i class="fas fa-plus-circle"></i> 새 리워드 등록');
            $('#itemSubmitBtn').text('등록하기');
            $('#itemModal').fadeIn(200);
        }

        function editItemModal(data) {
            $('#itemModalTitleText').html('<i class="fas fa-edit"></i> 리워드 정보 수정');
            $('#itemSubmitBtn').text('수정하기');
            
            $('#modalItemId').val(data.id);
            $('#i_name').val(data.name);
            $('#i_price').val(data.price);
            $('#i_stock').val(data.stock);
            $('#i_status').val(data.status);
            $('#i_desc').val(data.desc);
            
            $('#itemModal').fadeIn(200);
        }

        function submitItem() {
            const formData = $('#itemForm').serialize();
            $.ajax({
                url: ctx + "/admin/shop/save",
                type: "POST",
                data: formData,
                success: function(res) {
                    if (res.trim() === "success") {
                        alert("저장되었습니다.");
                        closeItemModal();
                        loadAdminContent(ctx + "/admin/shop");
                    } else { alert("실패했습니다."); }
                }
            });
        }

        function updateItemStatus(itemId, status) {
            if(!confirm("아이템 상태를 변경하시겠습니까?")) return;
            $.ajax({
                url: ctx + "/admin/shop/updateStatus",
                type: "POST",
                data: { itemId: itemId, status: status },
                success: function(res) {
                    if(res.trim() === "success") {
                        loadAdminContent(ctx + "/admin/shop");
                    }
                }
            });
        }

        function closeItemModal() {
            $('#itemModal').fadeOut(200);
            // 애니메이션이 끝난 뒤 데이터를 초기화합니다.
            setTimeout(function() {
                $('#itemForm')[0].reset();
                $('#modalItemId').val("0");
                $('#itemModalTitleText').html('<i class="fas fa-plus-circle"></i> 새 리워드 등록');
                $('#itemSubmitBtn').text('등록하기');
            }, 200);
        }
        
        /* --- Business 관련 JS --- */

        function searchBusiness() {
            const keyword = $('#searchBusinessKeyword').val() || '';
            loadAdminContent(ctx + "/admin/store-info?keyword=" + encodeURIComponent(keyword));
        }

        function loadBusinessDetail(businessId, onSuccess) {
            $.ajax({
                url: ctx + "/admin/store-info/detail",
                type: "GET",
                dataType: "json",
                data: { businessId: businessId },
                success: function(res) {
                    if (res) {
                        onSuccess(res);
                    } else {
                        alert("비즈니스 상세 정보를 찾을 수 없습니다.");
                    }
                },
                error: function(xhr) {
                    alert("서버 통신 오류 (" + xhr.status + ")");
                }
            });
        }

        function normalizeBusinessOperationStatus(value) {
            const rawStatus = value && typeof value === 'object'
                ? value.operationStatus
                : value;
            const normalizedStatus = String(rawStatus || '').toUpperCase();

            if (normalizedStatus === 'ACTIVE' || normalizedStatus === 'INACTIVE') {
                return normalizedStatus;
            }

            return 'UNKNOWN';
        }

        function getBusinessOperationStatusText(status) {
            if (status === 'ACTIVE') {
                return '\uC6B4\uC601\uC911';
            }
            if (status === 'INACTIVE') {
                return '\uC6B4\uC601\uC911\uC9C0';
            }
            return '\uC0C1\uD0DC\uD655\uC778\uBD88\uAC00';
        }

        function syncBusinessOperationUi(value) {
            const status = normalizeBusinessOperationStatus(value);
            const isActive = status === 'ACTIVE';
            const $statusBadge = $('#detailOperationStatus');
            const $qrButton = $('#businessDetailQrBtn');

            $statusBadge
                .removeClass('ACTIVE INACTIVE UNKNOWN')
                .addClass(status)
                .text(getBusinessOperationStatusText(status));

            $qrButton
                .attr('data-operation-status', status)
                .prop('disabled', !isActive)
                .text(isActive ? '\u0051\u0052 \uBCF4\uAE30' : getBusinessOperationStatusText(status));
        }

        function changeBusinessOperation(businessId, currentStatus) {
            const normalizedCurrentStatus = normalizeBusinessOperationStatus(currentStatus);
            if (!(businessId > 0)) {
                alert('\uB9E4\uC7A5 \uC815\uBCF4\uB97C \uB2E4\uC2DC \uD655\uC778\uD574 \uC8FC\uC138\uC694.');
                return;
            }

            if (normalizedCurrentStatus === 'UNKNOWN') {
                alert('\uB9E4\uC7A5 \uC6B4\uC601 \uC0C1\uD0DC\uB97C \uD655\uC778\uD560 \uC218 \uC5C6\uC5B4 \uCC98\uB9AC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.');
                return;
            }

            const shouldSuspend = normalizedCurrentStatus === 'ACTIVE';
            const endpoint = shouldSuspend ? '/admin/store-info/suspend' : '/admin/store-info/resume';
            const confirmMessage = shouldSuspend
                ? '\uC774 \uB9E4\uC7A5\uC744 \uC6B4\uC601\uC911\uC9C0\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?'
                : '\uC774 \uB9E4\uC7A5\uC758 \uC6B4\uC601\uC744 \uC7AC\uAC1C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?';
            const successMessage = shouldSuspend
                ? '\uB9E4\uC7A5\uC744 \uC6B4\uC601\uC911\uC9C0\uD588\uC2B5\uB2C8\uB2E4.'
                : '\uB9E4\uC7A5 \uC6B4\uC601\uC744 \uC7AC\uAC1C\uD588\uC2B5\uB2C8\uB2E4.';
            const failMessage = shouldSuspend
                ? '\uB9E4\uC7A5 \uC6B4\uC601\uC911\uC9C0\uB97C \uCC98\uB9AC\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.'
                : '\uB9E4\uC7A5 \uC6B4\uC601 \uC7AC\uAC1C\uB97C \uCC98\uB9AC\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.';

            if (!confirm(confirmMessage)) {
                return;
            }

            $.ajax({
                url: ctx + endpoint,
                type: "POST",
                dataType: "json",
                data: { businessId: businessId },
                success: function(res) {
                    const result = res && res.result ? res.result : 'error';
                    if (result === 'success') {
                        if (Number($('#businessDetailQrBtn').attr('data-business-id')) === businessId) {
                            syncBusinessOperationUi(res);
                        }
                        alert(successMessage);
                        loadBusinessAdmin('business');
                        return;
                    }

                    alert(res && res.message ? res.message : failMessage);
                },
                error: function(xhr) {
                    alert("서버 통신 오류 (" + xhr.status + ")");
                }
            });
        }

        function openBusinessModal(businessId) {
            if ($('#businessForm').length === 0) return;

            $('#businessForm')[0].reset();
            $('#businessId').val("0");
            $('#businessModalTitleText').html('<i class="fas fa-plus-circle"></i> 새 비즈니스 등록');
            $('#businessSubmitBtn').text('등록하기');

            if (!businessId) {
                $('#businessModal').fadeIn(200);
                return;
            }

            loadBusinessDetail(businessId, function(data) {
                $('#businessModalTitleText').html('<i class="fas fa-edit"></i> 비즈니스 정보 수정');
                $('#businessSubmitBtn').text('수정하기');
                $('#businessId').val(data.businessId || 0);
                $('#businessUserId').val(data.userId || '');
                $('#businessName').val(data.businessName || '');
                $('#businessZipCode').val(data.zipCode || '');
                $('#businessAddress').val(data.address || '');
                $('#businessAddressDetail').val(data.addressDetail || '');
                $('#businessPhone').val(data.phone || '');
                $('#businessDescription').val(data.description || '');
                $('#businessModal').fadeIn(200);
            });
        }

        function closeBusinessModal() {
            $('#businessModal').fadeOut(200);
            setTimeout(function() {
                if ($('#businessForm').length > 0) {
                    $('#businessForm')[0].reset();
                }
                $('#businessId').val("0");
                $('#businessModalTitleText').html('<i class="fas fa-plus-circle"></i> 새 비즈니스 등록');
                $('#businessSubmitBtn').text('등록하기');
            }, 200);
        }

        function submitBusiness() {
            const formData = $('#businessForm').serialize();

            $.ajax({
                url: ctx + "/admin/store-info/save",
                type: "POST",
                data: formData,
                success: function(res) {
                    const result = res.trim();

                    if (result === "success") {
                        alert("저장되었습니다.");
                        closeBusinessModal();
                        loadAdminContent(ctx + "/admin/store-info");
                        return;
                    }

                    if (result === "fail:business_name_empty") {
                        alert("비즈니스명을 입력해 주세요.");
                        return;
                    }
                    if (result === "fail:zip_code_empty") {
                        alert("우편번호를 입력해 주세요.");
                        return;
                    }
                    if (result === "fail:address_empty") {
                        alert("주소를 입력해 주세요.");
                        return;
                    }
                    if (result === "fail:user_id_invalid") {
                        alert("회원 번호를 올바르게 입력해 주세요.");
                        return;
                    }

                    alert("저장에 실패했습니다.");
                },
                error: function(xhr) {
                    alert("서버 통신 오류 (" + xhr.status + ")");
                }
            });
        }

        function viewBusinessDetail(businessId) {
            loadBusinessDetail(businessId, function(data) {
                $('#detailBusinessId').text(data.businessId || '-');
                $('#detailUserId').text(data.userId || '-');
                $('#detailBusinessName').text(data.businessName || '-');
                $('#detailZipCode').text(data.zipCode || '-');
                $('#detailAddress').text(data.address || '-');
                $('#detailAddressDetail').text(data.addressDetail || '-');
                $('#detailPhone').text(data.phone || '-');
                $('#detailDescription').text(data.description || '-');
                $('#detailCreatedAt').text(data.createdAt || '-');
                $('#businessDetailQrBtn').attr('data-business-id', data.businessId || 0);
                syncBusinessOperationUi(data);
                resetBusinessAuthSummary();
                showBusinessDetailTab('basic');
                resetBusinessQrModal();
                $('#businessDetailModal').fadeIn(200);
            });
        }

        function closeBusinessDetailModal() {
            $('#businessDetailQrBtn').attr('data-business-id', 0);
            syncBusinessOperationUi('UNKNOWN');
            resetBusinessAuthSummary();
            showBusinessDetailTab('basic');
            closeBusinessQrModal();
            $('#businessDetailModal').fadeOut(200);
        }

        function formatBusinessAuthAmount(value) {
            const numericValue = Number(value || 0);
            return numericValue.toLocaleString('ko-KR') + '원';
        }

        function formatBusinessAuthDate(value) {
            if (!value) {
                return '-';
            }

            const parsed = new Date(value);
            if (Number.isNaN(parsed.getTime())) {
                return value;
            }

            const year = parsed.getFullYear();
            const month = String(parsed.getMonth() + 1).padStart(2, '0');
            const day = String(parsed.getDate()).padStart(2, '0');
            const hours = String(parsed.getHours()).padStart(2, '0');
            const minutes = String(parsed.getMinutes()).padStart(2, '0');
            return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
        }

        function resetBusinessAuthSummary() {
            businessDetailAuthLoadedFor = 0;
            businessDetailAuthLoading = false;

            $('#businessAuthStatus')
                .removeClass('is-error')
                .text('비지니스 정보를 확인하려면 탭을 선택해 주세요.');
            $('#detailAuthTotalCount').text('0');
            $('#detailAuthQrCount').text('0');
            $('#detailAuthReceiptCount').text('0');
            $('#detailAuthPaymentAmount').text('0원');
            $('#detailAuthSettlementAmount').text('0원');
            $('#detailAuthLastAt').text('-');
            $('#detailAuthUserCount').text('0');
            $('#detailAuthLocationCount').text('0');
        }

        function applyBusinessAuthSummary(summary) {
            const normalizedSummary = summary || {};
            $('#detailAuthTotalCount').text(Number(normalizedSummary.totalAuthCount || 0).toLocaleString('ko-KR'));
            $('#detailAuthQrCount').text(Number(normalizedSummary.qrAuthCount || 0).toLocaleString('ko-KR'));
            $('#detailAuthReceiptCount').text(Number(normalizedSummary.receiptAuthCount || 0).toLocaleString('ko-KR'));
            $('#detailAuthPaymentAmount').text(formatBusinessAuthAmount(normalizedSummary.totalPaymentAmount));
            $('#detailAuthSettlementAmount').text(formatBusinessAuthAmount(normalizedSummary.totalSettlementAmount));
            $('#detailAuthLastAt').text(formatBusinessAuthDate(normalizedSummary.lastAuthAt));
            $('#detailAuthUserCount').text(Number(normalizedSummary.uniqueUserCount || 0).toLocaleString('ko-KR'));
            $('#detailAuthLocationCount').text(Number(normalizedSummary.uniqueLocationCount || 0).toLocaleString('ko-KR'));

            if (Number(normalizedSummary.totalAuthCount || 0) > 0) {
                $('#businessAuthStatus')
                    .removeClass('is-error')
                    .text('LQ_BUSINESS_AUTH_LOG 기준 인증 요약 정보입니다.');
            } else {
                $('#businessAuthStatus')
                    .removeClass('is-error')
                    .text('등록된 인증 이력이 없습니다.');
            }
        }

        function loadBusinessAuthSummary(businessId) {
            if (!(businessId > 0) || businessDetailAuthLoading) {
                return;
            }

            businessDetailAuthLoading = true;
            $('#businessAuthStatus')
                .removeClass('is-error')
                .text('비지니스 정보를 불러오는 중입니다.');

            $.ajax({
                url: ctx + "/admin/store-info/auth-detail",
                type: "GET",
                dataType: "json",
                data: { businessId: businessId },
                success: function(res) {
                    businessDetailAuthLoadedFor = businessId;
                    applyBusinessAuthSummary(res ? res.summary : null);
                },
                error: function(xhr) {
                    let message = '비지니스 정보를 불러오지 못했습니다.';
                    if (xhr && xhr.status === 404) {
                        message = '해당 매장 정보를 찾을 수 없습니다.';
                    }
                    $('#businessAuthStatus')
                        .addClass('is-error')
                        .text(message);
                },
                complete: function() {
                    businessDetailAuthLoading = false;
                }
            });
        }

        function showBusinessDetailTab(tabName) {
            $('[data-detail-tab]').removeClass('is-active');
            $('[data-detail-panel]').removeClass('is-active');
            $('[data-detail-tab="' + tabName + '"]').addClass('is-active');
            $('[data-detail-panel="' + tabName + '"]').addClass('is-active');

            if (tabName !== 'auth') {
                return;
            }

            const businessId = Number($('#businessDetailQrBtn').attr('data-business-id')) || 0;
            if (!(businessId > 0)) {
                $('#businessAuthStatus')
                    .addClass('is-error')
                    .text('매장 기본 정보를 먼저 확인해 주세요.');
                return;
            }

            if (businessDetailAuthLoadedFor === businessId) {
                return;
            }

            loadBusinessAuthSummary(businessId);
        }

        function deleteBusiness(businessId) {
            if (!confirm("정말로 비즈니스를 삭제하시겠습니까?")) return;

            $.ajax({
                url: ctx + "/admin/store-info/delete",
                type: "POST",
                data: { businessId: businessId },
                success: function(res) {
                    if (res.trim() === "success") {
                        alert("삭제되었습니다.");
                        loadAdminContent(ctx + "/admin/store-info");
                    } else {
                        alert("삭제에 실패했습니다.");
                    }
                },
                error: function(xhr) {
                    alert("서버 통신 오류 (" + xhr.status + ")");
                }
            });
        }

        function loadBusinessAdmin(tab) {
            const activeTab = tab || 'inquiry';
            const businessKeyword = $('#searchBusinessKeyword').val() || '';
            const inquiryKeyword = $('#searchInquiryKeyword').val() || '';
            const inquiryStatus = $('#filterInquiryStatus').val() || '';

            const url = ctx + "/admin/store-info?tab=" + encodeURIComponent(activeTab)
                + "&businessKeyword=" + encodeURIComponent(businessKeyword)
                + "&inquiryKeyword=" + encodeURIComponent(inquiryKeyword)
                + "&inquiryStatus=" + encodeURIComponent(inquiryStatus);

            loadAdminContent(url);
        }

        function showBusinessTab(tabName) {
            $('.adm-b-tab').removeClass('active');
            $('.adm-b-panel').removeClass('active');
            $('.adm-b-tab[data-tab="' + tabName + '"]').addClass('active');
            $('.adm-b-panel[data-panel="' + tabName + '"]').addClass('active');
        }

        function searchBusiness() { loadBusinessAdmin('business'); }
        function searchBusinessInquiry() { loadBusinessAdmin('inquiry'); }


function loadBusinessInquiryDetail(inquiryId, onSuccess) {
    $.ajax({
        url: ctx + "/admin/store-info/inquiry/detail",
        type: "GET",
        dataType: "json",
        data: { inquiryId: inquiryId },
        success: function(res) {
            if (res) onSuccess(res);
            else alert("문의 정보를 찾을 수 없습니다.");
        },
        error: function(xhr) {
            alert("서버 통신 오류 (" + xhr.status + ")");
        }
    });
}

function openBusinessModal(businessId) {
    if ($('#businessForm').length === 0) return;
    $('#businessForm')[0].reset();
    $('#businessId').val("0");
    $('#businessInquiryId').val("");
    $('#businessModalTitleText').html('<i class="fas fa-plus-circle"></i> 매장 등록');
    $("#businessSubmitBtn").text('등록');
    if (!businessId) {
        $('#businessModal').fadeIn(200);
        return;
    }
    loadBusinessDetail(businessId, function(data) {
        $('#businessModalTitleText').html('<i class="fas fa-edit"></i> 매장 수정');
        $('#businessSubmitBtn').text('수정');
        $('#businessId').val(data.businessId || 0);
        $('#businessUserId').val(data.userId || '');
        $('#businessName').val(data.businessName || '');
        $('#businessZipCode').val(data.zipCode || '');
        $('#businessAddress').val(data.address || '');
        $('#businessAddressDetail').val(data.addressDetail || '');
        $('#businessPhone').val(data.phone || '');
        $('#businessDescription').val(data.description || '');
        $('#businessModal').fadeIn(200);
    });
}

function openBusinessContractModal(inquiryId, userId) {
    if ($('#businessForm').length === 0) return;
    $('#businessForm')[0].reset();
    $('#businessId').val("0");
    $('#businessInquiryId').val(inquiryId || '');
    $('#businessUserId').val(userId || '');
    $('#business-inquiry-reject-' + inquiryId).prop('disabled', true);
    $('#businessModalTitleText').html('<i class="fas fa-file-signature"></i> 계약 완료 등록');
    $("#businessSubmitBtn").text('계약 등록');
    loadBusinessInquiryDetail(inquiryId, function(data) {
        console.log('business inquiry detail', data);
        $('#businessName').val(data.title || '');
        $('#businessZipCode').val(data.zipCode || '');
        $('#businessAddress').val(data.address || '');
        $('#businessAddressDetail').val(data.addressDetail || '');
        $('#businessPhone').val(data.phone || '');
        $('#businessDescription').val(data.content || '');
        $('#businessModal').fadeIn(200);
    });
}

function closeBusinessModal() {
    $('#businessModal').fadeOut(200);
    setTimeout(function() {
        if ($('#businessForm').length > 0) $('#businessForm')[0].reset();
        $('#businessId').val("0");
        $('#businessInquiryId').val("");
        $('#businessModalTitleText').html('<i class="fas fa-plus-circle"></i> 매장 등록');
        $("#businessSubmitBtn").text('등록');
    }, 200);
}

function submitBusiness() {
    const inquiryId = $('#businessInquiryId').val() || '';
    $.ajax({
        url: ctx + "/admin/store-info/save",
        type: "POST",
        data: $('#businessForm').serialize(),
        success: function(res) {
            if (res.trim() === "success") {
                if (inquiryId) {
                    const $status = $('#business-inquiry-status-' + inquiryId);
                    const $actions = $('#business-inquiry-actions-' + inquiryId);
                    if ($status.length) {
                        $status
                            .removeClass('PENDING IN_PROGRESS ANSWERED CLOSED')
                            .addClass('ANSWERED')
                            .text('ANSWERED');
                    }
                    if ($actions.length) {
                        $actions.addClass('is-answered');
                        $actions.html(
                            '<button type="button" class="adm-b-btn-view" onclick="viewBusinessInquiryDetail(' + inquiryId + ')">상세</button>'
                        );
                    }
                }
                closeBusinessModal();
                showBusinessTab('business');
                loadBusinessAdmin('business');
            } else {
                if (res.trim() === "fail:business_name_empty") {
                    alert("매장명을 입력해 주세요.");
                } else if (res.trim() === "fail:zip_code_empty") {
                    alert("우편번호를 입력해 주세요.");
                } else if (res.trim() === "fail:address_empty") {
                    alert("주소를 입력해 주세요.");
                } else if (res.trim() === "fail:user_id_invalid") {
                    alert("회원번호를 확인해 주세요.");
                } else {
                    alert(res.trim());
                }
            }
        },
        error: function(xhr) {
            alert("서버 통신 오류 (" + xhr.status + ")");
        }
    });
}

function deleteBusiness(businessId) {
    if (!confirm("매장을 삭제하시겠습니까?")) return;
    $.ajax({
        url: ctx + "/admin/store-info/delete",
        type: "POST",
        data: { businessId: businessId },
        success: function(res) {
            if (res.trim() === "success") loadBusinessAdmin('business');
            else alert("삭제에 실패했습니다.");
        },
        error: function(xhr) {
            alert("서버 통신 오류 (" + xhr.status + ")");
        }
    });
}

function deleteBusiness(businessId) {
    alert('\uB9E4\uC7A5 \uC644\uC804\uC0AD\uC81C\uB294 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC6B4\uC601\uC911\uC9C0 \uB610\uB294 \uC6B4\uC601\uC7AC\uAC1C \uAE30\uB2A5\uC744 \uC0AC\uC6A9\uD574 \uC8FC\uC138\uC694.');
}

        function viewBusinessInquiryDetail(inquiryId) {
            loadBusinessInquiryDetail(inquiryId, function(data) {
                $('#detailInquiryId').text(data.inquiryId || '-');
                $('#detailInquiryUserId').text(data.userId || '-');
                $('#detailInquiryTitle').text(data.title || '-');
                $('#detailInquiryStatus').text(data.status || '-');
                $('#detailInquiryContent').text(data.content || '-');
                $('#detailInquiryCreatedAt').text(data.createdAt || '-');
                $('#businessInquiryDetailModal').fadeIn(200);
            });
        }

        function resetBusinessQrModal() {
            $('#businessQrStatus')
                .removeClass('is-error')
                .text('\u0051\u0052 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.');
            $('#businessQrBusinessName').text('-');
            $('#businessQrLocationName').text('-');
            $('#businessQrAddress').text('-');
            $('#businessQrAuthKey').text('-');
            $('#businessQrImage')
                .removeClass('is-ready')
                .attr('src', '');
        }

        function openBusinessQrModal() {
            const businessId = Number($('#businessDetailQrBtn').attr('data-business-id')) || 0;
            if (!(businessId > 0)) {
                alert('\uB9E4\uC7A5 \uC0C1\uC138 \uC815\uBCF4\uB97C \uBA3C\uC800 \uD655\uC778\uD574 \uC8FC\uC138\uC694.');
                return;
            }

            resetBusinessQrModal();
            $('#businessQrModal').fadeIn(200);

            $.ajax({
                url: ctx + "/admin/store-info/qr",
                type: "GET",
                dataType: "json",
                data: { businessId: businessId },
                success: function(res) {
                    if (!res || !res.imageUrl) {
                        $('#businessQrStatus')
                            .addClass('is-error')
                            .text('\u0051\u0052 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.');
                        return;
                    }

                    const addressText = [res.address || '', res.addressDetail || '']
                        .filter(function(value) { return !!value; })
                        .join(' ');

                    $('#businessQrStatus')
                        .removeClass('is-error')
                        .text('\uB9E4\uC7A5 \u0051\u0052 \uCF54\uB4DC\uB97C \uD655\uC778\uD558\uC138\uC694.');
                    $('#businessQrBusinessName').text(res.businessName || '-');
                    $('#businessQrLocationName').text(res.locationName || '-');
                    $('#businessQrAddress').text(addressText || '-');
                    $('#businessQrAuthKey').text(res.qrAuthKey || '-');
                    $('#businessQrImage')
                        .addClass('is-ready')
                        .attr('src', res.imageUrl + '&_ts=' + Date.now());
                },
                error: function(xhr) {
                    let message = '\u0051\u0052 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.';
                    if (xhr && xhr.status === 404) {
                        message = '\uD574\uB2F9 \uB9E4\uC7A5 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.';
                    }
                    $('#businessQrStatus')
                        .addClass('is-error')
                        .text(message);
                }
            });
        }

        function openBusinessQrModal() {
            const businessId = Number($('#businessDetailQrBtn').attr('data-business-id')) || 0;
            const operationStatus = normalizeBusinessOperationStatus($('#businessDetailQrBtn').attr('data-operation-status'));
            if (!(businessId > 0)) {
                alert('\uB9E4\uC7A5 \uC0C1\uC138 \uC815\uBCF4\uB97C \uBA3C\uC800 \uD655\uC778\uD574 \uC8FC\uC138\uC694.');
                return;
            }
            if (operationStatus !== 'ACTIVE') {
                alert(
                    operationStatus === 'INACTIVE'
                        ? '\uC6B4\uC601\uC911\uC9C0\uB41C \uB9E4\uC7A5\uC740 \u0051\u0052\uC744 \uBCFC \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.'
                        : '\uB9E4\uC7A5 \uC6B4\uC601 \uC0C1\uD0DC\uB97C \uBA3C\uC800 \uD655\uC778\uD574 \uC8FC\uC138\uC694.'
                );
                return;
            }

            resetBusinessQrModal();
            $('#businessQrModal').fadeIn(200);

            $.ajax({
                url: ctx + "/admin/store-info/qr",
                type: "GET",
                dataType: "json",
                data: { businessId: businessId },
                success: function(res) {
                    if (!res || !res.imageUrl) {
                        $('#businessQrStatus')
                            .addClass('is-error')
                            .text('\u0051\u0052 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.');
                        return;
                    }

                    if (res.active === false) {
                        syncBusinessOperationUi('INACTIVE');
                        $('#businessQrStatus')
                            .addClass('is-error')
                            .text('\uC6B4\uC601\uC911\uC9C0\uB41C \uB9E4\uC7A5\uC785\uB2C8\uB2E4. \u0051\u0052 \uC0AC\uC6A9 \uC804\uC5D0 \uBA3C\uC800 \uC6B4\uC601\uC744 \uC7AC\uAC1C\uD574 \uC8FC\uC138\uC694.');
                        return;
                    }

                    const addressText = [res.address || '', res.addressDetail || '']
                        .filter(function(value) { return !!value; })
                        .join(' ');

                    $('#businessQrStatus')
                        .removeClass('is-error')
                        .text('\uB9E4\uC7A5 \u0051\u0052 \uCF54\uB4DC\uB97C \uD655\uC778\uD558\uC138\uC694.');
                    $('#businessQrBusinessName').text(res.businessName || '-');
                    $('#businessQrLocationName').text(res.locationName || '-');
                    $('#businessQrAddress').text(addressText || '-');
                    $('#businessQrAuthKey').text(res.qrAuthKey || '-');
                    $('#businessQrImage')
                        .addClass('is-ready')
                        .attr('src', res.imageUrl + '&_ts=' + Date.now());
                },
                error: function(xhr) {
                    let message = '\u0051\u0052 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.';
                    if (xhr && xhr.responseJSON && xhr.responseJSON.message) {
                        message = xhr.responseJSON.message;
                    }
                    if (xhr && xhr.status === 404) {
                        message = '\uD574\uB2F9 \uB9E4\uC7A5 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.';
                    }
                    $('#businessQrStatus')
                        .addClass('is-error')
                        .text(message);
                }
            });
        }

        function closeBusinessQrModal() {
            $('#businessQrModal').fadeOut(200);
            setTimeout(function() {
                resetBusinessQrModal();
            }, 200);
        }

        function printBusinessQr() {
            const imageSrc = $('#businessQrImage').attr('src') || '';

            if (!imageSrc || !$('#businessQrImage').hasClass('is-ready')) {
                alert('\uCD9C\uB825\uD560 \u0051\u0052 \uC774\uBBF8\uC9C0\uAC00 \uC544\uC9C1 \uC900\uBE44\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.');
                return;
            }

            const printWindow = window.open('', 'businessQrPrint', 'width=900,height=900');
            if (!printWindow) {
                alert('\uD31D\uC5C5 \uCC28\uB2E8\uC73C\uB85C \uCD9C\uB825 \uCC3D\uC744 \uC5F4\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.');
                return;
            }

            const absoluteImageSrc = (function() {
                try {
                    return new URL(imageSrc, window.location.origin).toString();
                } catch (error) {
                    return imageSrc;
                }
            })();
            const escapedBusinessName = '';
            const escapedLocationName = '';
            const escapedAddress = '';
            const escapedAuthKey = '';
            const escapedImageSrc = escapeAdminHtml(absoluteImageSrc);

            printWindow.document.open();
            printWindow.document.write(`
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>매장 QR 출력</title>
    <style>
        @page {
            size: auto;
            margin: 0;
        }
        body {
            margin: 0;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .print-wrap {
            width: auto;
            max-width: none;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        .print-title,
        .print-meta {
            display: none !important;
        }
        .print-card {
            border: none;
            padding: 0;
            border-radius: 0;
            background: transparent;
        }
        .print-qr {
            display: flex;
            justify-content: center;
            margin: 0;
        }
        .print-qr img {
            width: 360px;
            height: 360px;
            object-fit: contain;
            border: none;
            padding: 0;
            box-sizing: border-box;
            background: #ffffff;
        }
        .print-qr-only {
            width: 100vw;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .print-qr-only img {
            width: 360px;
            height: 360px;
            object-fit: contain;
            background: #ffffff;
        }
        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="print-qr-only">
        <h1 class="print-title">매장 QR 코드</h1>
        <div class="print-card">
            <div class="print-qr">
                <img id="printBusinessQrImage" src="${escapedImageSrc}" alt="매장 QR 코드" />
            </div>
            <div class="print-meta">
                <div class="print-row">
                    <div class="print-label">매장명</div>
                    <div class="print-value">${escapedBusinessName}</div>
                </div>
                <div class="print-row">
                    <div class="print-label">대표 장소명</div>
                    <div class="print-value">${escapedLocationName}</div>
                </div>
                <div class="print-row">
                    <div class="print-label">주소</div>
                    <div class="print-value">${escapedAddress}</div>
                </div>
                <div class="print-row">
                    <div class="print-label">인증키</div>
                    <div class="print-value">${escapedAuthKey}</div>
                </div>
            </div>
        </div>
    </div>
    <script>
        (function() {
            const image = document.getElementById('printBusinessQrImage');
            const doPrint = function() {
                window.focus();
                setTimeout(function() {
                    window.print();
                }, 150);
            };

            if (image && image.complete) {
                doPrint();
                return;
            }

            if (image) {
                image.onload = doPrint;
                image.onerror = doPrint;
                return;
            }

            doPrint();
        })();
    <\/script>
</body>
</html>`);
            printWindow.document.close();
        }

        function closeBusinessInquiryDetailModal() {
            $('#businessInquiryDetailModal').fadeOut(200);
        }

        function openBusinessInquiryRejectModal(inquiryId) {
            $('#rejectInquiryId').val(inquiryId || '');
            $('#rejectInquiryReason').val('');
            $('#businessInquiryRejectModal').fadeIn(200);
        }

        function closeBusinessInquiryRejectModal() {
            $('#businessInquiryRejectModal').fadeOut(200);
        }

        function submitBusinessInquiryReject() {
            const inquiryId = $('#rejectInquiryId').val();
            const reason = ($('#rejectInquiryReason').val() || '').trim();
            if (!reason) {
                alert('거절 사유를 입력해 주세요.');
                return;
            }
            $.ajax({
                url: ctx + "/admin/store-info/inquiry/delete",
                type: "POST",
                data: { inquiryId: inquiryId },
                success: function(res) {
                    if (res.trim() === "success") {
                        closeBusinessInquiryRejectModal();
                        $('#business-inquiry-row-' + inquiryId).fadeOut(200, function() {
                            $(this).remove();
                        });
                    } else {
                        alert("문의 삭제에 실패했습니다.");
                    }
                },
                error: function(xhr) {
                    alert("서버 통신 오류 (" + xhr.status + ")");
                }
            });
        }

        function updateBusinessInquiryStatus(inquiryId, status) {
            $.ajax({
                url: ctx + "/admin/store-info/inquiry/updateStatus",
                type: "POST",
                data: { inquiryId: inquiryId, status: status },
                success: function(res) {
                    if (res.trim() === "success") {
                        const $status = $('#business-inquiry-status-' + inquiryId);
                        const $row = $('#business-inquiry-row-' + inquiryId);
                        if ($status.length) {
                            $status
                                .removeClass('PENDING IN_PROGRESS ANSWERED CLOSED')
                                .addClass(status)
                                .text(status);
                        }
                        if (status === 'CLOSED' && $row.length) {
                            $row.fadeOut(200, function() {
                                $(this).remove();
                            });
                        }
                    } else alert("상태 변경에 실패했습니다.");
                },
                error: function(xhr) {
                    alert("서버 통신 오류 (" + xhr.status + ")");
                }
            });
        }

        function deleteBusinessInquiry(inquiryId) {
            if (!confirm("문의글을 삭제하시겠습니까?")) return;
            $.ajax({
                url: ctx + "/admin/store-info/inquiry/delete",
                type: "POST",
                data: { inquiryId: inquiryId },
                success: function(res) {
                    if (res.trim() === "success") {
                        $('#business-inquiry-row-' + inquiryId).fadeOut(200, function() {
                            $(this).remove();
                        });
                    } else alert("문의 삭제에 실패했습니다.");
                },
                error: function(xhr) {
                    alert("서버 통신 오류 (" + xhr.status + ")");
                }
            });
        }
    </script>
</head>
<body>
    <c:set var="frontendBaseUrl" value="${initParam['lq.frontend.base-url']}" />
    <c:if test="${empty frontendBaseUrl}">
        <c:set var="frontendPortSuffix" value=":${pageContext.request.serverPort}" />
        <c:if test="${pageContext.request.serverPort == 80 or pageContext.request.serverPort == 443}">
            <c:set var="frontendPortSuffix" value="" />
        </c:if>
        <c:if test="${pageContext.request.serverPort == 8080}">
            <c:set var="frontendPortSuffix" value=":3000" />
        </c:if>
        <c:set var="frontendBaseUrl" value="${pageContext.request.scheme}://${pageContext.request.serverName}${frontendPortSuffix}" />
    </c:if>
    <c:set var="logoHref" value="${frontendBaseUrl}/main" scope="request" />
    <div id="admin-root">
        <jsp:include page="../common/header.jsp" />
        <div class="header-relative-space"></div>
        <div class="admin-main-wrapper">
            <jsp:include page="./admin-navbar.jsp" />
            <main class="admin-content-area"></main>
        </div>
    </div>
    <script>
        $(document).ready(function() {
            loadAdminContent(ctx + "/admin/users");
            $('.admin-nav-item a').removeClass('active');
            $('.admin-nav-item a').first().addClass('active');
        });
    </script>
</body>
</html>
