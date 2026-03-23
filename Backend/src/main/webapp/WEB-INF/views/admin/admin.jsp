<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>LOCALQUEST ADMIN</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        // ?꾩뿭 寃쎈줈 蹂??(JSP ?대뵒?쒕뱺 ?ъ슜 媛??
        const ctx = "${pageContext.request.contextPath}";
        const ADMIN_QUEST_KAKAO_MAP_KEY = "0ee4eff9fa2ac60452126f417cc94a0c";
        const ADMIN_QUEST_CHEONAN_CENTER = {
            lat: 36.81511,
            lng: 127.11389
        };
        let questCountdownTimer = null;
        let adminQuestMap = null;
        let adminQuestSearchMarker = null;
        let adminQuestSelectedMarkers = [];
        let adminQuestSelectedLocations = [];
        let adminQuestSearchResults = [];
        let adminQuestPlacesService = null;
        let adminQuestFocusedSearchIndex = -1;

        /**
         * 肄섑뀗痢?濡쒕뜑
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
            if ($('#questLocationMap').length === 0) {
                clearQuestLocationMapObjects();
                adminQuestMap = null;
                adminQuestPlacesService = null;
                adminQuestSelectedLocations = [];
                adminQuestSearchResults = [];
                adminQuestFocusedSearchIndex = -1;
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

            const tick = function() {
                $timerCards.each(function() {
                    updateQuestCountdown($(this));
                });
            };

            tick();
            questCountdownTimer = setInterval(tick, 1000);
        }

        function updateQuestCountdown($cardBody) {
            const timeLimit = Number($cardBody.data('time-limit'));
            const createdAt = ($cardBody.data('created-at') || '').toString();
            const currentStatus = ($cardBody.data('status') || '').toString();
            const $card = $cardBody.closest('.adm-q-card');
            const $timerItem = $card.find('.quest-timer-icon').closest('.reward-item');
            const $timerText = $card.find('.quest-timer-text');

            if (!timeLimit || !createdAt || currentStatus !== 'ACTIVE') {
                return;
            }

            const createdDate = parseQuestCreatedAt(createdAt);
            if (!createdDate) {
                $timerText.text(timeLimit + '분 제한');
                return;
            }

            const expireAt = createdDate.getTime() + (timeLimit * 60 * 1000);
            const remainingMs = expireAt - Date.now();

            $timerItem.removeClass('is-urgent is-expired');

            if (remainingMs <= 0) {
                $timerItem.addClass('is-expired');
                $timerText.text('시간 만료');
                expireQuestSilently($card, $cardBody);
                return;
            }

            if (remainingMs < 60000) {
                $timerItem.addClass('is-urgent');
            }

            $timerText.text(formatQuestRemainingTime(remainingMs));
        }

        function parseQuestCreatedAt(createdAtText) {
            const normalized = createdAtText.replace(' ', 'T');
            const parsed = new Date(normalized);
            if (Number.isNaN(parsed.getTime())) {
                return null;
            }
            return parsed;
        }

        function formatQuestRemainingTime(remainingMs) {
            const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return minutes + '분 ' + String(seconds).padStart(2, '0') + '초 남음';
        }

        function expireQuestSilently($card, $cardBody) {
            if ($card.data('expireSubmitting')) {
                return;
            }

            $card.data('expireSubmitting', true);

            $.ajax({
                url: ctx + "/admin/quests/updateStatus",
                type: "POST",
                data: { questId: $cardBody.data('id'), status: 'INACTIVE' },
                success: function(res) {
                    if (res && res.trim() === 'success') {
                        applyQuestInactiveState($card, $cardBody);
                    } else {
                        $card.data('expireSubmitting', false);
                    }
                },
                error: function() {
                    $card.data('expireSubmitting', false);
                }
            });
        }

        function applyQuestInactiveState($card, $cardBody) {
            $card.removeClass('ACTIVE').addClass('INACTIVE');
            $card.find('.adm-q-status-badge').text('INACTIVE');
            $card.find('.btn-q-stop')
                .removeClass('btn-q-stop')
                .addClass('btn-q-start')
                .attr('onclick', "updateQuestStatus(" + $cardBody.data('id') + ", 'ACTIVE')")
                .text('활성화');
            $card.find('.reward-item').has('.quest-timer-icon').removeClass('is-urgent').addClass('is-expired');
            $card.find('.quest-timer-text').text('시간 만료');
            $cardBody.data('status', 'INACTIVE');
            $card.data('expireSubmitting', false);
        }

        function escapeAdminHtml(value) {
            return String(value == null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function clearQuestLocationMapObjects() {
            if (adminQuestSearchMarker && typeof adminQuestSearchMarker.setMap === 'function') {
                adminQuestSearchMarker.setMap(null);
            }
            adminQuestSearchMarker = null;

            adminQuestSelectedMarkers.forEach(function(marker) {
                if (marker && typeof marker.setMap === 'function') {
                    marker.setMap(null);
                }
            });
            adminQuestSelectedMarkers = [];
        }

        function loadAdminQuestMapSdk(onReady) {
            if (!ADMIN_QUEST_KAKAO_MAP_KEY) {
                showQuestLocationStatus('카카오 지도 키를 찾을 수 없습니다.', true);
                return;
            }

            const handleSdkReady = function() {
                if (window.kakao?.maps?.load) {
                    window.kakao.maps.load(function() {
                        if (window.kakao?.maps?.LatLng && window.kakao?.maps?.services?.Places) {
                            onReady();
                            return;
                        }
                        showQuestLocationStatus('카카오 지도 서비스를 초기화하지 못했습니다.', true);
                    });
                    return;
                }

                if (window.kakao?.maps?.LatLng && window.kakao?.maps?.services?.Places) {
                    onReady();
                    return;
                }

                showQuestLocationStatus('카카오 지도 라이브러리를 불러오지 못했습니다.', true);
            };

            const handleScriptError = function() {
                showQuestLocationStatus('카카오 지도 스크립트를 불러오지 못했습니다.', true);
            };

            const existingScript = document.querySelector('script[data-kakao-admin-map-sdk="true"]');
            if (existingScript) {
                if (existingScript.getAttribute('data-loaded') === 'true') {
                    handleSdkReady();
                    return;
                }

                existingScript.addEventListener('load', handleSdkReady, { once: true });
                existingScript.addEventListener('error', handleScriptError, { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey='
                + ADMIN_QUEST_KAKAO_MAP_KEY
                + '&autoload=false&libraries=services';
            script.async = true;
            script.setAttribute('data-kakao-admin-map-sdk', 'true');
            script.addEventListener('load', function() {
                script.setAttribute('data-loaded', 'true');
                handleSdkReady();
            }, { once: true });
            script.addEventListener('error', handleScriptError, { once: true });
            document.head.appendChild(script);
        }

        function ensureQuestMap(onReady) {
            const mapElement = document.getElementById('questLocationMap');
            if (!mapElement) {
                return null;
            }

            const finalizeQuestMap = function() {
                if (!adminQuestMap) {
                    return;
                }

                setTimeout(function() {
                    if (typeof adminQuestMap.relayout === 'function') {
                        adminQuestMap.relayout();
                    }
                    fitQuestMapToSelectedLocations();
                    if (typeof onReady === 'function') {
                        onReady(adminQuestMap);
                    }
                }, 80);
            };

            const initializeMap = function() {
                const currentMapElement = document.getElementById('questLocationMap');
                if (!currentMapElement || !window.kakao?.maps?.LatLng) {
                    return;
                }

                if (!adminQuestMap || adminQuestMap.__container !== currentMapElement) {
                    clearQuestLocationMapObjects();
                    currentMapElement.innerHTML = '';
                    adminQuestMap = new window.kakao.maps.Map(currentMapElement, {
                        center: new window.kakao.maps.LatLng(
                            ADMIN_QUEST_CHEONAN_CENTER.lat,
                            ADMIN_QUEST_CHEONAN_CENTER.lng
                        ),
                        level: 6
                    });
                    adminQuestMap.__container = currentMapElement;
                    adminQuestPlacesService = new window.kakao.maps.services.Places(adminQuestMap);
                }

                finalizeQuestMap();
            };

            if (window.kakao?.maps?.LatLng && window.kakao?.maps?.services?.Places) {
                initializeMap();
                return adminQuestMap;
            }

            showQuestLocationStatus('천안 기준 카카오 지도를 불러오는 중입니다.', false);
            loadAdminQuestMapSdk(initializeMap);
            return null;
        }

        function resetQuestLocationState() {
            adminQuestSearchResults = [];
            adminQuestSelectedLocations = [];
            adminQuestFocusedSearchIndex = -1;
            syncQuestLocationsInput();
            renderQuestSearchResults();
            renderQuestSelectedLocations();
            clearQuestSearchMarker();
        }

        function clearQuestSearchMarker() {
            if (adminQuestSearchMarker && typeof adminQuestSearchMarker.setMap === 'function') {
                adminQuestSearchMarker.setMap(null);
            }
            adminQuestSearchMarker = null;
        }

        function fitQuestMapToSelectedLocations() {
            if (!adminQuestMap || !window.kakao?.maps?.LatLng) {
                return;
            }

            const validLocations = adminQuestSelectedLocations.filter(function(location) {
                return Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude));
            });

            if (validLocations.length === 0) {
                adminQuestMap.setCenter(
                    new window.kakao.maps.LatLng(
                        ADMIN_QUEST_CHEONAN_CENTER.lat,
                        ADMIN_QUEST_CHEONAN_CENTER.lng
                    )
                );
                adminQuestMap.setLevel(6);
                return;
            }

            if (validLocations.length === 1) {
                adminQuestMap.setCenter(
                    new window.kakao.maps.LatLng(
                        Number(validLocations[0].latitude),
                        Number(validLocations[0].longitude)
                    )
                );
                adminQuestMap.setLevel(4);
                return;
            }

            const bounds = new window.kakao.maps.LatLngBounds();
            validLocations.forEach(function(location) {
                bounds.extend(
                    new window.kakao.maps.LatLng(
                        Number(location.latitude),
                        Number(location.longitude)
                    )
                );
            });
            adminQuestMap.setBounds(bounds);
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
            renderQuestLocationMarkers();

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

        function renderQuestLocationMarkers() {
            if (!adminQuestMap || !window.kakao?.maps?.LatLng) {
                return;
            }

            adminQuestSelectedMarkers.forEach(function(marker) {
                marker.setMap(null);
            });
            adminQuestSelectedMarkers = [];

            adminQuestSelectedLocations.forEach(function(location, index) {
                if (!Number.isFinite(Number(location.latitude)) || !Number.isFinite(Number(location.longitude))) {
                    return;
                }

                const marker = new window.kakao.maps.Marker({
                    map: adminQuestMap,
                    position: new window.kakao.maps.LatLng(
                        Number(location.latitude),
                        Number(location.longitude)
                    ),
                    title: (index + 1) + '. ' + location.name
                });
                adminQuestSelectedMarkers.push(marker);
            });

            fitQuestMapToSelectedLocations();
        }

        function searchQuestLocations() {
            const keyword = ($('#questLocationKeyword').val() || '').trim();
            if (!keyword) {
                showQuestLocationStatus('장소명을 입력해 주세요.', true);
                $('#questLocationKeyword').focus();
                return;
            }

            showQuestLocationStatus('천안 기준으로 장소를 검색 중입니다.', false);

            ensureQuestMap(function() {
                if (!window.kakao?.maps?.services?.Places) {
                    showQuestLocationStatus('카카오 장소 검색 서비스를 불러오지 못했습니다.', true);
                    return;
                }

                if (!adminQuestPlacesService) {
                    adminQuestPlacesService = new window.kakao.maps.services.Places(adminQuestMap);
                }

                const searchOptions = {
                    x: ADMIN_QUEST_CHEONAN_CENTER.lng,
                    y: ADMIN_QUEST_CHEONAN_CENTER.lat,
                    radius: 20000,
                    size: 8,
                    sort: window.kakao.maps.services.SortBy.DISTANCE
                };

                adminQuestPlacesService.keywordSearch(keyword, function(data, status) {
                    if (status === window.kakao.maps.services.Status.OK) {
                        adminQuestSearchResults = (data || []).map(function(result) {
                            const address = result.road_address_name || result.address_name || '';
                            return {
                                name: result.place_name || keyword,
                                address: address,
                                addressDetail: result.address_name && result.road_address_name
                                    ? result.address_name
                                    : '',
                                zipCode: '',
                                latitude: Number(result.y),
                                longitude: Number(result.x),
                                locationType: 'QUEST_SPOT',
                                description: result.category_name || result.place_url || '',
                                categoryText: result.category_name || '천안 장소',
                                distanceText: result.distance ? (result.distance + 'm') : ''
                            };
                        }).filter(function(result) {
                            return Number.isFinite(result.latitude)
                                && Number.isFinite(result.longitude)
                                && result.address;
                        });

                        renderQuestSearchResults();

                        if (adminQuestSearchResults.length > 0) {
                            focusQuestSearchResult(0);
                            showQuestLocationStatus('천안 기준 검색 결과입니다. 목록에서 장소를 선택해 주세요.', false);
                            return;
                        }

                        clearQuestSearchMarker();
                        adminQuestFocusedSearchIndex = -1;
                        showQuestLocationStatus('검색 결과가 없습니다. 다른 키워드로 다시 시도해 주세요.', true);
                        return;
                    }

                    adminQuestSearchResults = [];
                    adminQuestFocusedSearchIndex = -1;
                    renderQuestSearchResults();
                    clearQuestSearchMarker();
                    if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
                        showQuestLocationStatus('검색 결과가 없습니다. 다른 키워드로 다시 시도해 주세요.', true);
                    } else {
                        showQuestLocationStatus('장소 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.', true);
                    }
                });
            });
        }

        function focusQuestSearchResult(index) {
            const result = adminQuestSearchResults[index];
            if (!result || !Number.isFinite(Number(result.latitude)) || !Number.isFinite(Number(result.longitude))) {
                return;
            }

            adminQuestFocusedSearchIndex = index;
            renderQuestSearchResults();

            ensureQuestMap(function(map) {
                clearQuestSearchMarker();
                adminQuestSearchMarker = new window.kakao.maps.Marker({
                    map: map,
                    position: new window.kakao.maps.LatLng(
                        Number(result.latitude),
                        Number(result.longitude)
                    ),
                    title: result.name
                });
                map.panTo(
                    new window.kakao.maps.LatLng(
                        Number(result.latitude),
                        Number(result.longitude)
                    )
                );
                map.setLevel(4);
            });
        }

        function addQuestLocation(index) {
            const result = adminQuestSearchResults[index];
            if (!result) {
                return;
            }

            const isDuplicated = adminQuestSelectedLocations.some(function(location) {
                return location.name === result.name
                    && Number(location.latitude) === Number(result.latitude)
                    && Number(location.longitude) === Number(result.longitude);
            });

            if (isDuplicated) {
                showQuestLocationStatus('이미 추가된 장소입니다.', true);
                return;
            }

            adminQuestSelectedLocations.push({
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

        /**
         * [?듯빀] ?뚯썝 沅뚰븳 蹂寃??⑥닔
         */
        function updateRole(userId, newRole) {
            if (userId === 1) {
                alert("留덉뒪??愿由ъ옄??蹂寃쏀븷 ???놁뒿?덈떎.");
                return;
            }

            if (!confirm("沅뚰븳??蹂寃쏀븯?쒓쿋?듬땲源?")) {
                loadAdminContent(ctx + '/admin/users');
                return;
            }

            $.ajax({
                url: ctx + '/admin/users/updateRole',
                type: 'POST',
                data: { userId: userId, role: newRole },
                success: function(res) {
                    if (res.trim() === "success") {
                        alert("沅뚰븳??蹂寃쎈릺?덉뒿?덈떎.");
                    } else {
                        alert("蹂寃??ㅽ뙣");
                        loadAdminContent(ctx + '/admin/users');
                    }
                },
                error: function(xhr) {
                    alert("?쒕쾭 ?듭떊 ?먮윭 (肄붾뱶: " + xhr.status + ")");
                }
            });
        }
        
        let currentSortOrder = 'DESC'; // 湲곕낯 ?뺣젹 ?곹깭 (理쒖떊??

        /**
         * ?뚯썝 寃???⑥닔
         */
        function searchUser() {
            const type = $('#searchType').val();
            const keyword = $('#keyword').val();
            
            // 寃???쒖뿉??contextPath(ctx) ?쒖슜
            const url = ctx + "/admin/search?type=" + type + "&keyword=" + encodeURIComponent(keyword);
            loadAdminContent(url);
        }

        /**
         * ?뚯썝踰덊샇 ?뺣젹 ?⑥닔 (?대씪?댁뼵???ъ씠???뱀? ?쒕쾭 ?ъ씠???좏깮 媛??
         * ?ш린?쒕뒗 媛??源붾걫??'?쒕쾭 ?ъ슂泥? 諛⑹떇??異붿쿇?⑸땲??
         */
        function sortUserList() {
            currentSortOrder = (currentSortOrder === 'DESC') ? 'ASC' : 'DESC';
            const type = $('#searchType').val();
            const keyword = $('#keyword').val();
            
            // 寃??議곌굔 ?좎??섎㈃???뺣젹留?蹂寃쏀빐???ㅼ떆 濡쒕뱶
            const url = ctx + "/admin/users?sort=" + currentSortOrder + "&type=" + type + "&keyword=" + keyword;
            loadAdminContent(url);
        }
        
        /**
         * ?뚯썝 ?곹깭 蹂寃?(?뺤? ??
         */
        function updateStatus(userId, newStatus) {
            if (userId === 1) {
                alert("留덉뒪??愿由ъ옄???뺤??????놁뒿?덈떎.");
                return;
            }

            // [?뺤씤 ?덉감] ??踰???臾쇱뼱蹂닿린
            const actionText = (newStatus === 'WITHDRAWN') ? "삭제" : "변경";
            if (!confirm("?대떦 ?뚯썝???뺣쭚濡?" + actionText + "?섏떆寃좎뒿?덇퉴?")) {
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
                        alert("?곹깭媛 ?뺤긽?곸쑝濡?蹂寃쎈릺?덉뒿?덈떎.");
                        
                        // [?곹깭 ?좎? 濡쒕뱶] ?꾩옱 ?붾㈃??寃?됱뼱? ?뺣젹媛믪쓣 洹몃?濡?臾쇨퀬 ?ㅼ떆 濡쒕뱶
                        const type = $('#searchType').val();
                        const keyword = $('#keyword').val();
                        // ?뺣젹 ?꾩씠肄??곹깭瑜??듯빐 ?꾩옱 ?뺣젹 ?뺤씤 (?곷떒 ?ㅻ뜑????λ맂 媛??쒖슜)
                        const sort = $('#sortIcon').hasClass('fa-sort-up') ? 'ASC' : 'DESC';
                        
                        const url = ctx + "/admin/search?type=" + type + "&keyword=" + encodeURIComponent(keyword) + "&sort=" + sort;
                        loadAdminContent(url);
                    } else {
                        alert("蹂寃쎌뿉 ?ㅽ뙣?덉뒿?덈떎.");
                    }
                },
                error: function(xhr) {
                    alert("?쒕쾭 ?듭떊 ?먮윭媛 諛쒖깮?덉뒿?덈떎.");
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
         * [湲곗〈 ?⑥닔 蹂댁셿] ?깅줉/?섏젙 ?듯빀 ?쒖텧
         */
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
                        } else if (res.trim() === "fail:category_empty") {
                            alert("카테고리를 선택해 주세요.");
                        } else if (res.trim() === "fail:category_invalid") {
                            alert("선택한 카테고리가 DB에 없습니다. 카테고리 테이블 데이터를 먼저 등록해 주세요.");
                        } else if (res.trim() === "fail:category_not_ready") {
                            alert("퀘스트 카테고리 데이터가 없습니다. LQ_QUEST_CATEGORY 테이블에 카테고리를 먼저 등록해 주세요.");
                        } else if (res.trim() === "fail:category_table_missing") {
                            alert("퀘스트 카테고리 테이블을 찾을 수 없습니다. DB 스키마를 먼저 확인해 주세요.");
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
                            alert("퀘스트 장소 테이블을 찾을 수 없습니다. LQ_LOCATION, LQ_QUEST_LOCATION 테이블을 먼저 확인해 주세요.");
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

        /* --- admin.jsp ?ㅽ겕由쏀듃 ?곸뿭 ?섏젙 --- */

        /**
         * [異붽?/?섏젙] ???섏뒪??紐⑤떖 ?닿린
         * (?섏젙 紐⑤뱶??ㅺ? ?ㅼ떆 '???깅줉'???꾨? ?뚮? ?鍮꾪빐 珥덇린??濡쒖쭅 異붽?)
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
            showQuestLocationStatus('검색으로 퀘스트 장소를 추가할 수 있습니다.', false);
            $('#questModal').fadeIn(200, function() {
                ensureQuestMap();
            });
        }

        /**
         * ?섏젙 紐⑤떖 ?닿린 (湲곗〈 媛?梨꾩슦湲?
         */
        function editQuestModal(data) {
            $('#modalTitleText').html('<i class="fas fa-edit"></i> 퀘스트 수정');
            $('#modalSubmitBtn').text('수정하기');
            $('#modalQuestId').val(data.id); 
            $('#modalQuestStatus').val(data.status || 'ACTIVE');
            $('#m_title').val(data.title);
            $('#m_category').val(data.category);
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
            $('#questModal').fadeIn(200, function() {
                ensureQuestMap();
                loadQuestLocationsForEdit(data.id);
            });
        }

        function openQuestEditFromCard(cardBody) {
            const $card = $(cardBody);
            const $questCard = $card.closest('.adm-q-card');
            editQuestModal({
                id: $card.data('id'),
                title: $.trim($card.find('.adm-q-card-title').text()),
                category: $.trim($questCard.find('.adm-q-category').text()),
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
         * 紐⑤떖 ?レ쓣 ??珥덇린??(?대? ?묒꽦?섏떊 肄붾뱶 ?좎??섎릺, 由ъ뀑 ?뺤씤)
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
                showQuestLocationStatus('', false);
                $('#modalTitleText').html('<i class="fas fa-plus-circle"></i> 새 퀘스트 등록');
                $('#modalSubmitBtn').text('등록하기');
            }, 200);
        }
        
        /**
         * ?섏뒪??寃??諛??꾪꽣留?
         */
        function searchQuest() {
            const status = $('#filterStatus').val(); // ?쒖꽦/鍮꾪솢???좏깮媛?
            const keyword = $('#searchQuestName').val(); // 寃?됱뼱
            
            // URL ?뚮씪誘명꽣 議고빀
            const url = ctx + "/admin/quests?status=" + status + "&keyword=" + encodeURIComponent(keyword);
            
            // 湲곗〈??留뚮뱶??肄섑뀗痢?濡쒕뜑 ?⑥닔 ?몄텧
            loadAdminContent(url);
        }
        
        /* --- Reward Item 愿??JS --- */

        function searchItem() {
            const status = $('#filterItemStatus').val();
            const keyword = $('#searchItemName').val();
            loadAdminContent(ctx + "/admin/shop?status=" + status + "&keyword=" + encodeURIComponent(keyword));
        }

        function openItemModal() {
            $('#modalItemId').val("0");
            $('#itemForm')[0].reset();
            $('#itemModalTitleText').html('<i class="fas fa-plus-circle"></i> ??由ъ썙???깅줉');
            $('#itemSubmitBtn').text('?깅줉?섍린');
            $('#itemModal').fadeIn(200);
        }

        function editItemModal(data) {
            $('#itemModalTitleText').html('<i class="fas fa-edit"></i> ?꾩씠???뺣낫 ?섏젙');
            $('#itemSubmitBtn').text('?섏젙?섍린');
            
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
                        alert("??λ릺?덉뒿?덈떎.");
                        closeItemModal();
                        loadAdminContent(ctx + "/admin/shop");
                    } else { alert("?ㅽ뙣?덉뒿?덈떎."); }
                }
            });
        }

        function updateItemStatus(itemId, status) {
            if(!confirm("?꾩씠???곹깭瑜?蹂寃쏀븯?쒓쿋?듬땲源?")) return;
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
            // ?좊땲硫붿씠?섏씠 ?앸궃 ???곗씠?곕? 源⑤걮?섍쾶 鍮꾩썙以띾땲??
            setTimeout(function() {
                $('#itemForm')[0].reset();
                $('#modalItemId').val("0");
                $('#itemModalTitleText').html('<i class="fas fa-plus-circle"></i> ??由ъ썙???깅줉');
                $('#itemSubmitBtn').text('?깅줉?섍린');
            }, 200);
        }
        
        /* --- Business ?온??JS --- */

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
                        alert("?遺욧퍕???怨뚭탢 ????곷뮸??덈뼄.");
                    }
                },
                error: function(xhr) {
                    alert("??뺤쒔 ???뻿 ?癒?쑎 (?꾨뗀諭? " + xhr.status + ")");
                }
            });
        }

        function openBusinessModal(businessId) {
            if ($('#businessForm').length === 0) return;

            $('#businessForm')[0].reset();
            $('#businessId').val("0");
            $('#businessModalTitleText').html('<i class="fas fa-plus-circle"></i> ??쑴已??됰뮞 ?源낆쨯');
            $('#businessSubmitBtn').text('?源낆쨯??띾┛');

            if (!businessId) {
                $('#businessModal').fadeIn(200);
                return;
            }

            loadBusinessDetail(businessId, function(data) {
                $('#businessModalTitleText').html('<i class="fas fa-edit"></i> ??쑴已??됰뮞 ?類ｋ궖 ??륁젟');
                $('#businessSubmitBtn').text('??륁젟??띾┛');
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
                $('#businessModalTitleText').html('<i class="fas fa-plus-circle"></i> ??쑴已??됰뮞 ?源낆쨯');
                $('#businessSubmitBtn').text('?源낆쨯??띾┛');
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
                        alert("???貫由??됰뮸??덈뼄.");
                        closeBusinessModal();
                        loadAdminContent(ctx + "/admin/store-info");
                        return;
                    }

                    if (result === "fail:business_name_empty") {
                        alert("?湲??筌뤿굞????낆젾??곻폒?紐꾩뒄.");
                        return;
                    }
                    if (result === "fail:zip_code_empty") {
                        alert("?怨좊젶甕곕뜇?뉒몴? ??낆젾??곻폒?紐꾩뒄.");
                        return;
                    }
                    if (result === "fail:address_empty") {
                        alert("??됵폒?? ??낆젾??곻폒?紐꾩뒄.");
                        return;
                    }
                    if (result === "fail:user_id_invalid") {
                        alert("?????甕곕뜇?뉒몴? ?類ㅺ맒?怨몄몵嚥? ??낆젾??곻폒?紐꾩뒄.");
                        return;
                    }

                    alert("??쎈솭??됰뮸??덈뼄.");
                },
                error: function(xhr) {
                    alert("??뺤쒔 ???뻿 ?癒?쑎 (?꾨뗀諭? " + xhr.status + ")");
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
                $('#businessDetailModal').fadeIn(200);
            });
        }

        function closeBusinessDetailModal() {
            $('#businessDetailModal').fadeOut(200);
        }

        function deleteBusiness(businessId) {
            if (!confirm("??????쑴已??됰뮞?? ?????뤿뻻野껋쥙???뉙돱?")) return;

            $.ajax({
                url: ctx + "/admin/store-info/delete",
                type: "POST",
                data: { businessId: businessId },
                success: function(res) {
                    if (res.trim() === "success") {
                        alert("?????뤿???щ빍??");
                        loadAdminContent(ctx + "/admin/store-info");
                    } else {
                        alert("??쎈솭??됰뮸??덈뼄.");
                    }
                },
                error: function(xhr) {
                    alert("??뺤쒔 ???뻿 ?癒?쑎 (?꾨뗀諭? " + xhr.status + ")");
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
                    else alert("?곗씠?곌? ?놁뒿?덈떎.");
                },
                error: function(xhr) {
                    alert("?쒕쾭 ?듭떊 ?ㅻ쪟 (" + xhr.status + ")");
                }
            });
        }

        function openBusinessModal(businessId) {
            if ($('#businessForm').length === 0) return;
            $('#businessForm')[0].reset();
            $('#businessId').val("0");
            $('#businessInquiryId').val("");
            $('#businessModalTitleText').html('<i class="fas fa-plus-circle"></i> 留ㅼ옣 ?깅줉');
            $("#businessSubmitBtn").text('저장');
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
            $("#businessSubmitBtn").text('계약 저장');
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
                $('#businessModalTitleText').html('<i class="fas fa-plus-circle"></i> 留ㅼ옣 ?깅줉');
                $("#businessSubmitBtn").text('저장');
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
                    else alert("??젣???ㅽ뙣?덉뒿?덈떎.");
                },
                error: function(xhr) {
                    alert("?쒕쾭 ?듭떊 ?ㅻ쪟 (" + xhr.status + ")");
                }
            });
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
            if (!confirm("臾몄쓽湲????젣?섏떆寃좎뒿?덇퉴?")) return;
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
