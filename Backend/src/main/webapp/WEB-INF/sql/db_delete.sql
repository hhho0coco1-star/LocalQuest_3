-- db_query.sql 재적용 전 전체 정리용 삭제 스크립트
-- DROP TABLE 시 테이블에 연결된 인덱스는 함께 제거되므로 별도 DROP INDEX는 생략
DECLARE
    PROCEDURE drop_table_if_exists(p_table_name IN VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE 'DROP TABLE ' || p_table_name || ' CASCADE CONSTRAINTS PURGE';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE != -942 THEN
                RAISE;
            END IF;
    END;

    PROCEDURE drop_sequence_if_exists(p_sequence_name IN VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE 'DROP SEQUENCE ' || p_sequence_name;
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE != -2289 THEN
                RAISE;
            END IF;
    END;
BEGIN
    -- 자식/이력 테이블
    drop_table_if_exists('LQ_BUSINESS_COUPON_REQ_HIST');
    drop_table_if_exists('LQ_NOTIFICATION_LOG');
    drop_table_if_exists('LQ_RECEIPT');
    drop_table_if_exists('LQ_USER_QUEST_PROGRESS');
    drop_table_if_exists('LQ_QUEST_REVIEW');
    drop_table_if_exists('LQ_REWARD_EXCHANGE');
    drop_table_if_exists('LQ_USER_BADGE');
    drop_table_if_exists('LQ_USER_RANK');
    drop_table_if_exists('LQ_LOCATION_QR');
    drop_table_if_exists('LQ_SETTLEMENT');
    drop_table_if_exists('LQ_BUSINESS_AUTH_LOG');
    drop_table_if_exists('LQ_PUSH_SUBSCRIPTION');
    drop_table_if_exists('LQ_USER_NOTIFICATION_SETTING');
    drop_table_if_exists('LQ_POINT_HISTORY');
    drop_table_if_exists('LQ_USER_QUEST');
    drop_table_if_exists('LQ_QUEST_LOCATION');
    drop_table_if_exists('LQ_BUSINESS_COUPON_REQUEST');

    -- 기본 업무 테이블
    drop_table_if_exists('LQ_BUSINESS_INQUIRY');
    drop_table_if_exists('LQ_INQUIRY');
    drop_table_if_exists('LQ_NOTICE');
    drop_table_if_exists('LQ_FAQ');
    drop_table_if_exists('LQ_LOCATION');
    drop_table_if_exists('LQ_REWARD_ITEM');
    drop_table_if_exists('LQ_BADGE');
    drop_table_if_exists('LQ_QUEST');
    drop_table_if_exists('LQ_LEVEL_RANGE');
    drop_table_if_exists('LQ_GRADE_RANGE');
    drop_table_if_exists('LQ_BUSINESS');
    drop_table_if_exists('LQ_USER');

    -- 이전 스키마 호환용
    drop_table_if_exists('LQ_QUEST_CATEGORY');

    -- 시퀀스
    drop_sequence_if_exists('SEQ_LQ_USER_PK');
    drop_sequence_if_exists('SEQ_LQ_BUSINESS_PK');
    drop_sequence_if_exists('SEQ_LQ_QUEST_PK');
    drop_sequence_if_exists('SEQ_LQ_LOCATION_PK');
    drop_sequence_if_exists('SEQ_LQ_QUEST_LOCATION_PK');
    drop_sequence_if_exists('SEQ_LQ_USER_QUEST_PK');
    drop_sequence_if_exists('SEQ_LQ_QUEST_REVIEW_PK');
    drop_sequence_if_exists('SEQ_LQ_POINT_HISTORY_PK');
    drop_sequence_if_exists('SEQ_LQ_REWARD_ITEM_PK');
    drop_sequence_if_exists('SEQ_LQ_REWARD_EXCHANGE_PK');
    drop_sequence_if_exists('SEQ_LQ_BADGE_PK');
    drop_sequence_if_exists('SEQ_LQ_USER_BADGE_PK');
    drop_sequence_if_exists('SEQ_LQ_USER_RANK_PK');
    drop_sequence_if_exists('SEQ_LQ_BUSINESS_INQUIRY_PK');
    drop_sequence_if_exists('SEQ_LQ_NOTICE_PK');
    drop_sequence_if_exists('SEQ_LQ_FAQ_PK');
    drop_sequence_if_exists('SEQ_LQ_INQUIRY_PK');
    drop_sequence_if_exists('SEQ_LQ_USER_QUEST_PROGRESS_PK');
    drop_sequence_if_exists('SEQ_LQ_LEVEL_RANGE_PK');
    drop_sequence_if_exists('SEQ_LQ_GRADE_RANGE_PK');
    drop_sequence_if_exists('SEQ_LQ_QUEST_CATEGORY_PK');
    drop_sequence_if_exists('SEQ_LQ_RECEIPT_PK');
    drop_sequence_if_exists('SEQ_LQ_USER_NOTIFICATION_SETTING_PK');
    drop_sequence_if_exists('SEQ_LQ_PUSH_SUBSCRIPTION_PK');
    drop_sequence_if_exists('SEQ_LQ_NOTIFICATION_LOG_PK');
    drop_sequence_if_exists('SEQ_LQ_LOCATION_QR_PK');
    drop_sequence_if_exists('SEQ_LQ_SETTLEMENT_PK');
    drop_sequence_if_exists('SEQ_LQ_BC_REQ_PK');
    drop_sequence_if_exists('SEQ_LQ_BC_REQ_HIS_PK');
END;
/
