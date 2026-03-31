# QR Backend Workflow

## Current backend status

- Backend compile passes with `mvn -q -DskipTests compile`.
- QR-related APIs now accept either:
  - session login
  - `Authorization: Bearer <token>`
- `EXPERIENCE` quest locations must point to an existing location that has an active QR.
- Business representative locations managed by the QR service are normalized to `EXPERIENCE`.

## Data conditions required for QR completion

- The user must be logged in.
- The user must have accepted the quest.
- The user quest must be in `IN_PROGRESS`.
- The target quest location must use `locationCategory = EXPERIENCE`.
- The quest location must reference the same `location_id` as the business QR location.
- The business QR must be active.
- If the quest has multiple locations, all previous locations must already be completed.
- If the scanned QR completes the last remaining location, the quest is completed automatically.

## Backend-only verification flow

1. Login
   - `POST /api/users/login`
2. Accept quest
   - `POST /api/user-quests/accept?questId={questId}`
   - or `POST /api/quests/{questId}/accept`
3. Check my quest state
   - `GET /api/user-quests/me`
   - `GET /api/user-quests/me/{userQuestId}`
4. Read business QR info
   - `GET /admin/store-info/qr?businessId={businessId}`
5. Verify QR
   - `POST /api/qr/verify?qrAuthKey={qrAuthKey}`
   - or explicit location verification:
   - `POST /api/user-quests/me/{userQuestId}/locations/{questLocationId}/qr-verification?qrAuthKey={qrAuthKey}`
6. Re-check my quest detail
   - `GET /api/user-quests/me/{userQuestId}`

## Recommended first test scenario

- One quest
- One location
- `EXPERIENCE` category
- Active business QR
- Accepted by one test user

This is the shortest path to confirming:

- QR verification succeeds
- location progress is updated
- quest status changes to `COMPLETED`

## Pending item intentionally left out

- Frontend base URL / IP-based QR URL switching

That part should be handled separately when the test machine IP is finalized.
