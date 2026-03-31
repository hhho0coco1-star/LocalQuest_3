# QR 인증 방식 정리

## 1. 개요

현재 LocalQuest 백엔드에서 QR 인증은 크게 2가지 방식으로 동작한다.

1. 매장 QR 스캔형 인증
- 사용자가 매장에 비치된 QR을 스캔
- 프론트 `/qr/verify?key=...` 로 진입
- 백엔드 `/api/qr/verify` 가 같은 `qrAuthKey`를 받아
- 해당 사용자에게 열려 있는 진행중 퀘스트들 중 같은 `location_id`를 가진 대상을 찾아 한 번에 반영

2. 특정 퀘스트 장소 직접 인증
- 이미 특정 `userQuestId`, `questLocationId`를 알고 있는 상태에서
- `/api/user-quests/me/{userQuestId}/locations/{questLocationId}/qr-verification`
- 이 경로로 해당 장소 1개를 직접 인증

즉, 현재 구조는
- "매장 QR을 스캔해서 자동 매칭"
- "특정 퀘스트 장소에 대해 명시적으로 QR 검증"
두 흐름이 모두 있다.

## 2. 관련 핵심 파일

- QR 스캔 API: `src/main/java/com/app/controller/api/QrAPIController.java`
- 특정 장소 QR 인증 API: `src/main/java/com/app/controller/api/UserQuestAPIController.java`
- 실제 QR 검증 로직: `src/main/java/com/app/service/userquest/impl/UserQuestServiceImpl.java`
- 매장 QR URL 생성: `src/main/java/com/app/controller/AdminBusinessQrController.java`
- 진행중 퀘스트 대상 조회 SQL: `src/main/webapp/WEB-INF/mybatis/mapper/userquestprogress/userquestprogress_mapper.xml`
- QR 엔티티 조회 SQL: `src/main/webapp/WEB-INF/mybatis/mapper/locationqr/locationqr_mapper.xml`

## 3. 실제 엔드포인트 정리

### 3-1. 스캔형 QR 인증 API

- 프론트 진입 URL: `GET /qr/verify?key={qrAuthKey}`
- 백엔드 호출 URL: `POST /api/qr/verify?qrAuthKey={qrAuthKey}`
- 컨트롤러: `QrAPIController.verifyQr(...)`
- 서비스: `UserQuestServiceImpl.verifyLocationQr(...)`

### 3-2. 특정 장소 직접 인증 API

- 호출 URL:
  `POST /api/user-quests/me/{userQuestId}/locations/{questLocationId}/qr-verification?qrAuthKey={qrAuthKey}`
- 컨트롤러: `UserQuestAPIController.verifyQrAndCompleteLocation(...)`
- 서비스: `UserQuestServiceImpl.verifyQrAndCompleteLocation(...)`

### 3-3. 관리자 QR 정보 조회 API

- 호출 URL: `GET /admin/store-info/qr?businessId={businessId}`
- 역할:
  - 현재 매장의 `qrAuthKey`
  - QR 이미지 URL
  - 프론트 verify URL
  를 내려준다.

## 4. 인증에 필요한 기본 조건

QR 인증이 실제 반영되려면 아래 조건이 맞아야 한다.

- 로그인 사용자여야 한다.
- 세션 로그인 또는 `Authorization: Bearer <token>` 둘 다 허용한다.
- QR은 활성 상태여야 한다.
- 대상 퀘스트는 사용자가 이미 수락한 상태여야 한다.
- 대상 `userQuest` 상태는 `IN_PROGRESS` 여야 한다.
- 대상 장소 카테고리는 `EXPERIENCE` 여야 한다.
- 퀘스트 장소의 `location_id` 와 QR이 연결된 `location_id` 가 같아야 한다.
- 다중 장소 퀘스트라면 이전 방문 순서 장소가 먼저 완료되어 있어야 한다.
- 스캔 시점에 제한시간이 지난 퀘스트는 반영되지 않는다.

## 5. 매장 QR 스캔형 인증 흐름

### 4-1. QR URL 생성

관리자 매장정보관리에서 QR 정보를 열면 백엔드가 `verifyUrl` 을 만든다.

- QR verify URL 형식: `/qr/verify?key={qrAuthKey}`
- 실제 URL 생성은 `LocationQrServiceImpl.buildQrVerifyUrl(...)`

여기서 생성된 URL은 프론트 QR 확인 페이지로 연결된다.

### 5-2. 프론트에서 백엔드 호출

프론트는 최종적으로 아래 API로 인증키를 전달한다.

- `POST /api/qr/verify?qrAuthKey={qrAuthKey}`

컨트롤러는 로그인 사용자를 확인한 뒤 `userQuestService.verifyLocationQr(userId, qrAuthKey)` 를 호출한다.

### 5-3. 백엔드 대상 매칭 방식

백엔드는 먼저 `qrAuthKey` 로 활성 QR을 찾는다.

- 활성 QR 없음: `유효한 QR 코드가 아닙니다.`
- 최신 QR은 있는데 비활성: 정지/비활성 QR 메시지

그다음 아래 조건으로 반영 대상을 조회한다.

- `USER_ID = 현재 로그인 사용자`
- `LOCATION_ID = QR이 가리키는 location_id`
- `USER_QUEST.STATUS = IN_PROGRESS`
- 삭제 퀘스트 제외

즉 이 방식은 "사용자 + 장소" 기준 자동 매칭이다.

## 6. 중요한 현재 구조 특징

### 5-1. 한 번 스캔으로 여러 퀘스트에 반영될 수 있음

현재 `/api/qr/verify` 는 특정 퀘스트 1개를 고정해서 찾지 않는다.

같은 사용자가 진행중인 퀘스트 중에서
- 같은 `location_id`
- 같은 장소를 포함한 퀘스트

가 여러 개 있으면, 한 번 스캔으로 여러 `userQuest` 에 대해 결과가 생성될 수 있다.

### 5-2. `location_id` 가 가장 중요함

주소명, 상호명, 설명이 같아도 `location_id` 가 다르면 QR 인증은 매칭되지 않는다.

실제로 반영되는 기준은 문자열이 아니라 DB의 `location_id` 이다.

### 5-3. `EXPERIENCE` 전용

QR 인증은 체험형 장소만 허용한다.

- `VISIT` 는 GPS 인증
- `PURCHASE` 는 영수증 인증
- `EXPERIENCE` 만 QR 인증

## 7. `/api/qr/verify` 내부 처리 순서

`UserQuestServiceImpl.verifyLocationQr(...)` 기준 흐름은 아래와 같다.

1. `qrAuthKey` 공백 여부 확인
2. 활성 QR 조회
3. 현재 사용자 + 현재 `location_id` 로 진행중 대상 목록 조회
4. 대상이 없으면 "현재 진행 중인 퀘스트 중 해당 장소를 인증할 대상이 없습니다." 반환
5. 대상마다 상세 퀘스트 정보 재조회
6. 실제 목표 장소를 찾음
7. 장소 카테고리가 `EXPERIENCE` 인지 확인
8. 제한시간 만료 여부 확인
9. 이전 방문 순서 완료 여부 확인
10. 아직 미완료면 `LQ_USER_QUEST_PROGRESS` 완료 처리
11. 남은 미완료 장소 수 재계산
12. 남은 장소가 0이면 `completeQuest(...)` 호출
13. 보상/배지 반영 결과까지 응답에 포함

## 8. 특정 장소 직접 QR 인증 흐름

특정 퀘스트의 특정 장소 1개만 명시적으로 인증하려면 아래 API를 쓴다.

- `POST /api/user-quests/me/{userQuestId}/locations/{questLocationId}/qr-verification?qrAuthKey={qrAuthKey}`

이 방식은 자동 매칭이 아니라,
- 현재 사용자
- 특정 `userQuestId`
- 특정 `questLocationId`

를 먼저 고정하고, 그 장소의 저장된 QR 인증키와 입력값을 비교한다.

### 이 경로의 특징

- 반영 대상이 1개로 고정된다.
- 명시적으로 특정 장소 인증 UI를 만들 때 적합하다.
- 자동 스캔형보다 디버깅이 쉽다.

## 9. 성공 시 실제로 바뀌는 것

QR 인증이 성공하면 아래 순서로 상태가 변한다.

1. `LQ_USER_QUEST_PROGRESS.IS_COMPLETED = 1`
2. `COMPLETED_AT` 기록
3. 남은 장소 수 재계산
4. 남은 장소가 0이면 `LQ_USER_QUEST.STATUS = COMPLETED`
5. 퀘스트 보상 반영
6. 배지 지급 평가

## 10. 응답에서 봐야 하는 핵심 값

`/api/qr/verify` 응답에서는 아래 필드를 보면 된다.

- `qrAuthKey`
- `locationId`
- `locationName`
- `matchedQuestCount`
- `verifiedQuestCount`
- `completedQuestCount`
- `results`
- `newlyAwardedBadges`
- `message`

특히 테스트할 때는 아래 2개가 중요하다.

- `verifiedQuestCount`
- `completedQuestCount`

## 11. 대표 실패 케이스

### 로그인 없음
- 401
- 로그인 필요 메시지 반환

### QR 키가 틀림
- 404 또는 충돌 메시지

### 비활성 QR
- 비활성/정지 QR 메시지

### 같은 장소를 가진 진행중 퀘스트가 없음
- 성공 응답이더라도 `results = []`
- 반영 대상 없음 메시지 반환

### 장소 카테고리가 EXPERIENCE 아님
- QR 인증 대상 장소가 아님

### 방문 순서 안 맞음
- 이전 장소부터 인증해야 한다는 메시지

### 제한시간 초과
- 만료된 퀘스트는 QR 반영 불가

## 12. 스캔형과 직접 인증형의 차이

| 구분 | 스캔형 `/api/qr/verify` | 직접 인증형 `/qr-verification` |
| --- | --- | --- |
| 매칭 기준 | `userId + locationId + IN_PROGRESS` | `userQuestId + questLocationId + qrAuthKey` |
| 한 번에 반영되는 수 | 여러 퀘스트 가능 | 대상 1개 고정 |
| 사용 시점 | 실제 매장 QR 스캔 | 특정 장소 상세 화면에서 명시적 인증 |
| 디버깅 난이도 | 상대적으로 어려움 | 상대적으로 쉬움 |
| 핵심 리스크 | `location_id` 불일치 시 실패 | 잘못된 `userQuestId` / `questLocationId` 시 실패 |

## 13. 백엔드 단독 테스트 추천 순서

1. 로그인
- `POST /api/users/login`

2. 퀘스트 수락
- `POST /api/user-quests/accept?questId={questId}`
- 또는 `POST /api/quests/{questId}/accept`

3. 내 퀘스트 상태 확인
- `GET /api/user-quests/me`
- `GET /api/user-quests/me/{userQuestId}`

4. 매장 QR 정보 확인
- `GET /admin/store-info/qr?businessId={businessId}`

5. QR 인증
- 자동 매칭형: `POST /api/qr/verify?qrAuthKey={qrAuthKey}`
- 특정 장소형: `POST /api/user-quests/me/{userQuestId}/locations/{questLocationId}/qr-verification?qrAuthKey={qrAuthKey}`

6. 다시 상태 확인
- `GET /api/user-quests/me/{userQuestId}`

## 14. 실무상 꼭 기억할 점

- 현재 스캔형 인증은 "특정 퀘스트 1개"가 아니라 "같은 장소를 포함한 진행중 퀘스트들"을 자동 매칭한다.
- 따라서 운영 데이터에서는 `location_id` 정합성이 가장 중요하다.
- 체험형(`EXPERIENCE`)만 QR 인증 대상이다.
- 멀티 장소 퀘스트는 이전 순서가 끝나지 않으면 QR이 있어도 반영되지 않는다.
- 실제 현장 테스트 전에는 먼저 직접 인증형 API로 한 번 검증해보는 것이 디버깅에 유리하다.

## 12. 테스트용 최소 성공 시나리오

가장 단순한 검증은 아래 조합이다.

- 퀘스트 1개
- 장소 1개
- 장소 카테고리 `EXPERIENCE`
- 활성 QR 존재
- 테스트 사용자 1명이 수락

이 조합이면
- QR 인증 성공
- 장소 완료 반영
- 퀘스트 완료
를 가장 짧게 확인할 수 있다.

## 13. 현재 구조상 주의사항

- 프론트 QR URL의 `localhost` / IP 전환은 별도 설정 이슈다.
- 자동 스캔형은 "사용자 + 장소" 기준이라 여러 퀘스트에 동시 반영될 수 있다.
- 운영에서 "정확히 특정 퀘스트 하나만 완료" 가 필요하면 자동 매칭형만으로는 부족할 수 있다.
