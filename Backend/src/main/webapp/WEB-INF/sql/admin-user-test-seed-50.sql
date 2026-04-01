-- 관리자 회원 목록/페이지네이션 테스트용 50명 데이터
-- 공통 로그인 비밀번호(원문): Test1234!
-- BCrypt 해시: $2a$10$Kbgyms5rugX1JKRgEH.G4.63SqD1Z6ekLKb/CP8dt2JNYq8BHDXDa
-- 같은 USER_LOGIN_ID가 이미 있으면 해당 행은 건너뜁니다.

DECLARE
    v_password CONSTANT VARCHAR2(255) := '$2a$10$Kbgyms5rugX1JKRgEH.G4.63SqD1Z6ekLKb/CP8dt2JNYq8BHDXDa';
BEGIN
    FOR i IN 1..50 LOOP
        INSERT INTO LQ_USER (
            USER_ID,
            USER_LOGIN_ID,
            NAME,
            EMAIL,
            PASSWORD,
            NICKNAME,
            BIRTH,
            GENDER,
            ROLE,
            EXP,
            POINT,
            STATUS,
            CREATED_AT
        )
        SELECT
            SEQ_LQ_USER_PK.NEXTVAL,
            'testuser' || LPAD(i, 2, '0'),
            '테스트회원' || LPAD(i, 2, '0'),
            'testuser' || LPAD(i, 2, '0') || '@localquest.test',
            v_password,
            '테스트닉네임' || LPAD(i, 2, '0'),
            ADD_MONTHS(DATE '1995-01-01', i - 1),
            CASE WHEN MOD(i, 2) = 0 THEN 'F' ELSE 'M' END,
            CASE
                WHEN i BETWEEN 1 AND 42 THEN 'USER'
                WHEN i BETWEEN 43 AND 48 THEN 'BUSINESS'
                ELSE 'ADMIN'
            END,
            MOD(i * 125, 5000),
            MOD(i * 700, 15000),
            'ACTIVE',
            SYSDATE - i
        FROM dual
        WHERE NOT EXISTS (
            SELECT 1
            FROM LQ_USER
            WHERE USER_LOGIN_ID = 'testuser' || LPAD(i, 2, '0')
        );
    END LOOP;

    COMMIT;
END;
/
