import { formatDateYmd, formatDateYmdHm } from '../dateTime';

export const PASSWORD_MASK = '********';
export const BADGE_ICON_FALLBACK = '🏅';
const BADGE_ICON_MAP = {
    badge_first_step: '\uD83C\uDFAF',
    badge_quest_runner: '\uD83C\uDFC3',
    badge_local_regular: '\uD83C\uDFC6',
    badge_local_explorer: '\uD83E\uDDED',
    badge_first_reviewer: '\uD83D\uDCDD',
    badge_trusted_reviewer: '\u2705',
    badge_first_exchange: '\uD83C\uDF81',
    badge_exchange_runner: '\uD83D\uDECD\uFE0F',
    badge_point_master: '\uD83D\uDC8E',
};

export const MY_PAGE_TABS = [
    { key: 'profile', label: '개인정보 수정' },
    { key: 'myBadges', label: '내 배지' },
    { key: 'inquiryHistory', label: '1:1 문의내역' },
    { key: 'withdraw', label: '회원 탈퇴' },
];

export function toSafeNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeBadgeDashboard(rawDashboard) {
    if (!rawDashboard || typeof rawDashboard !== 'object') {
        return {
            catalog: [],
            earnedBadges: [],
        };
    }

    return {
        catalog: Array.isArray(rawDashboard.catalog) ? rawDashboard.catalog : [],
        earnedBadges: Array.isArray(rawDashboard.earnedBadges) ? rawDashboard.earnedBadges : [],
    };
}

export function formatDateValue(value) {
    return formatDateYmd(value, '-');
}

export function formatReviewCreatedAt(value) {
    return formatDateYmdHm(value, '-');
}

export function resolveInquiryStatusLabel(statusValue) {
    const normalized = String(statusValue ?? '').trim().toUpperCase();
    if (normalized === 'ANSWERED') {
        return '답변 완료';
    }
    return '답변 대기';
}

export function resolveGenderLabel(genderValue) {
    if (!genderValue) {
        return '-';
    }

    const normalized = String(genderValue).trim().toUpperCase();
    if (['M', 'MALE', '남', '남성'].includes(normalized)) {
        return '남성';
    }
    if (['F', 'FEMALE', '여', '여성'].includes(normalized)) {
        return '여성';
    }
    return String(genderValue);
}

export function resolveBadgeIconText(rawIconValue) {
    const normalized = String(rawIconValue ?? '').trim();
    if (!normalized) {
        return BADGE_ICON_FALLBACK;
    }

    const mappedIcon = BADGE_ICON_MAP[normalized.toLowerCase()];
    if (mappedIcon) {
        return mappedIcon;
    }

    if ([...normalized].length <= 2) {
        return normalized;
    }

    return BADGE_ICON_FALLBACK;
}

export function normalizeProfile(source, fallbackUser = null) {
    const data = source ?? {};
    const user = fallbackUser ?? {};

    const userId = Number(data.userId ?? user.userId ?? 0) || 0;
    const userLoginId = data.userLoginId ?? user.userLoginId ?? '';
    const name = data.name ?? user.name ?? '-';
    const email = data.email ?? user.email ?? '-';
    const nickname = data.nickname ?? user.nickname ?? '';
    const birth = data.birth ?? user.birth ?? user.birthday ?? user.birthDate ?? null;
    const gender = data.gender ?? user.gender ?? null;
    const createdAt = data.createdAt ?? data.created_at ?? user.createdAt ?? user.created_at ?? null;
    const role = data.role ?? user.role ?? '';
    const status = data.status ?? user.status ?? '';

    return {
        userId,
        userLoginId,
        name,
        email,
        nickname,
        birth,
        gender,
        createdAt,
        role,
        status,
        birthdayLabel: formatDateValue(birth),
        genderLabel: resolveGenderLabel(gender),
        createdAtLabel: formatDateValue(createdAt),
    };
}

export function buildMyBadgeItems(myBadgeCatalog, myEarnedBadges) {
    const earnedBadgeById = new Map();
    const earnedBadgeByName = new Map();

    myEarnedBadges.forEach((badge) => {
        const badgeId = toSafeNumber(badge?.badgeId);
        const badgeName = String(badge?.name ?? '').trim();
        if (badgeId > 0) {
            earnedBadgeById.set(badgeId, badge);
        }
        if (badgeName) {
            earnedBadgeByName.set(badgeName, badge);
        }
    });

    return myBadgeCatalog.map((badge, index) => {
        const badgeId = toSafeNumber(badge?.badgeId) || index + 1;
        const badgeName = String(badge?.name ?? '').trim();
        const badgeCode = `B${String(badgeId).padStart(3, '0')}`;
        const rawIconUrl = String(badge?.iconUrl ?? '').trim();
        const isImageIcon = /^https?:\/\//i.test(rawIconUrl) || rawIconUrl.startsWith('/');
        const iconText = isImageIcon ? BADGE_ICON_FALLBACK : resolveBadgeIconText(rawIconUrl);
        const linkedEarnedBadge =
            earnedBadgeById.get(badgeId) ??
            earnedBadgeByName.get(badgeName) ??
            null;
        const isEarned = Boolean(linkedEarnedBadge);

        return {
            badgeId,
            badgeCode,
            name: badgeName || `배지 #${badgeId}`,
            description: badge?.description || '-',
            conditionText: badge?.conditionText || '-',
            iconUrl: isImageIcon ? rawIconUrl : '',
            iconText,
            earnedAtLabel: linkedEarnedBadge?.earnedAt
                ? formatDateValue(linkedEarnedBadge.earnedAt)
                : '-',
            isEarned,
        };
    });
}

export function buildMyBadgeSummary(myBadgeItems) {
    const total = myBadgeItems.length;
    const earned = myBadgeItems.filter((badge) => badge.isEarned).length;
    const unearned = Math.max(0, total - earned);
    const completionRate = total > 0 ? Math.round((earned / total) * 100) : 0;

    return {
        total,
        earned,
        unearned,
        completionRate,
    };
}

export function buildMyBadgeHints(myBadgeItems) {
    return myBadgeItems
        .filter((badge) => !badge.isEarned)
        .sort((a, b) => a.badgeId - b.badgeId)
        .slice(0, 2);
}

export function buildFilteredMyBadgeItems(myBadgeItems, showEarnedBadgeOnly) {
    const baseItems = showEarnedBadgeOnly
        ? myBadgeItems.filter((badge) => badge.isEarned)
        : myBadgeItems;

    return [...baseItems].sort((a, b) => {
        if (a.isEarned !== b.isEarned) {
            return a.isEarned ? -1 : 1;
        }
        return a.badgeId - b.badgeId;
    });
}

export function hasProfileFormChanged(formState, profileNickname, initialPushEnabled) {
    const trimmedNickname = formState.nickname.trim();
    const hasNicknameChange = trimmedNickname !== profileNickname;
    const hasPasswordChange =
        formState.password.trim() !== '' && formState.password !== PASSWORD_MASK;
    const hasPushChange = formState.pushEnabled !== initialPushEnabled;

    return hasNicknameChange || hasPasswordChange || hasPushChange;
}
