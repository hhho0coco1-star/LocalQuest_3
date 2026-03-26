export const BADGE_ACHIEVED_EVENT_NAME = "localquest:badge-achieved";

const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toSafeText = (value) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export function normalizeAwardedBadges(rawBadges) {
  if (!Array.isArray(rawBadges)) {
    return [];
  }

  const uniqueKeySet = new Set();
  const normalized = [];

  rawBadges.forEach((badge, index) => {
    if (!badge || typeof badge !== "object") {
      return;
    }

    const badgeId = toSafeNumber(badge.badgeId);
    const name = toSafeText(badge.name);
    const iconUrl = toSafeText(badge.iconUrl);
    const key = badgeId > 0 ? `id-${badgeId}` : `name-${name || index}`;

    if (!name || uniqueKeySet.has(key)) {
      return;
    }

    uniqueKeySet.add(key);
    normalized.push({
      badgeId,
      name,
      iconUrl,
    });
  });

  return normalized;
}

export function emitBadgeAchievedEvent(rawBadges, meta = {}) {
  const badges = normalizeAwardedBadges(rawBadges);
  if (badges.length === 0) {
    return;
  }

  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(BADGE_ACHIEVED_EVENT_NAME, {
      detail: {
        badges,
        ...meta,
      },
    })
  );
}
