import { useEffect, useMemo, useState } from "react";
import { BADGE_ACHIEVED_EVENT_NAME, normalizeAwardedBadges } from "./badgeToastEvent";
import "./BadgeAchievementToast.css";

const MAX_VISIBLE_BADGE_NAMES = 3;
const TOAST_VISIBLE_MS = 3200;
const TOAST_EXIT_MS = 220;

function toToastMessage(badges) {
  const normalized = normalizeAwardedBadges(badges);
  if (normalized.length === 0) {
    return "";
  }

  const names = normalized.map((badge) => badge.name);
  if (names.length === 1) {
    return `🏅 새 배지를 획득했어요: ${names[0]}`;
  }

  const visibleNames = names.slice(0, MAX_VISIBLE_BADGE_NAMES);
  if (names.length > MAX_VISIBLE_BADGE_NAMES) {
    visibleNames.push(`외 ${names.length - MAX_VISIBLE_BADGE_NAMES}개`);
  }
  return `🏅 새 배지를 획득했어요: ${visibleNames.join(", ")}`;
}

function BadgeAchievementToast() {
  const [pendingMessages, setPendingMessages] = useState([]);
  const [activeMessage, setActiveMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onBadgeAchieved = (event) => {
      const message = toToastMessage(event?.detail?.badges);
      if (!message) {
        return;
      }

      setPendingMessages((prev) => [...prev, message]);
    };

    window.addEventListener(BADGE_ACHIEVED_EVENT_NAME, onBadgeAchieved);
    return () => {
      window.removeEventListener(BADGE_ACHIEVED_EVENT_NAME, onBadgeAchieved);
    };
  }, []);

  useEffect(() => {
    if (activeMessage || pendingMessages.length === 0) {
      return;
    }

    setActiveMessage(pendingMessages[0]);
    setPendingMessages((prev) => prev.slice(1));
    setIsVisible(true);
  }, [activeMessage, pendingMessages]);

  useEffect(() => {
    if (!activeMessage) {
      return undefined;
    }

    const hideTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, TOAST_VISIBLE_MS);

    const clearTimer = window.setTimeout(() => {
      setActiveMessage("");
    }, TOAST_VISIBLE_MS + TOAST_EXIT_MS);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
    };
  }, [activeMessage]);

  const className = useMemo(
    () => `badge-achievement-toast ${isVisible ? "is-show" : ""}`.trim(),
    [isVisible]
  );

  if (!activeMessage) {
    return null;
  }

  return (
    <div className={className} role="status" aria-live="polite">
      {activeMessage}
    </div>
  );
}

export default BadgeAchievementToast;
