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
                    if (element) {
                        $('.admin-nav-item a').removeClass('active');
                        $(element).addClass('active');
                    }
                },
                error: function(xhr) {
                    console.error("로드 실패:", xhr.status);
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
                    alert("서버 통신 에러 (코드: " + xhr.status + ")");
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
            
            // 검색 시에도 contextPath(ctx) 활용
            const url = ctx + "/admin/search?type=" + type + "&keyword=" + encodeURIComponent(keyword);
            loadAdminContent(url);
        }

        /**
         * 회원번호 정렬 함수 (클라이언트 사이드 혹은 서버 사이드 선택 가능)
         * 여기서는 가장 깔끔한 '서버 재요청' 방식을 추천합니다.
         */
        function sortUserList() {
            currentSortOrder = (currentSortOrder === 'DESC') ? 'ASC' : 'DESC';
            const type = $('#searchType').val();
            const keyword = $('#keyword').val();
            
            // 검색 조건 유지하면서 정렬만 변경해서 다시 로드
            const url = ctx + "/admin/users?sort=" + currentSortOrder + "&type=" + type + "&keyword=" + keyword;
            loadAdminContent(url);
        }
        
        /**
         * 회원 상태 변경 (정지 등)
         */
        function updateStatus(userId, newStatus) {
            if (userId === 1) {
                alert("마스터 관리자는 정지할 수 없습니다.");
                return;
            }

            // [확인 절차] 한 번 더 물어보기
            const actionText = (newStatus === 'WITHDRAWN') ? "정지" : "변경";
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
                        
                        // [상태 유지 로드] 현재 화면의 검색어와 정렬값을 그대로 물고 다시 로드
                        const type = $('#searchType').val();
                        const keyword = $('#keyword').val();
                        // 정렬 아이콘 상태를 통해 현재 정렬 확인 (상단 헤더에 저장된 값 활용)
                        const sort = $('#sortIcon').hasClass('fa-sort-up') ? 'ASC' : 'DESC';
                        
                        const url = ctx + "/admin/search?type=" + type + "&keyword=" + encodeURIComponent(keyword) + "&sort=" + sort;
                        loadAdminContent(url);
                    } else {
                        alert("변경에 실패했습니다.");
                    }
                },
                error: function(xhr) {
                    alert("서버 통신 에러가 발생했습니다.");
                }
            });
        }
        
        function updateQuestStatus(questId, status) {
            const msg = status === 'DELETED' ? "정말 삭제하시겠습니까?" : `상태를 ${status}로 변경하시겠습니까?`;
            
            if (!confirm(msg)) return;

            $.ajax({
                url: ctx + "/admin/quests/updateStatus",
                type: "POST",
                data: { questId: questId, status: status },
                success: function(res) {
                    if (res === "success") {
                        alert("반영되었습니다.");
                        // 퀘스트 관리 페이지 다시 로드
                        loadAdminContent(ctx + "/admin/quests");
                    } else {
                        alert("처리에 실패했습니다.");
                    }
                }
            });
        }
        

        /**
         * [기존 함수 보완] 등록/수정 통합 제출
         */
        function submitQuest() {
            const form = $('#questForm')[0];
            const questId = $('#modalQuestId').val();
            
            // 수정인지 등록인지에 따라 URL 분기 (또는 하나의 URL에서 처리 가능)
            const url = (questId === "0") ? ctx + "/admin/quests/register" : ctx + "/admin/quests/update";
            
            const formData = $(form).serialize();

            $.ajax({
                url: url,
                type: "POST",
                data: formData,
                success: function(res) {
                    if (res.trim() === "success") {
                        alert(questId === "0" ? "등록되었습니다." : "수정되었습니다.");
                        closeQuestModal();
                        loadAdminContent(ctx + "/admin/quests");
                    } else {
                        alert("처리에 실패했습니다.");
                    }
                }
            });
        }

        /* --- admin.jsp 스크립트 영역 수정 --- */

        /**
         * [추가/수정] 새 퀘스트 모달 열기
         * (수정 모드였다가 다시 '새 등록'을 누를 때를 대비해 초기화 로직 추가)
         */
        function openQuestModal() {
            $('#modalQuestId').val("0"); // PK 초기화
            $('#questForm')[0].reset();  // 폼 초기화
            $('#questModal .adm-q-modal-header h3').html('<i class="fas fa-plus-circle"></i> 새 퀘스트 등록');
            $('#modalSubmitBtn').text('등록하기');
            $('#questModal').fadeIn(200);
        }

        /**
         * 수정 모달 열기 (기존 값 채우기)
         */
        function editQuestModal(data) {
            // 1. 모달 텍스트 및 버튼 변경
            $('#questModal .adm-q-modal-header h3').html('<i class="fas fa-edit"></i> 퀘스트 수정');
            $('#modalSubmitBtn').text('수정하기');
            
            // 2. 데이터 채우기 (admin-quest.jsp에 설정한 m_ ID들과 맞춤)
            $('#modalQuestId').val(data.id); 
            $('#m_title').val(data.title);
            $('#m_category').val(data.category);
            $('#m_exp').val(data.exp);
            $('#m_point').val(data.point);
            $('#m_desc').val(data.desc);
            
            // 3. 모달 열기
            $('#questModal').fadeIn(200);
        }

        /**
         * 모달 닫을 때 초기화 (이미 작성하신 코드 유지하되, 리셋 확인)
         */
        function closeQuestModal() {
            $('#questModal').fadeOut(200);
            setTimeout(function() { // 애니메이션 끝난 후 리셋 (시각적 깔끔함)
                $('#questForm')[0].reset();
                $('#modalQuestId').val("0");
                $('#questModal .adm-q-modal-header h3').html('<i class="fas fa-plus-circle"></i> 새 퀘스트 등록');
                $('#modalSubmitBtn').text('등록하기');
            }, 200);
        }
        
        /**
         * 퀘스트 검색 및 필터링
         */
        function searchQuest() {
            const status = $('#filterStatus').val(); // 활성/비활성 선택값
            const keyword = $('#searchQuestName').val(); // 검색어
            
            // URL 파라미터 조합
            const url = ctx + "/admin/quests?status=" + status + "&keyword=" + encodeURIComponent(keyword);
            
            // 기존에 만드신 콘텐츠 로더 함수 호출
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
            $('#itemModalTitleText').html('<i class="fas fa-edit"></i> 아이템 정보 수정');
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
            // 애니메이션이 끝난 후 데이터를 깨끗하게 비워줍니다.
            setTimeout(function() {
                $('#itemForm')[0].reset();
                $('#modalItemId').val("0");
                $('#itemModalTitleText').html('<i class="fas fa-plus-circle"></i> 새 리워드 등록');
                $('#itemSubmitBtn').text('등록하기');
            }, 200);
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
            $('.admin-nav-item a').first().addClass('active');
        });
    </script>
</body>
</html>
