<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt"%>

<c:set var="path" value="${pageContext.request.contextPath}" />
<link rel="stylesheet"
	href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="${path}/css/admin-quest.css">

<div class="adm-q-container">
	<div class="adm-q-header">
		<h2 class="adm-q-title">
			<i class="fas fa-scroll"></i> 퀘스트 관리
		</h2>

		<div class="adm-q-controls">
			<select id="filterStatus" onchange="searchQuest()">
				<option value="">모든 상태</option>
				<option value="ACTIVE" ${param.status == 'ACTIVE' ? 'selected' : ''}>활성화</option>
				<option value="INACTIVE"
					${param.status == 'INACTIVE' ? 'selected' : ''}>비활성화</option>
			</select>

			<div class="adm-q-search-box">
				<input type="text" id="searchQuestName" placeholder="퀘스트 이름 검색..."
					value="${param.keyword}"
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
		<c:forEach var="quest" items="${questList}">
			<div class="adm-q-card ${quest.status}">
				<div class="adm-q-card-header">
					<span class="adm-q-category">${quest.category}</span> <span
						class="adm-q-status-badge">${quest.status}</span>
				</div>

				<div class="adm-q-card-body"
					onclick="editQuestModal({
                        id: '${quest.questId}',
                        title: '${quest.title}',
                        category: '${quest.category}',
                        exp: '${quest.rewardExp}',
                        point: '${quest.rewardPoint}',
                        desc: '${quest.description.replace("
					'", "\\'")}'
                     })" 
                     style="cursor: pointer;"
					title="클릭하여 수정">
					<h3 class="adm-q-card-title">${quest.title}</h3>
					<p class="adm-q-card-desc">${quest.description}</p>
				</div>

				<div class="adm-q-reward">
					<div class="reward-item">
						<i class="fas fa-star exp-icon"></i> <span>${quest.rewardExp}
							EXP</span>
					</div>
					<div class="reward-item">
						<i class="fas fa-coins point-icon"></i> <span>${quest.rewardPoint}
							PT</span>
					</div>
				</div>

				<div class="adm-q-card-footer">
					<c:choose>
						<c:when test="${quest.status == 'ACTIVE'}">
							<button class="btn-q-stop"
								onclick="updateQuestStatus(${quest.questId}, 'INACTIVE')">비활성화</button>
						</c:when>
						<c:otherwise>
							<button class="btn-q-start"
								onclick="updateQuestStatus(${quest.questId}, 'ACTIVE')">활성화</button>
						</c:otherwise>
					</c:choose>
					<button class="btn-q-delete"
						onclick="updateQuestStatus(${quest.questId}, 'DELETED')">삭제</button>
				</div>
			</div>
		</c:forEach>
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

			<div class="modal-body">
				<div class="input-group">
					<label>퀘스트 제목</label> <input type="text" id="m_title" name="title"
						placeholder="퀘스트 제목을 입력하세요" required>
				</div>
				<div class="input-group">
					<label>카테고리</label> <select id="m_category" name="category">
						<option value="DAILY">DAILY</option>
						<option value="MAIN">MAIN</option>
						<option value="SUB">SUB</option>
						<option value="EVENT">EVENT</option>
					</select>
				</div>
				<div class="input-group">
					<label>보상 경험치(EXP)</label> <input type="number" id="m_exp"
						name="rewardExp" value="0" min="0">
				</div>
				<div class="input-group">
					<label>보상 포인트(PT)</label> <input type="number" id="m_point"
						name="rewardPoint" value="0" min="0">
				</div>
				<div class="input-group">
					<label>설명</label>
					<textarea id="m_desc" name="description" rows="4"
						placeholder="퀘스트 상세 내용을 입력하세요" required></textarea>
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn-cancel" onclick="closeQuestModal()">취소</button>
				<button type="button" class="btn-submit" id="modalSubmitBtn"
					onclick="submitQuest()">등록하기</button>
			</div>
		</form>
	</div>
</div>
