# LocalQuest 🗺️

> 지역을 게임처럼 탐험하는 미션 기반 O2O 로컬 발견 플랫폼

## 프로젝트 소개

로컬 상권은 여전히 알려지지 않은 경우가 많고, 소비자는 가까운 지역을 탐험할 동기가 부족합니다.  
LocalQuest는 **퀘스트·포인트·배지 시스템**을 통해 지역 탐험을 게임처럼 만들어 O2O 연결을 자연스럽게 유도합니다.

| 항목 | 내용 |
|------|------|
| 기간 | 2026.03.09 ~ 2026.04.03 |
| 팀 구성 | 5명 |
| 담당 역할 | 팀 리더 · 풀스택 (비즈니스·관리자·QR) |

---

## 핵심 기능

- **미션 기반 퀘스트** — 지역 장소를 순서대로 방문하는 퀘스트 수행
- **QR 현장 인증** — 카메라로 스캔해 즉시 방문 인증 (부정 사용 방지 로직 포함)
- **비즈니스 대시보드** — 파트너가 매장 통계·쿠폰·QR을 직접 관리
- **포인트·배지 보상** — 퀘스트 완료 시 포인트·배지 자동 지급

---

## 기술 스택

### Backend
| 기술 | 선택 이유 |
|------|----------|
| Java 11 · Spring Framework | 교육 과정 기반, 안정적인 레거시 구조 이해 |
| Spring Security + JWT | React SPA는 stateless JWT, 관리자 JSP는 세션 — 클라이언트 성격에 맞게 인증 방식 이원화 |
| MyBatis | 비즈니스 대시보드의 통계 집계 쿼리를 SQL로 직접 제어하기 위해 선택 |
| OAuth2 | 소셜 로그인으로 사용자 가입 장벽 완화 |
| Web Push (VAPID) | 퀘스트 완료·보상 알림을 서버에서 브라우저로 즉시 전달 |
| Python OCR Server | 영수증 인증 자동화 — 이미지에서 텍스트 추출 |

### Frontend
| 기술 | 선택 이유 |
|------|----------|
| React + Redux Toolkit | 상호작용이 많은 사용자·비즈니스 화면은 SPA로 구현 |
| JSP (관리자) | 빠른 개발이 중요한 관리자 CRUD는 서버 렌더링으로 처리 |
| Kakao Map API | 위치 기반 퀘스트 탐색 지도 표시 |

### Database / Infra
`Oracle DB` · `Maven`

---

## 시스템 구조

```
Client Layer
  ├── React SPA (사용자·비즈니스)     포트 3000
  └── 브라우저 (관리자 JSP)
         ↓ HTTP
App Layer
  └── Spring Framework (Java 11)     포트 8080
        ├── REST API Controller  ← JWT 인증
        └── Admin Controller    ← 세션 인증
         ↓ MyBatis
Data Layer
  └── Oracle DB
External
  └── Kakao Map API · OAuth2 · Web Push · Python OCR
```

---

## 담당 역할

5인 팀 리더로서, 서비스 신뢰성을 좌우하는 **현장 인증(QR)** 과 운영의 중심인 **관리자·비즈니스** 영역을 풀스택으로 담당했습니다.  
QR 인증은 부정 사용을 막아야 하는 핵심 검증 로직이라 설계부터 구현까지 단독으로 책임졌습니다.

| 영역 | Frontend | Backend |
|------|----------|---------|
| 비즈니스 페이지 | 대시보드·QR탭·쿠폰탭·파트너센터 (React) | BusinessAPIController · Service · DAO |
| 관리자 페이지 | JSP 14개 페이지 | 세션 인증 · RoleBasedPageInterceptor |
| QR 시스템 | QR Scanner UI (React) | QR 생성·검증 API — LocationQrService · LocationQrDAO |

---

## 핵심 설계 포인트

### QR 인증 흐름
```
QR 스캔 → authKey 추출 → QrAPIController
  → 매장 운영 여부 확인
  → 방문 순서 / 시간 초과 / 중복 완료 검증
  → USER_QUEST_PROGRESS 업데이트
  → 영수증 인증 필요 여부 분기
  → 퀘스트 완료 시 포인트·배지 자동 지급
```

### 도메인 설계 핵심
- 퀘스트에 장소를 직접 컬럼으로 넣을 수도 있었지만, 한 장소가 여러 퀘스트에 **재사용**되고 방문 **순서**가 필요해 N:M 중간 테이블(`QUEST_LOCATION`)로 분리
- `USER_QUEST_PROGRESS`로 장소별 완료 여부를 독립 추적
- 영수증 인증(`RECEIPT`)을 PROGRESS와 1:1 연결해 인증 이력 관리

---

## 트러블슈팅

### QR 이미지 Blob URL 메모리 누수
- **문제**: QR 탭을 반복 진입·이탈 시 브라우저 메모리 점진적 증가
- **원인**: `URL.createObjectURL()` 생성 URL을 `revokeObjectURL()` 없이 방치
- **해결**: `useRef`로 활성 Blob URL 추적, `useEffect` cleanup에서 명시적 해제
- **결과**: 반복 진입·이탈 후에도 메모리 사용량 일정하게 유지 확인

---

## 프로젝트 구조

```
LocalQuest/
├── Backend/          # Spring Framework (Java 11)
│   └── src/
│       └── main/
│           ├── java/       # Controller · Service · DAO
│           ├── resources/  # MyBatis mapper · Spring config
│           └── webapp/     # JSP (관리자 페이지)
└── Frontend/         # React SPA
    └── src/
```
