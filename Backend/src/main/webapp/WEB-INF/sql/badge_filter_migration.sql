-- Badge filter metadata migration script
-- Target: Oracle

-- 1) Add new columns for badge filtering/sorting metadata.
ALTER TABLE LQ_BADGE ADD (
    BADGE_CATEGORY   VARCHAR2(20),
    BADGE_DIFFICULTY VARCHAR2(10),
    TRIGGER_TYPE     VARCHAR2(30),
    DISPLAY_ORDER    NUMBER,
    IS_ACTIVE        CHAR(1)
);

-- 2) Backfill category/difficulty/trigger from existing icon key or badge text.
UPDATE LQ_BADGE
SET BADGE_CATEGORY =
    CASE
        WHEN LOWER(NVL(ICON_URL, '')) IN ('badge_first_exchange', 'badge_exchange_runner', 'badge_point_master')
            THEN 'BENEFIT'
        WHEN LOWER(NVL(ICON_URL, '')) IN ('badge_first_reviewer', 'badge_trusted_reviewer')
            THEN 'COMPLETE'
        WHEN LOWER(NVL(ICON_URL, '')) IN ('badge_local_explorer')
            THEN 'EXPLORE'
        WHEN LOWER(NVL(ICON_URL, '')) IN ('badge_first_step', 'badge_quest_runner', 'badge_local_regular')
            THEN 'HABIT'
        WHEN INSTR(LOWER(NVL(NAME, '') || ' ' || NVL(DESCRIPTION, '') || ' ' || NVL(CONDITION_TEXT, '')), '교환') > 0
            OR INSTR(LOWER(NVL(NAME, '') || ' ' || NVL(DESCRIPTION, '') || ' ' || NVL(CONDITION_TEXT, '')), '포인트') > 0
            OR INSTR(LOWER(NVL(NAME, '') || ' ' || NVL(DESCRIPTION, '') || ' ' || NVL(CONDITION_TEXT, '')), 'reward') > 0
            THEN 'BENEFIT'
        WHEN INSTR(LOWER(NVL(NAME, '') || ' ' || NVL(DESCRIPTION, '') || ' ' || NVL(CONDITION_TEXT, '')), '리뷰') > 0
            OR INSTR(LOWER(NVL(NAME, '') || ' ' || NVL(DESCRIPTION, '') || ' ' || NVL(CONDITION_TEXT, '')), 'review') > 0
            THEN 'COMPLETE'
        WHEN INSTR(LOWER(NVL(NAME, '') || ' ' || NVL(DESCRIPTION, '') || ' ' || NVL(CONDITION_TEXT, '')), '탐험') > 0
            OR INSTR(LOWER(NVL(NAME, '') || ' ' || NVL(DESCRIPTION, '') || ' ' || NVL(CONDITION_TEXT, '')), '방문') > 0
            OR INSTR(LOWER(NVL(NAME, '') || ' ' || NVL(DESCRIPTION, '') || ' ' || NVL(CONDITION_TEXT, '')), 'location') > 0
            THEN 'EXPLORE'
        ELSE 'HABIT'
    END,
    BADGE_DIFFICULTY =
    CASE
        WHEN LOWER(NVL(ICON_URL, '')) IN ('badge_local_regular', 'badge_point_master') THEN 'HARD'
        WHEN LOWER(NVL(ICON_URL, '')) IN ('badge_quest_runner', 'badge_local_explorer', 'badge_trusted_reviewer', 'badge_exchange_runner') THEN 'MID'
        WHEN LOWER(NVL(ICON_URL, '')) IN ('badge_first_step', 'badge_first_reviewer', 'badge_first_exchange') THEN 'EASY'
        WHEN REGEXP_LIKE(NVL(CONDITION_TEXT, ''), '([2-9][0-9]|[1-9][0-9]{3,})') THEN 'HARD'
        WHEN REGEXP_LIKE(NVL(CONDITION_TEXT, ''), '([5-9]|1[0-9])') THEN 'MID'
        ELSE 'EASY'
    END,
    TRIGGER_TYPE =
    CASE
        WHEN LOWER(NVL(ICON_URL, '')) IN ('badge_first_exchange', 'badge_exchange_runner', 'badge_point_master') THEN 'REWARD_EXCHANGE'
        WHEN LOWER(NVL(ICON_URL, '')) IN ('badge_first_reviewer', 'badge_trusted_reviewer') THEN 'REVIEW_CREATE'
        WHEN LOWER(NVL(ICON_URL, '')) IN ('badge_first_step', 'badge_quest_runner', 'badge_local_regular', 'badge_local_explorer') THEN 'QUEST_COMPLETE'
        WHEN INSTR(LOWER(NVL(NAME, '') || ' ' || NVL(DESCRIPTION, '') || ' ' || NVL(CONDITION_TEXT, '')), '교환') > 0
            OR INSTR(LOWER(NVL(NAME, '') || ' ' || NVL(DESCRIPTION, '') || ' ' || NVL(CONDITION_TEXT, '')), '포인트') > 0
            THEN 'REWARD_EXCHANGE'
        WHEN INSTR(LOWER(NVL(NAME, '') || ' ' || NVL(DESCRIPTION, '') || ' ' || NVL(CONDITION_TEXT, '')), '리뷰') > 0
            OR INSTR(LOWER(NVL(NAME, '') || ' ' || NVL(DESCRIPTION, '') || ' ' || NVL(CONDITION_TEXT, '')), 'review') > 0
            THEN 'REVIEW_CREATE'
        ELSE 'QUEST_COMPLETE'
    END,
    DISPLAY_ORDER = NVL(BADGE_ID, 0),
    IS_ACTIVE = 'Y';

-- 3) Ensure no NULL remains.
UPDATE LQ_BADGE
SET BADGE_CATEGORY = NVL(BADGE_CATEGORY, 'HABIT'),
    BADGE_DIFFICULTY = NVL(BADGE_DIFFICULTY, 'EASY'),
    TRIGGER_TYPE = NVL(TRIGGER_TYPE, 'QUEST_COMPLETE'),
    DISPLAY_ORDER = NVL(DISPLAY_ORDER, NVL(BADGE_ID, 0)),
    IS_ACTIVE = NVL(IS_ACTIVE, 'Y')
WHERE BADGE_CATEGORY IS NULL
   OR BADGE_DIFFICULTY IS NULL
   OR TRIGGER_TYPE IS NULL
   OR DISPLAY_ORDER IS NULL
   OR IS_ACTIVE IS NULL;

-- 4) Add defaults / NOT NULL and constraints.
ALTER TABLE LQ_BADGE MODIFY (BADGE_CATEGORY DEFAULT 'HABIT' NOT NULL);
ALTER TABLE LQ_BADGE MODIFY (BADGE_DIFFICULTY DEFAULT 'EASY' NOT NULL);
ALTER TABLE LQ_BADGE MODIFY (TRIGGER_TYPE DEFAULT 'QUEST_COMPLETE' NOT NULL);
ALTER TABLE LQ_BADGE MODIFY (DISPLAY_ORDER DEFAULT 0 NOT NULL);
ALTER TABLE LQ_BADGE MODIFY (IS_ACTIVE DEFAULT 'Y' NOT NULL);

ALTER TABLE LQ_BADGE ADD CONSTRAINT CHK_LQ_BADGE_CATEGORY
    CHECK (BADGE_CATEGORY IN ('HABIT', 'EXPLORE', 'COMPLETE', 'BENEFIT'));
ALTER TABLE LQ_BADGE ADD CONSTRAINT CHK_LQ_BADGE_DIFFICULTY
    CHECK (BADGE_DIFFICULTY IN ('EASY', 'MID', 'HARD'));
ALTER TABLE LQ_BADGE ADD CONSTRAINT CHK_LQ_BADGE_TRIGGER_TYPE
    CHECK (TRIGGER_TYPE IN ('QUEST_COMPLETE', 'REVIEW_CREATE', 'REWARD_EXCHANGE'));
ALTER TABLE LQ_BADGE ADD CONSTRAINT CHK_LQ_BADGE_DISPLAY_ORDER
    CHECK (DISPLAY_ORDER >= 0);
ALTER TABLE LQ_BADGE ADD CONSTRAINT CHK_LQ_BADGE_IS_ACTIVE
    CHECK (IS_ACTIVE IN ('Y', 'N'));

CREATE INDEX IDX_LQ_BADGE_CATEGORY ON LQ_BADGE (BADGE_CATEGORY, IS_ACTIVE, DISPLAY_ORDER);

COMMIT;
