        // ?꾩뿭 寃쎈줈 蹂??(JSP ?대뵒?쒕뱺 ?ъ슜 媛??
        const ctx = "${pageContext.request.contextPath}";
        const ADMIN_THEME_STORAGE_KEY = "localquest-admin-theme";
        const ADMIN_DEFAULT_VIEW = "users";
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

        function normalizeAdminTheme(theme) {
            return theme === 'dark' ? 'dark' : 'light';
        }

        function getStoredAdminTheme() {
            try {
                return normalizeAdminTheme(window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY));
            } catch (error) {
                return 'light';
            }
        }

        function getCurrentAdminTheme() {
            const body = document.body;
            return normalizeAdminTheme(body ? body.getAttribute('data-admin-theme') : null);
        }

        function updateAdminThemeToggle(theme) {
            const resolvedTheme = normalizeAdminTheme(theme);
            const toggleButton = document.getElementById('adminThemeToggle');
            if (!toggleButton) {
                return;
            }

            const isDark = resolvedTheme === 'dark';
            const icon = toggleButton.querySelector('[data-theme-icon]');
            const label = toggleButton.querySelector('[data-theme-label]');

            toggleButton.setAttribute('aria-pressed', isDark ? 'true' : 'false');
            toggleButton.classList.toggle('is-dark', isDark);

            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }

            if (label) {
                label.textContent = isDark ? '\uB77C\uC774\uD2B8 \uBAA8\uB4DC' : '\uB2E4\uD06C \uBAA8\uB4DC';
            }
        }

        function applyAdminTheme(theme) {
            const resolvedTheme = normalizeAdminTheme(theme);
            const body = document.body;
            if (!body) {
                return resolvedTheme;
            }

            body.setAttribute('data-admin-theme', resolvedTheme);
            const root = document.getElementById('admin-root');
            if (root) {
                root.setAttribute('data-admin-theme', resolvedTheme);
            }
            updateAdminThemeToggle(resolvedTheme);
            return resolvedTheme;
        }

        function initializeAdminTheme() {
            applyAdminTheme(getStoredAdminTheme());
        }

        function toggleAdminTheme() {
            const nextTheme = getCurrentAdminTheme() === 'dark' ? 'light' : 'dark';
            try {
                window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, nextTheme);
            } catch (error) {
                // ignore storage failures and apply theme for the current session
            }
            applyAdminTheme(nextTheme);
        }

        function normalizeAdminView(view) {
            const allowedViews = ['users', 'shop', 'quests', 'locations', 'store-info', 'qna', 'notice', 'faq'];
            return allowedViews.indexOf(view) >= 0 ? view : ADMIN_DEFAULT_VIEW;
        }

        function stripAdminContext(pathname) {
            if (ctx && pathname.indexOf(ctx) === 0) {
                const strippedPath = pathname.substring(ctx.length);
                return strippedPath || '/';
            }
            return pathname || '/';
        }

        function getAdminAjaxPathByView(view) {
            switch (normalizeAdminView(view)) {
                case 'shop':
                    return '/admin/shop';
                case 'quests':
                    return '/admin/quests';
                case 'locations':
                    return '/admin/locations';
                case 'store-info':
                    return '/admin/store-info';
                case 'qna':
                    return '/admin/qna';
                case 'notice':
                    return '/admin/notice';
                case 'faq':
                    return '/admin/faq';
                case 'users':
                default:
                    return '/admin/users';
            }
        }

        function resolveAdminViewFromAjaxUrl(url) {
            const parsedUrl = new URL(url, window.location.origin);
            const path = stripAdminContext(parsedUrl.pathname);

            if (path.indexOf('/admin/search') === 0 || path.indexOf('/admin/users') === 0) {
                return 'users';
            }
            if (path.indexOf('/admin/shop') === 0) {
                return 'shop';
            }
            if (path.indexOf('/admin/quests') === 0) {
                return 'quests';
            }
            if (path.indexOf('/admin/locations') === 0) {
                return 'locations';
            }
            if (path.indexOf('/admin/store-info') === 0) {
                return 'store-info';
            }
            if (path.indexOf('/admin/qna') === 0) {
                return 'qna';
            }
            if (path.indexOf('/admin/notice') === 0) {
                return 'notice';
            }
            if (path.indexOf('/admin/faq') === 0) {
                return 'faq';
            }

            return ADMIN_DEFAULT_VIEW;
        }

        function buildAdminShellUrlFromAjaxUrl(url) {
            const parsedUrl = new URL(url, window.location.origin);
            const params = new URLSearchParams(parsedUrl.search);
            params.set('view', resolveAdminViewFromAjaxUrl(url));
            const queryString = params.toString();
            return ctx + '/admin' + (queryString ? '?' + queryString : '');
        }

        function buildAdminAjaxUrlFromLocation(locationLike) {
            const path = stripAdminContext(locationLike.pathname || window.location.pathname);
            if (path.indexOf('/admin') !== 0) {
                return ctx + getAdminAjaxPathByView(ADMIN_DEFAULT_VIEW);
            }

            const params = new URLSearchParams(locationLike.search || window.location.search);
            const view = normalizeAdminView(params.get('view'));
            params.delete('view');

            const queryString = params.toString();
            return ctx + getAdminAjaxPathByView(view) + (queryString ? '?' + queryString : '');
        }

        function findAdminNavLinkByView(view) {
            return document.querySelector('.admin-nav-item a[data-admin-view="' + normalizeAdminView(view) + '"]');
        }

        function syncAdminActiveNav(view, element) {
            const targetElement = element || findAdminNavLinkByView(view);
            $('.admin-nav-item a').removeClass('active');
            if (targetElement) {
                $(targetElement).addClass('active');
            }
        }

        /**
         * 肄섑뀗痢?濡쒕뜑
         */
        function loadAdminContent(url, element, options) {
            const loadOptions = options || {};
            const shouldPushHistory = loadOptions.pushHistory !== false;
            const resolvedView = resolveAdminViewFromAjaxUrl(url);
            $('.admin-content-area').empty(); 
            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'html',
                success: function(response) {
                    $('.admin-content-area').html(response);
                    initializeAdminView(url);
                    syncAdminActiveNav(resolvedView, element);

                    if (shouldPushHistory && window.history && window.history.pushState) {
                        const nextShellUrl = buildAdminShellUrlFromAjaxUrl(url);
                        const currentShellUrl = buildAdminShellUrlFromAjaxUrl(buildAdminAjaxUrlFromLocation(window.location));
                        if (nextShellUrl !== currentShellUrl) {
                            window.history.pushState({ view: resolvedView }, '', nextShellUrl);
                        }
                    }
                },
                error: function(xhr) {
                    console.error("濡쒕뱶 ?ㅽ뙣:", xhr.status);
                    $('.admin-content-area').html(
                        '<div style="padding:24px; color:#fff; background:#252537; border-radius:12px;">'
                        + '<h3 style="margin:0 0 12px;">愿由ъ옄 ?붾㈃ 濡쒕뵫 ?ㅽ뙣</h3>'
                        + '<div>?붿껌 URL: ' + url + '</div>'
                        + '<div>HTTP ?곹깭: ' + xhr.status + '</div>'
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
            harmonizeAdminSearchControls();
            initializeQuestCountdowns();
        }

        function harmonizeAdminSearchControls() {
            $('.admin-content-area .adm-u-search-group').each(function() {
                const $group = $(this);
                const $input = $group.children('.adm-u-input').first();
                const $trigger = $group.children('.adm-u-btn-search, .adm-u-search-trigger').first();

                if ($input.length === 0 || $trigger.length === 0) {
                    return;
                }

                let $searchBox = $group.children('.adm-u-search-box').first();
                if ($searchBox.length === 0) {
                    $searchBox = $('<div class="adm-u-search-box"></div>');
                    $input.before($searchBox);
                }

                $searchBox.append($input);
                $searchBox.append(
                    $trigger
                        .attr({
                            type: 'button',
                            'aria-label': 'Search users'
                        })
                        .removeClass('adm-u-btn-search')
                        .addClass('adm-u-search-trigger')
                        .html('<i class="fas fa-search"></i>')
                );
            });

            $('.admin-content-area .adm-i-controls').each(function() {
                const $controls = $(this);
                const $trigger = $controls.children('.adm-i-btn-search, .adm-i-search-trigger').first();
                const $targetBox = $controls.children('.adm-i-user-box').first().length
                    ? $controls.children('.adm-i-user-box').first()
                    : $controls.children('.adm-i-search-box').first();

                if ($targetBox.length === 0 || $trigger.length === 0) {
                    return;
                }

                $targetBox.append(
                    $trigger
                        .attr({
                            type: 'button',
                            'aria-label': 'Search inquiries'
                        })
                        .removeClass('adm-i-btn-search')
                        .addClass('adm-i-search-trigger')
                        .html('<i class="fas fa-search"></i>')
                );
            });
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
                $timerText.text('?쒗븳 ?놁쓬');
                return;
            }

            $timerText.text(timeLimit + '遺??쒗븳');
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
                $list.html('<div class="adm-q-place-empty">寃??寃곌낵媛 ?놁뒿?덈떎.</div>');
                return;
            }

            const html = adminQuestSearchResults.map(function(result, index) {
                const meta = [result.categoryText, result.distanceText].filter(Boolean).join(' 쨌 ');
                return ''
                    + '<div class="adm-q-place-result' + (index === adminQuestFocusedSearchIndex ? ' is-focused' : '') + '" onclick="focusQuestSearchResult(' + index + ')">'
                    + '  <div class="adm-q-place-result-text">'
                    + '    <strong>' + escapeAdminHtml(result.name) + '</strong>'
                    + '    <span>' + escapeAdminHtml(result.address) + '</span>'
                    + (meta ? '    <small class="adm-q-place-result-meta">' + escapeAdminHtml(meta) + '</small>' : '')
                    + '  </div>'
                    + '  <button type="button" class="adm-q-place-pick" onclick="event.stopPropagation(); addQuestLocation(' + index + ')">?좏깮</button>'
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
                $list.html('<div class="adm-q-place-empty">?좏깮???μ냼媛 ?놁뒿?덈떎.</div>');
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
                    + '    <button type="button" onclick="moveQuestLocation(' + index + ', -1)" ' + (index === 0 ? 'disabled' : '') + '>??/button>'
                    + '    <button type="button" onclick="moveQuestLocation(' + index + ', 1)" ' + (index === adminQuestSelectedLocations.length - 1 ? 'disabled' : '') + '>?꾨옒</button>'
                    + '    <button type="button" class="is-danger" onclick="removeQuestLocation(' + index + ')">??젣</button>'
                    + '  </div>'
                    + '</div>';
            }).join('');

            $list.html(html);
        }

        function searchQuestLocations() {
            const keyword = ($('#questLocationKeyword').val() || '').trim();
            showQuestLocationStatus(
                keyword
                    ? '?깅줉???μ냼 紐⑸줉??寃??以묒엯?덈떎.'
                    : '理쒓렐 ?깅줉???μ냼 紐⑸줉??遺덈윭?ㅻ뒗 以묒엯?덈떎.',
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
                            categoryText: result.locationType || '?깅줉 ?μ냼'
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
                        showQuestLocationStatus('議곌굔??留욌뒗 ?깅줉 ?μ냼媛 ?놁뒿?덈떎.', true);
                        return;
                    }

                    showQuestLocationStatus(
                        keyword
                            ? '寃?됰맂 ?μ냼 紐⑸줉?낅땲?? ?섏뒪??寃쎈줈??異붽????μ냼瑜??좏깮??二쇱꽭??'
                            : '理쒓렐 ?깅줉 ?μ냼 紐⑸줉?낅땲?? ?섏뒪??寃쎈줈??異붽????μ냼瑜??좏깮??二쇱꽭??',
                        false
                    );
                },
                error: function() {
                    adminQuestSearchResults = [];
                    adminQuestFocusedSearchIndex = -1;
                    renderQuestSearchResults();
                    showQuestLocationStatus('?μ냼 紐⑸줉??遺덈윭?ㅼ? 紐삵뻽?듬땲?? ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??', true);
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
                showQuestLocationStatus('?대? 異붽????μ냼?낅땲??', true);
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
            showQuestLocationStatus('?μ냼媛 ?섏뒪??寃쎈줈??異붽??섏뿀?듬땲??', false);
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

            showQuestLocationStatus('??λ맂 ?μ냼 ?뺣낫瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎.', false);

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
                            ? '??λ맂 ?μ냼 ?뺣낫瑜?遺덈윭?붿뒿?덈떎.'
                            : '??λ맂 ?μ냼媛 ?놁뒿?덈떎. ???μ냼瑜??좏깮?????덉뒿?덈떎.',
                        false
                    );
                },
                error: function() {
                    adminQuestSelectedLocations = [];
                    renderQuestSelectedLocations();
                    showQuestLocationStatus('湲곗〈 ?μ냼 ?뺣낫瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲?? ?덈줈 ?ㅼ떆 ?좏깮??二쇱꽭??', true);
                }
            });
        }

        function resetQuestReviewState() {
            adminQuestReviews = [];
            adminQuestReviewLoading = false;
            adminQuestEditingReviewId = 0;
            adminQuestReviewDraft = { rating: 5, content: '' };
            renderQuestReviewList(Number($('#modalQuestId').val()) || 0);
            showQuestReviewStatus('???섏뒪?몃뒗 ?깅줉 ??由щ럭瑜?愿由ы븷 ???덉뒿?덈떎.', false);
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
            return '\u2605'.repeat(normalized) + '\u2606'.repeat(5 - normalized);
        }

        function renderQuestReviewList(questId) {
            const $list = $('#questReviewList');
            if ($list.length === 0) {
                return;
            }

            if (!(questId > 0)) {
                $list.html('<div class="adm-q-review-empty">???섏뒪?몃뒗 ?깅줉 ??由щ럭瑜?愿由ы븷 ???덉뒿?덈떎.</div>');
                return;
            }

            if (adminQuestReviewLoading) {
                $list.html('<div class="adm-q-review-empty">由щ럭瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎.</div>');
                return;
            }

            if (adminQuestReviews.length === 0) {
                $list.html('<div class="adm-q-review-empty">?깅줉??由щ럭媛 ?놁뒿?덈떎.</div>');
                return;
            }

            const html = adminQuestReviews.map(function(review) {
                if (adminQuestEditingReviewId === Number(review.reviewId)) {
                    const options = [1, 2, 3, 4, 5].map(function(score) {
                        return '<option value="' + score + '"'
                            + (Number(adminQuestReviewDraft.rating) === score ? ' selected' : '')
                            + '>' + score + '??/option>';
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
                        + '    <label for="adminQuestReviewRating">蹂꾩젏</label>'
                        + '    <select id="adminQuestReviewRating" onchange="setAdminQuestReviewRating(this.value)">'
                        + options
                        + '    </select>'
                        + '  </div>'
                        + '  <textarea id="adminQuestReviewContent" oninput="setAdminQuestReviewContent(this.value)">'
                        + escapeAdminHtml(adminQuestReviewDraft.content || '')
                        + '</textarea>'
                        + '  <div class="adm-q-review-actions">'
                        + '    <button type="button" onclick="submitAdminQuestReviewEdit()">???/button>'
                        + '    <button type="button" class="is-secondary" onclick="cancelAdminQuestReviewEdit()">痍⑥냼</button>'
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
                    + '        <button type="button" onclick="startAdminQuestReviewEdit(' + review.reviewId + ')">?섏젙</button>'
                    + '        <button type="button" class="is-danger" onclick="deleteAdminQuestReview(' + review.reviewId + ')">??젣</button>'
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
            showQuestReviewStatus('由щ럭瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎.', false);

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
                            ? '?깅줉??由щ럭瑜?遺덈윭?붿뒿?덈떎.'
                            : '?깅줉??由щ럭媛 ?놁뒿?덈떎.',
                        false
                    );
                },
                error: function() {
                    adminQuestReviews = [];
                    adminQuestReviewLoading = false;
                    renderQuestReviewList(questId);
                    showQuestReviewStatus('由щ럭瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲?? ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??', true);
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
            showQuestReviewStatus('由щ럭 ?섏젙 ?댁슜???몄쭛?????덉뒿?덈떎.', false);
        }

        function cancelAdminQuestReviewEdit() {
            adminQuestEditingReviewId = 0;
            adminQuestReviewDraft = { rating: 5, content: '' };
            renderQuestReviewList(Number($('#modalQuestId').val()) || 0);
            showQuestReviewStatus('由щ럭 ?섏젙??痍⑥냼?섏뿀?듬땲??', false);
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
                showQuestReviewStatus('蹂꾩젏? 1?먮???5?먭퉴吏 ?낅젰??二쇱꽭??', true);
                return;
            }

            if (!content) {
                showQuestReviewStatus('由щ럭 ?댁슜???낅젰??二쇱꽭??', true);
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
                        res && res.message ? res.message : '由щ럭媛 ?섏젙?섏뿀?듬땲??',
                        false
                    );
                },
                error: function(xhr) {
                    const message = xhr.responseJSON && xhr.responseJSON.message
                        ? xhr.responseJSON.message
                        : '由щ럭 ?섏젙???ㅽ뙣?덉뒿?덈떎. ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??';
                    showQuestReviewStatus(message, true);
                }
            });
        }

        function deleteAdminQuestReview(reviewId) {
            const questId = Number($('#modalQuestId').val()) || 0;
            if (!(questId > 0) || !(Number(reviewId) > 0)) {
                return;
            }

            if (!confirm('??由щ럭瑜???젣?섏떆寃좎뒿?덇퉴?')) {
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
                        res && res.message ? res.message : '由щ럭媛 ??젣?섏뿀?듬땲??',
                        false
                    );
                },
                error: function(xhr) {
                    const message = xhr.responseJSON && xhr.responseJSON.message
                        ? xhr.responseJSON.message
                        : '由щ럭 ??젣???ㅽ뙣?덉뒿?덈떎. ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??';
                    showQuestReviewStatus(message, true);
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
                    alert("?쒕쾭 ?듭떊 ?ㅻ쪟 (肄붾뱶: " + xhr.status + ")");
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
            
            // 寃???쒖뿉??contextPath(ctx)瑜??ъ슜?⑸땲??
            const url = ctx + "/admin/search?type=" + type + "&keyword=" + encodeURIComponent(keyword);
            loadAdminContent(url);
        }

        /**
         * ?뚯썝踰덊샇 ?뺣젹 ?⑥닔 (?쒕쾭 ?뺣젹 湲곗? ?좎?)
         * ?꾩옱???쒕쾭 ?붿껌 諛⑹떇?쇰줈 泥섎━?⑸땲??
         */
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
                    alert("臾몄쓽 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎.");
                },
                error: function(xhr) {
                    alert("?쒕쾭 ?듭떊 ?ㅻ쪟 (" + xhr.status + ")");
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
            $('#adminInquiryModalTitle').text('臾몄쓽 ?곸꽭');
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
                    $('#adminInquiryModalTitle').text('臾몄쓽 ?듬?');
                    $('#adminInquiryAnswerEditor').show();
                    if (focusAnswer) {
                        $('#adminInquiryAnswerContent').trigger('focus');
                    }
                } else {
                    $('#adminInquiryModalTitle').text('臾몄쓽 ?곸꽭');
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
                alert("臾몄쓽 ?뺣낫瑜??ㅼ떆 遺덈윭?二쇱꽭??");
                return;
            }
            if (!answerContent) {
                alert("?듬? ?댁슜???낅젰?댁＜?몄슂.");
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
                        alert("?듬????깅줉?섏뿀?듬땲??");
                        closeAdminInquiryDetailModal();
                        searchAdminInquiry();
                        return;
                    }
                    if (normalized === "fail:empty_answer") {
                        alert("?듬? ?댁슜???낅젰?댁＜?몄슂.");
                        return;
                    }
                    alert("?듬? ?깅줉???ㅽ뙣?덉뒿?덈떎.");
                },
                error: function(xhr) {
                    alert("?쒕쾭 ?듭떊 ?ㅻ쪟 (" + xhr.status + ")");
                }
            });
        }

        function sortUserList() {
            currentSortOrder = (currentSortOrder === 'DESC') ? 'ASC' : 'DESC';
            const type = $('#searchType').val();
            const keyword = $('#keyword').val();
            
            // 湲곗〈 寃??議곌굔???좎???梨??뺣젹留?蹂寃쏀빀?덈떎.
            const url = ctx + "/admin/users?sort=" + currentSortOrder + "&type=" + type + "&keyword=" + keyword;
            loadAdminContent(url);
        }
        
        /**
         * ?뚯썝 ?곹깭 蹂寃??⑥닔
         */
        function updateStatus(userId, newStatus) {
            if (userId === 1) {
                alert("留덉뒪??愿由ъ옄???곹깭瑜?蹂寃쏀븷 ???놁뒿?덈떎.");
                return;
            }

            // ?뺤씤 臾멸뎄 ?ㅼ젙
            const actionText = (newStatus === 'WITHDRAWN') ? '\uC815\uC9C0' : '\uBCC0\uACBD';
            if (!confirm("\uD574\uB2F9 \uD68C\uC6D0\uC744 \uC815\uB9D0\uB85C " + actionText + "\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?")) {
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
                        
                        // ?꾩옱 寃?됱뼱/?뺣젹 議곌굔???좎???梨??ㅼ떆 濡쒕뱶?⑸땲??
                        const type = $('#searchType').val();
                        const keyword = $('#keyword').val();
                        // ?뺣젹 ?꾩씠肄??곹깭濡??꾩옱 ?뺣젹???뺤씤?⑸땲??
                        const sort = $('#sortIcon').hasClass('fa-sort-up') ? 'ASC' : 'DESC';
                        
                        const url = ctx + "/admin/search?type=" + type + "&keyword=" + encodeURIComponent(keyword) + "&sort=" + sort;
                        loadAdminContent(url);
                    } else {
                        alert("蹂寃쎌뿉 ?ㅽ뙣?덉뒿?덈떎.");
                    }
                },
                error: function(xhr) {
                    alert("?쒕쾭 ?듭떊 ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.");
                }
            });
        }
        
        function updateQuestStatus(questId, status) {
            const msg = status === 'DELETED'
                ? "?섏뒪?몃? ??젣?섏떆寃좎뒿?덇퉴?"
                : `?섏뒪???곹깭瑜?${status}(??濡?蹂寃쏀븯?쒓쿋?듬땲源?`;
            
            if (!confirm(msg)) return;

            $.ajax({
                url: ctx + "/admin/quests/updateStatus",
                type: "POST",
                data: { questId: questId, status: status },
                success: function(res) {
                    if (res === "success") {
                        alert("?곹깭媛 諛섏쁺?섏뿀?듬땲??");
                        loadAdminContent(ctx + "/admin/quests");
                    } else {
                        alert("?곹깭 蹂寃쎌뿉 ?ㅽ뙣?덉뒿?덈떎.");
                    }
                },
                error: function(xhr) {
                    alert("?쒕쾭 ?듭떊 ?ㅻ쪟 (" + xhr.status + ")");
                }
            });
        }
        

        /**
         * [湲곗〈 ?⑥닔 蹂댁셿] ?깅줉/?섏젙 ?듯빀 ?쒖텧
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
                    alert("??뺤쒔 ???뻿 ??살첒 (" + xhr.status + ")");
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
                    alert("?쒗븳湲곌컙???ъ슜?섎젮硫??쒗븳 ?쒓컙???낅젰??二쇱꽭??");
                    $('#m_time_limit').focus();
                    return;
                }
                if (Number(timeLimitValue) <= 0) {
                    alert("?쒗븳 ?쒓컙? 1遺??댁긽?댁뼱???⑸땲??");
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
                        alert(questId === "0" ? "?섏뒪?멸? ?깅줉?섏뿀?듬땲??" : "?섏뒪?멸? ?섏젙?섏뿀?듬땲??");
                        closeQuestModal();
                        loadAdminContent(ctx + "/admin/quests");
                    } else {
                        if (res.trim() === "fail:title_empty") {
                            alert("?섏뒪???쒕ぉ???낅젰??二쇱꽭??");
                        } else if (res.trim() === "fail:description_empty") {
                            alert("?섏뒪???ㅻ챸???낅젰??二쇱꽭??");
                        } else if (res.trim() === "fail:invalid_id") {
                            alert("?섏젙???섏뒪???뺣낫媛 ?щ컮瑜댁? ?딆뒿?덈떎.");
                        } else if (res.trim() === "fail:locations_invalid") {
                            alert("?좏깮???μ냼 ?뺣낫媛 ?щ컮瑜댁? ?딆뒿?덈떎. ?ㅼ떆 ?좏깮??二쇱꽭??");
                        } else if (res.trim() === "fail:location_name_empty") {
                            alert("?좏깮???μ냼紐??뺣낫媛 鍮꾩뼱 ?덉뒿?덈떎.");
                        } else if (res.trim() === "fail:location_address_empty") {
                            alert("?좏깮???μ냼 二쇱냼 ?뺣낫媛 鍮꾩뼱 ?덉뒿?덈떎.");
                        } else if (res.trim() === "fail:location_coordinate_empty") {
                            alert("?좏깮???μ냼 醫뚰몴 ?뺣낫媛 鍮꾩뼱 ?덉뒿?덈떎.");
                        } else if (res.trim() === "fail:location_tables_missing") {
                            alert("?섏뒪???μ냼 ??μ뿉 ?꾩슂???뚯씠釉??먮뒗 ?쒗?ㅻ? 李얠? 紐삵뻽?듬땲?? LQ_LOCATION, LQ_QUEST_LOCATION, SEQ_LQ_LOCATION_PK, SEQ_LQ_QUEST_LOCATION_PK瑜??뺤씤??二쇱꽭??");
                        } else if (res.trim() === "fail:location_reference_missing") {
                            alert("?좏깮???μ냼媛 ?꾩옱 DB???놁뼱 ??ν븷 ???놁뒿?덈떎. ?μ냼瑜??ㅼ떆 ?좏깮??二쇱꽭??");
                        } else if (res.trim() === "fail:location_conflict") {
                            alert("?좏깮???μ냼 紐⑸줉??以묐났?섍굅???쒖꽌媛 異⑸룎?섎뒗 ??ぉ???덉뒿?덈떎. ?μ냼 紐⑸줉???ㅼ떆 ?뺤씤??二쇱꽭??");
                        } else {
                            alert("??μ뿉 ?ㅽ뙣?덉뒿?덈떎: " + res.trim());
                        }
                    }
                },
                error: function(xhr) {
                    alert("?쒕쾭 ?듭떊 ?ㅻ쪟 (" + xhr.status + ")");
                }
            });
        }

        /* --- admin.jsp ?ㅽ겕由쏀듃 ?곸뿭 ?섏젙 --- */

        /**
         * [異붽?/?섏젙] ?섏뒪??紐⑤떖 ?닿린
         * ?섏젙 紐⑤뱶? ?깅줉 紐⑤뱶瑜?紐⑤몢 珥덇린?뷀빀?덈떎.
         */
        function openQuestModal() {
            $('#questForm')[0].reset();
            $('#modalQuestId').val("0");
            $('#modalQuestStatus').val("ACTIVE");
            $('#m_time_limit_enabled').prop('checked', false);
            $('#m_time_limit').val('').prop('disabled', true);
            $('#questLocationKeyword').val('');
            $('#modalTitleText').html('<i class="fas fa-plus-circle"></i> ???섏뒪???깅줉');
            $('#modalSubmitBtn').text('?깅줉?섍린');
            resetQuestLocationState();
            resetQuestReviewState();
            showQuestLocationStatus('?깅줉???μ냼 紐⑸줉??遺덈윭??以鍮꾧? ?섏뿀?듬땲??', false);
            $('#questModal').fadeIn(200, function() {
                searchQuestLocations();
            });
        }

        /**
         * ?섏젙 紐⑤떖 ?닿린 (湲곗〈 媛?梨꾩슦湲?
         */
        function editQuestModal(data) {
            $('#modalTitleText').html('<i class="fas fa-edit"></i> ?섏뒪???섏젙');
            $('#modalSubmitBtn').text('?섏젙?섍린');
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
         * 紐⑤떖???レ쓣 ??珥덇린??
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
                $('#modalTitleText').html('<i class="fas fa-plus-circle"></i> ???섏뒪???깅줉');
                $('#modalSubmitBtn').text('?깅줉?섍린');
            }, 200);
        }
        
        /**
         * ?섏뒪??寃??諛??꾪꽣
         */
        function searchQuest() {
            const status = $('#filterStatus').val(); // ?곹깭 ?좏깮媛?
            const keyword = $('#searchQuestName').val(); // 寃?됱뼱
            
            // URL ?뚮씪誘명꽣 議고빀
            const url = ctx + "/admin/quests?status=" + status + "&keyword=" + encodeURIComponent(keyword);
            
            // 怨듯넻 肄섑뀗痢?濡쒕뜑 ?몄텧
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
            $('#itemModalTitleText').html('<i class="fas fa-edit"></i> 由ъ썙???뺣낫 ?섏젙');
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
            // ?좊땲硫붿씠?섏씠 ?앸궃 ???곗씠?곕? 珥덇린?뷀빀?덈떎.
            setTimeout(function() {
                $('#itemForm')[0].reset();
                $('#modalItemId').val("0");
                $('#itemModalTitleText').html('<i class="fas fa-plus-circle"></i> ??由ъ썙???깅줉');
                $('#itemSubmitBtn').text('?깅줉?섍린');
            }, 200);
        }
        
        /* --- Business 愿??JS --- */

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
                        alert("鍮꾩쫰?덉뒪 ?곸꽭 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎.");
                    }
                },
                error: function(xhr) {
                    alert("?쒕쾭 ?듭떊 ?ㅻ쪟 (" + xhr.status + ")");
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
                    alert("??뺤쒔 ???뻿 ??살첒 (" + xhr.status + ")");
                }
            });
        }

        function openBusinessModal(businessId) {
            if ($('#businessForm').length === 0) return;

            $('#businessForm')[0].reset();
            $('#businessId').val("0");
            $('#businessModalTitleText').html('<i class="fas fa-plus-circle"></i> ??鍮꾩쫰?덉뒪 ?깅줉');
            $('#businessSubmitBtn').text('?깅줉?섍린');

            if (!businessId) {
                $('#businessModal').fadeIn(200);
                return;
            }

            loadBusinessDetail(businessId, function(data) {
                $('#businessModalTitleText').html('<i class="fas fa-edit"></i> 鍮꾩쫰?덉뒪 ?뺣낫 ?섏젙');
                $('#businessSubmitBtn').text('?섏젙?섍린');
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
                $('#businessModalTitleText').html('<i class="fas fa-plus-circle"></i> ??鍮꾩쫰?덉뒪 ?깅줉');
                $('#businessSubmitBtn').text('?깅줉?섍린');
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
                        alert("??λ릺?덉뒿?덈떎.");
                        closeBusinessModal();
                        loadAdminContent(ctx + "/admin/store-info");
                        return;
                    }

                    if (result === "fail:business_name_empty") {
                        alert("鍮꾩쫰?덉뒪紐낆쓣 ?낅젰??二쇱꽭??");
                        return;
                    }
                    if (result === "fail:zip_code_empty") {
                        alert("?고렪踰덊샇瑜??낅젰??二쇱꽭??");
                        return;
                    }
                    if (result === "fail:address_empty") {
                        alert("二쇱냼瑜??낅젰??二쇱꽭??");
                        return;
                    }
                    if (result === "fail:user_id_invalid") {
                        alert("?뚯썝 踰덊샇瑜??щ컮瑜닿쾶 ?낅젰??二쇱꽭??");
                        return;
                    }

                    alert("??μ뿉 ?ㅽ뙣?덉뒿?덈떎.");
                },
                error: function(xhr) {
                    alert("?쒕쾭 ?듭떊 ?ㅻ쪟 (" + xhr.status + ")");
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
            return numericValue.toLocaleString('ko-KR') + '\uC6D0';
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
                .text('鍮꾩??덉뒪 ?뺣낫瑜??뺤씤?섎젮硫???쓣 ?좏깮??二쇱꽭??');
            $('#detailAuthTotalCount').text('0');
            $('#detailAuthQrCount').text('0');
            $('#detailAuthReceiptCount').text('0');
            $('#detailAuthPaymentAmount').text('0\uC6D0');
            $('#detailAuthSettlementAmount').text('0\uC6D0');
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
                    .text('LQ_BUSINESS_AUTH_LOG 湲곗? ?몄쬆 ?붿빟 ?뺣낫?낅땲??');
            } else {
                $('#businessAuthStatus')
                    .removeClass('is-error')
                    .text('?깅줉???몄쬆 ?대젰???놁뒿?덈떎.');
            }
        }

        function loadBusinessAuthSummary(businessId) {
            if (!(businessId > 0) || businessDetailAuthLoading) {
                return;
            }

            businessDetailAuthLoading = true;
            $('#businessAuthStatus')
                .removeClass('is-error')
                .text('鍮꾩??덉뒪 ?뺣낫瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎.');

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
                    let message = '鍮꾩??덉뒪 ?뺣낫瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲??';
                    if (xhr && xhr.status === 404) {
                        message = '?대떦 留ㅼ옣 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎.';
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
                    .text('留ㅼ옣 湲곕낯 ?뺣낫瑜?癒쇱? ?뺤씤??二쇱꽭??');
                return;
            }

            if (businessDetailAuthLoadedFor === businessId) {
                return;
            }

            loadBusinessAuthSummary(businessId);
        }

        function deleteBusiness(businessId) {
            if (!confirm("?뺣쭚濡?鍮꾩쫰?덉뒪瑜???젣?섏떆寃좎뒿?덇퉴?")) return;

            $.ajax({
                url: ctx + "/admin/store-info/delete",
                type: "POST",
                data: { businessId: businessId },
                success: function(res) {
                    if (res.trim() === "success") {
                        alert("??젣?섏뿀?듬땲??");
                        loadAdminContent(ctx + "/admin/store-info");
                    } else {
                        alert("??젣???ㅽ뙣?덉뒿?덈떎.");
                    }
                },
                error: function(xhr) {
                    alert("?쒕쾭 ?듭떊 ?ㅻ쪟 (" + xhr.status + ")");
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
            else alert("臾몄쓽 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎.");
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
    $("#businessSubmitBtn").text('?깅줉');
    if (!businessId) {
        $('#businessModal').fadeIn(200);
        return;
    }
    loadBusinessDetail(businessId, function(data) {
        $('#businessModalTitleText').html('<i class="fas fa-edit"></i> 留ㅼ옣 ?섏젙');
        $('#businessSubmitBtn').text('?섏젙');
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
    $('#businessModalTitleText').html('<i class="fas fa-file-signature"></i> 怨꾩빟 ?꾨즺 ?깅줉');
    $("#businessSubmitBtn").text('怨꾩빟 ?깅줉');
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
        $("#businessSubmitBtn").text('?깅줉');
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
                            '<button type="button" class="adm-b-btn-view" onclick="viewBusinessInquiryDetail(' + inquiryId + ')">?곸꽭</button>'
                        );
                    }
                }
                closeBusinessModal();
                showBusinessTab('business');
                loadBusinessAdmin('business');
            } else {
                if (res.trim() === "fail:business_name_empty") {
                    alert("留ㅼ옣紐낆쓣 ?낅젰??二쇱꽭??");
                } else if (res.trim() === "fail:zip_code_empty") {
                    alert("?고렪踰덊샇瑜??낅젰??二쇱꽭??");
                } else if (res.trim() === "fail:address_empty") {
                    alert("二쇱냼瑜??낅젰??二쇱꽭??");
                } else if (res.trim() === "fail:user_id_invalid") {
                    alert("?뚯썝踰덊샇瑜??뺤씤??二쇱꽭??");
                } else {
                    alert(res.trim());
                }
            }
        },
        error: function(xhr) {
            alert("?쒕쾭 ?듭떊 ?ㅻ쪟 (" + xhr.status + ")");
        }
    });
}

function deleteBusiness(businessId) {
    if (!confirm("留ㅼ옣????젣?섏떆寃좎뒿?덇퉴?")) return;
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
                .off('load.businessQr error.businessQr')
                .attr('src', '');
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
                    const qrImageSrc = res.imageUrl + '&_ts=' + Date.now();

                    $('#businessQrStatus')
                        .removeClass('is-error')
                        .text('\u0051\u0052 \uC774\uBBF8\uC9C0\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.');
                    $('#businessQrBusinessName').text(res.businessName || '-');
                    $('#businessQrLocationName').text(res.locationName || '-');
                    $('#businessQrAddress').text(addressText || '-');
                    $('#businessQrAuthKey').text(res.qrAuthKey || '-');
                    $('#businessQrImage')
                        .removeClass('is-ready')
                        .off('load.businessQr error.businessQr')
                        .on('load.businessQr', function() {
                            if (this.complete && this.naturalWidth > 0) {
                                $(this).addClass('is-ready');
                                $('#businessQrStatus')
                                    .removeClass('is-error')
                                    .text('\uB9E4\uC7A5 \u0051\u0052 \uCF54\uB4DC\uB97C \uD655\uC778\uD558\uC138\uC694.');
                            }
                        })
                        .on('error.businessQr', function() {
                            $(this).removeClass('is-ready');
                            $('#businessQrStatus')
                                .addClass('is-error')
                                .text('\u0051\u0052 \uC774\uBBF8\uC9C0\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.');
                        })
                        .attr('src', qrImageSrc);
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
            const $qrImage = $('#businessQrImage');
            const qrImageElement = $qrImage.get(0);
            const imageSrc = $qrImage.attr('src') || '';

            if (!imageSrc || !$qrImage.hasClass('is-ready') || !qrImageElement || !qrImageElement.complete || qrImageElement.naturalWidth <= 0) {
                alert('\uCD9C\uB825\uD560 \u0051\u0052 \uC774\uBBF8\uC9C0\uAC00 \uC544\uC9C1 \uC900\uBE44\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.');
                return;
            }

            const printWindow = window.open('', 'businessQrPrint', 'width=900,height=900');
            if (!printWindow) {
                alert('\uD31D\uC5C5 \uCC28\uB2E8\uC73C\uB85C \uCD9C\uB825 \uCC3D\uC744 \uC5F4\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.');
                return;
            }

            const writePrintDocument = function(resolvedImageSrc) {
                const escapedBusinessName = '';
                const escapedLocationName = '';
                const escapedAddress = '';
                const escapedAuthKey = '';
                const escapedImageSrc = escapeAdminHtml(resolvedImageSrc || '');

                const printDocumentHtml = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>留ㅼ옣 QR 異쒕젰</title>
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
        <div id="printQrError" style="display:none; padding:24px; text-align:center; color:#b42318; font-size:18px; font-weight:700;">
            QR ?대?吏瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲??
        </div>
        <h1 class="print-title">留ㅼ옣 QR 肄붾뱶</h1>
        <div class="print-card">
            <div class="print-qr">
                <img id="printBusinessQrImage" src="__PRINT_QR_IMAGE_SRC__" alt="留ㅼ옣 QR 肄붾뱶" />
            </div>
            <div class="print-meta">
                <div class="print-row">
                    <div class="print-label">留ㅼ옣紐?/div>
                    <div class="print-value">__PRINT_BUSINESS_NAME__</div>
                </div>
                <div class="print-row">
                    <div class="print-label">????μ냼紐?/div>
                    <div class="print-value">__PRINT_LOCATION_NAME__</div>
                </div>
                <div class="print-row">
                    <div class="print-label">二쇱냼</div>
                    <div class="print-value">__PRINT_ADDRESS__</div>
                </div>
                <div class="print-row">
                    <div class="print-label">?몄쬆??/div>
                    <div class="print-value">__PRINT_AUTH_KEY__</div>
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
            const showError = function() {
                const errorMessage = document.getElementById('printQrError');
                if (errorMessage) {
                    errorMessage.style.display = 'block';
                }
                if (image) {
                    image.style.display = 'none';
                }
            };

            if (!image) {
                showError();
                return;
            }

            if (image.complete && image.naturalWidth > 0) {
                doPrint();
                return;
            }

            image.onload = function() {
                if (image.naturalWidth > 0) {
                    doPrint();
                    return;
                }
                showError();
            };
            image.onerror = showError;

            window.setTimeout(function() {
                if (image.complete && image.naturalWidth > 0) {
                    doPrint();
                    return;
                }
                if (image.complete) {
                    showError();
                }
            }, 500);
        })();
    <\/script>
</body>
<\/html>`;

                printWindow.document.open();
                printWindow.document.write(
                    printDocumentHtml
                        .replace('__PRINT_QR_IMAGE_SRC__', escapedImageSrc)
                        .replace('__PRINT_BUSINESS_NAME__', escapedBusinessName)
                        .replace('__PRINT_LOCATION_NAME__', escapedLocationName)
                        .replace('__PRINT_ADDRESS__', escapedAddress)
                        .replace('__PRINT_AUTH_KEY__', escapedAuthKey)
                );
                printWindow.document.close();
            };

            const absoluteImageSrc = (function() {
                try {
                    return new URL(imageSrc, window.location.origin).toString();
                } catch (error) {
                    return imageSrc;
                }
            })();
            const printableImageSrc = (function() {
                try {
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    if (!context) {
                        return absoluteImageSrc;
                    }

                    canvas.width = qrImageElement.naturalWidth;
                    canvas.height = qrImageElement.naturalHeight;
                    context.drawImage(qrImageElement, 0, 0);
                    return canvas.toDataURL('image/png');
                } catch (error) {
                    return absoluteImageSrc;
                }
            })();
            const fallbackImageSrc = absoluteImageSrc;
            const preloadPrintableImage = function(primarySrc, fallbackSrc) {
                const primaryImage = new Image();
                primaryImage.onload = function() {
                    writePrintDocument(primarySrc);
                };
                primaryImage.onerror = function() {
                    if (!fallbackSrc || fallbackSrc === primarySrc) {
                        writePrintDocument('');
                        return;
                    }

                    const fallbackImage = new Image();
                    fallbackImage.onload = function() {
                        writePrintDocument(fallbackSrc);
                    };
                    fallbackImage.onerror = function() {
                        writePrintDocument('');
                    };
                    fallbackImage.src = fallbackSrc;
                };
                primaryImage.src = primarySrc;
            };

            preloadPrintableImage(printableImageSrc, fallbackImageSrc);
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
                alert('嫄곗젅 ?ъ쑀瑜??낅젰??二쇱꽭??');
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
                        alert("臾몄쓽 ??젣???ㅽ뙣?덉뒿?덈떎.");
                    }
                },
                error: function(xhr) {
                    alert("?쒕쾭 ?듭떊 ?ㅻ쪟 (" + xhr.status + ")");
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
                    } else alert("?곹깭 蹂寃쎌뿉 ?ㅽ뙣?덉뒿?덈떎.");
                },
                error: function(xhr) {
                    alert("?쒕쾭 ?듭떊 ?ㅻ쪟 (" + xhr.status + ")");
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
                    } else alert("臾몄쓽 ??젣???ㅽ뙣?덉뒿?덈떎.");
                },
                error: function(xhr) {
                    alert("?쒕쾭 ?듭떊 ?ㅻ쪟 (" + xhr.status + ")");
                }
            });
        }
