import { Fragment, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { rewardApi } from "../../api/RewardApi";
import "./rewardPage.css";

const DEFAULT_LEVEL_BOX = {
  nickname: "",
  currentLevel: 12,
  currentGradeName: "워커",
  point: 3200,
  nextLevel: 13,
  nextLevelRemainXp: 580,
  progressPercent: 72,
  nextGradeName: "가이드",
  nextGradeMinLevel: 16,
  remainLevelToNextGrade: 4,
  roadmap: [
    { gradeName: "비기너", minLevel: 1, maxLevel: 5 },
    { gradeName: "워커", minLevel: 6, maxLevel: 15 },
    { gradeName: "가이드", minLevel: 16, maxLevel: 30 },
    { gradeName: "챌린저", minLevel: 31, maxLevel: 50 },
    { gradeName: "레전드", minLevel: 51, maxLevel: null },
  ],
};

const GRADE_ICON_MAP = {
  비기너: "✓",
  워커: "🚶",
  가이드: "🚩",
  챌린저: "🏅",
  레전드: "👑",
};

const STATUS_TABS = [
  { id: "ALL", label: "전체" },
  { id: "ON_SALE", label: "판매중" },
  { id: "SOLD_OUT", label: "품절" },
];

const DEFAULT_WEEKLY_STATS = {
  questDone: 0,
  gainXp: 0,
  usedCoupon: 0,
  topPercent: 100,
  weeklyProgress: 0,
};

const BADGE_ICON_MAP = {
  badge_first_exchange: "🎉",
  badge_exchange_runner: "🛍️",
  badge_point_master: "💎",
};

function resolveNicknameFromClient(authNickname = "") {
  if (typeof window === "undefined") {
    return "";
  }

  const queryNickname = new URLSearchParams(window.location.search).get("nickname");
  if (queryNickname && queryNickname.trim()) {
    return queryNickname.trim();
  }

  if (authNickname && authNickname.trim()) {
    return authNickname.trim();
  }

  const storageKeys = ["lq_nickname", "nickname", "userNickname"];
  for (const key of storageKeys) {
    const storedValue = window.localStorage.getItem(key);
    if (storedValue && storedValue.trim()) {
      return storedValue.trim();
    }
  }

  const rawAuth = window.localStorage.getItem("lq_auth");
  if (rawAuth) {
    try {
      const parsedAuth = JSON.parse(rawAuth);
      const nestedNickname = parsedAuth?.user?.nickname ?? parsedAuth?.nickname;
      if (nestedNickname && String(nestedNickname).trim()) {
        return String(nestedNickname).trim();
      }
    } catch {
      // ignore malformed local storage payload
    }
  }

  return "";
}

function toSafeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return "-";
  }

  if (typeof dateValue === "string") {
    const normalized = dateValue.trim();
    if (normalized.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(normalized)) {
      return normalized.slice(0, 10);
    }
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeRewardItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => {
    const rewardItemId = Math.max(
      1,
      toSafeNumber(item?.rewardItemId ?? item?.REWARD_ITEM_ID, index + 1),
    );
    const stock = Math.max(0, toSafeNumber(item?.stock ?? item?.STOCK, 0));
    const rawStatus = String(item?.status ?? item?.STATUS ?? "")
      .trim()
      .toUpperCase();
    const status = rawStatus || (stock > 0 ? "ON_SALE" : "SOLD_OUT");

    return {
      REWARD_ITEM_ID: rewardItemId,
      NAME: item?.name ?? item?.NAME ?? "이름 없는 쿠폰",
      DESCRIPTION: item?.description ?? item?.DESCRIPTION ?? "",
      PRICE_POINT: Math.max(0, toSafeNumber(item?.pricePoint ?? item?.PRICE_POINT, 0)),
      STOCK: stock,
      STATUS: status,
      CREATED_AT: formatDateLabel(item?.createdAt ?? item?.CREATED_AT),
    };
  });
}

function normalizeWeeklyStats(stats) {
  return {
    questDone: Math.max(0, toSafeNumber(stats?.questDone, DEFAULT_WEEKLY_STATS.questDone)),
    gainXp: Math.max(0, toSafeNumber(stats?.gainXp, DEFAULT_WEEKLY_STATS.gainXp)),
    usedCoupon: Math.max(0, toSafeNumber(stats?.usedCoupon, DEFAULT_WEEKLY_STATS.usedCoupon)),
    topPercent: Math.min(
      100,
      Math.max(1, toSafeNumber(stats?.topPercent, DEFAULT_WEEKLY_STATS.topPercent)),
    ),
    weeklyProgress: Math.min(
      100,
      Math.max(0, toSafeNumber(stats?.weeklyProgress, DEFAULT_WEEKLY_STATS.weeklyProgress)),
    ),
  };
}

function normalizeWalletCoupons(coupons) {
  if (!Array.isArray(coupons)) {
    return [];
  }

  return coupons.map((coupon, index) => ({
    id: coupon?.exchangeId ?? coupon?.id ?? `wallet-${index}`,
    name: coupon?.name ?? "쿠폰",
    store: coupon?.store ?? "리워드 상점",
    expire: coupon?.expire ?? "만료일 미정",
    urgent: Boolean(coupon?.urgent),
  }));
}

function normalizeRewardBadges(badges) {
  if (!Array.isArray(badges)) {
    return [];
  }

  return badges.map((badge, index) => {
    const badgeId = Math.max(1, toSafeNumber(badge?.badgeId, index + 1));
    return {
      badgeId,
      name: badge?.name ?? `배지 ${badgeId}`,
      description: badge?.description ?? "",
      conditionText: badge?.conditionText ?? "",
      iconUrl: badge?.iconUrl ?? "",
      earnedAt: formatDateLabel(badge?.earnedAt),
    };
  });
}

function getBadgeIcon(iconUrl) {
  const key = String(iconUrl ?? "").trim();
  if (!key) {
    return "🏅";
  }

  return BADGE_ICON_MAP[key] ?? "🏅";
}

function getExchangeErrorMessage(error) {
  const payload = error?.response?.data;
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  const message = payload?.message;
  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  return "교환 처리 중 오류가 발생했습니다.";
}

function normalizeRoadmapItems(roadmap) {
  if (!Array.isArray(roadmap) || roadmap.length === 0) {
    return DEFAULT_LEVEL_BOX.roadmap;
  }

  return roadmap.map((item, index) => {
    const fallback = DEFAULT_LEVEL_BOX.roadmap[index] ?? {};
    const minLevel = toSafeNumber(item?.minLevel, toSafeNumber(fallback.minLevel, 1));
    const maxLevelRaw = item?.maxLevel;
    const maxLevel =
      maxLevelRaw === null || maxLevelRaw === undefined ? null : toSafeNumber(maxLevelRaw, null);

    return {
      gradeName: item?.gradeName ?? fallback.gradeName ?? `등급 ${index + 1}`,
      minLevel,
      maxLevel,
    };
  });
}

function formatRoadmapLevel(minLevel, maxLevel) {
  if (maxLevel === null || maxLevel === undefined) {
    return `Lv.${minLevel}+`;
  }
  return `Lv.${minLevel}~${maxLevel}`;
}

function isRoadmapDone(item, currentLevel) {
  if (item.maxLevel === null || item.maxLevel === undefined) {
    return false;
  }
  return currentLevel > item.maxLevel;
}

function isRoadmapCurrent(item, currentLevel) {
  if (currentLevel < item.minLevel) {
    return false;
  }
  if (item.maxLevel === null || item.maxLevel === undefined) {
    return true;
  }
  return currentLevel <= item.maxLevel;
}

function getGradeIcon(gradeName, fallback = "🏃") {
  return GRADE_ICON_MAP[gradeName] ?? fallback;
}

function formatPoint(value) {
  return `${value.toLocaleString()} P`;
}

function getRewardTheme(rewardItemId) {
  const themes = ["rose", "orange", "sky", "emerald", "amber", "purple"];
  return themes[(rewardItemId - 1) % themes.length];
}

function isOnSaleItem(item) {
  return item.STATUS === "ON_SALE" && item.STOCK > 0;
}

function getStockPercent(stock) {
  return Math.min(100, Math.max(6, stock));
}

function toRankingRow(row) {
  const rankValue = Number(row.ranking ?? row.rank);
  const totalExpValue = Number(row.totalExp ?? row.exp ?? 0);
  const levelValue = Number(row.levelNo ?? row.level);

  const safeRank = Number.isFinite(rankValue) ? rankValue : 0;
  const safeTotalExp = Number.isFinite(totalExpValue) ? totalExpValue : 0;
  const levelText = Number.isFinite(levelValue) && levelValue > 0 ? `LV.${levelValue}` : "LV.--";

  return {
    rank: safeRank,
    icon: "🏃",
    name: row.nickname ?? row.name ?? "알 수 없음",
    xp: `${safeTotalExp.toLocaleString()} XP`,
    level: levelText,
    isMe: Boolean(row.isMe),
  };
}

function RewardPage() {
  const authNickname = useSelector((state) => state.auth?.user?.nickname ?? "");
  const authUserId = useSelector((state) => toSafeNumber(state.auth?.user?.userId, 0));
  const resolvedNickname = useMemo(
    () => resolveNicknameFromClient(authNickname),
    [authNickname],
  );

  const [levelBox, setLevelBox] = useState(null);
  const [isLevelBoxLoading, setIsLevelBoxLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [wallet, setWallet] = useState([]);
  const [isWalletLoading, setIsWalletLoading] = useState(true);
  const [rewardItems, setRewardItems] = useState([]);
  const [isRewardItemsLoading, setIsRewardItemsLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState(DEFAULT_WEEKLY_STATS);
  const [rankingList, setRankingList] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortType, setSortType] = useState("latest");
  const [badges, setBadges] = useState([]);
  const [isBadgesLoading, setIsBadgesLoading] = useState(true);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [xpAnimated, setXpAnimated] = useState(false);
  const [weeklyAnimated, setWeeklyAnimated] = useState(false);

  useEffect(() => {
    const xpTimer = window.setTimeout(() => setXpAnimated(true), 400);
    const weeklyTimer = window.setTimeout(() => setWeeklyAnimated(true), 450);
    return () => {
      window.clearTimeout(xpTimer);
      window.clearTimeout(weeklyTimer);
    };
  }, []);

  useEffect(() => {
    if (!showToast) return undefined;
    const timer = window.setTimeout(() => setShowToast(false), 3000);
    return () => window.clearTimeout(timer);
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;

    const loadLevelBoxSummary = async () => {
      try {
        if (isMounted) {
          setIsLevelBoxLoading(true);
        }

        const nickname = resolvedNickname;
        if (!nickname) {
          if (isMounted) {
            setLevelBox(null);
            setPoints(0);
          }
          return;
        }

        const response = await rewardApi.getRewardSummary(nickname);
        const data = response?.data;

        if (!isMounted) {
          return;
        }

        if (!data || data.currentLevel == null || data.point == null) {
          setLevelBox(null);
          setPoints(0);
          return;
        }

        const currentLevel = Math.max(1, toSafeNumber(data.currentLevel, DEFAULT_LEVEL_BOX.currentLevel));
        const nextLevel = Math.max(currentLevel + 1, toSafeNumber(data.nextLevel, currentLevel + 1));
        const point = Math.max(0, toSafeNumber(data.point, DEFAULT_LEVEL_BOX.point));
        const nextLevelRemainXp = Math.max(
          0,
          toSafeNumber(data.nextLevelRemainXp, DEFAULT_LEVEL_BOX.nextLevelRemainXp),
        );
        const progressPercent = Math.min(
          100,
          Math.max(0, toSafeNumber(data.progressPercent, DEFAULT_LEVEL_BOX.progressPercent)),
        );
        const nextGradeMinLevel = data.nextGradeMinLevel == null
          ? null
          : Math.max(currentLevel + 1, toSafeNumber(data.nextGradeMinLevel, currentLevel + 1));
        const remainLevelToNextGrade = nextGradeMinLevel == null
          ? 0
          : Math.max(
              0,
              toSafeNumber(data.remainLevelToNextGrade, nextGradeMinLevel - currentLevel),
            );

        setLevelBox({
          nickname: data.nickname ?? "",
          currentLevel,
          currentGradeName: data.currentGradeName ?? DEFAULT_LEVEL_BOX.currentGradeName,
          point,
          nextLevel,
          nextLevelRemainXp,
          progressPercent,
          nextGradeName: data.nextGradeName ?? DEFAULT_LEVEL_BOX.nextGradeName,
          nextGradeMinLevel,
          remainLevelToNextGrade,
          roadmap: normalizeRoadmapItems(data.roadmap),
        });

        setPoints(point);
      } catch (error) {
        if (isMounted) {
          console.error("리워드 상단 박스 조회 실패:", error);
          setLevelBox(null);
          setPoints(0);
        }
      } finally {
        if (isMounted) {
          setIsLevelBoxLoading(false);
        }
      }
    };

    loadLevelBoxSummary();

    return () => {
      isMounted = false;
    };
  }, [resolvedNickname]);

  useEffect(() => {
    let isMounted = true;

    const loadBadges = async () => {
      try {
        if (isMounted) {
          setIsBadgesLoading(true);
        }

        const nickname = resolvedNickname;
        if (!nickname) {
          if (isMounted) {
            setBadges([]);
          }
          return;
        }

        const response = await rewardApi.getRewardBadges(nickname);
        if (!isMounted) {
          return;
        }

        setBadges(normalizeRewardBadges(response?.data));
      } catch (error) {
        if (isMounted) {
          console.error("배지 목록 조회 실패:", error);
          setBadges([]);
        }
      } finally {
        if (isMounted) {
          setIsBadgesLoading(false);
        }
      }
    };

    loadBadges();

    return () => {
      isMounted = false;
    };
  }, [resolvedNickname]);

  useEffect(() => {
    let isMounted = true;

    const loadWallet = async () => {
      try {
        if (isMounted) {
          setIsWalletLoading(true);
        }

        const nickname = resolvedNickname;
        if (!nickname) {
          if (isMounted) {
            setWallet([]);
          }
          return;
        }

        const response = await rewardApi.getRewardWallet(nickname);
        const data = response?.data;

        if (!isMounted) {
          return;
        }

        if (!Array.isArray(data)) {
          setWallet([]);
          return;
        }

        setWallet(normalizeWalletCoupons(data));
      } catch (error) {
        if (isMounted) {
          console.error("쿠폰 보관함 조회 실패:", error);
          setWallet([]);
        }
      } finally {
        if (isMounted) {
          setIsWalletLoading(false);
        }
      }
    };

    loadWallet();

    return () => {
      isMounted = false;
    };
  }, [resolvedNickname]);

  useEffect(() => {
    let isMounted = true;

    const loadRewardItems = async () => {
      try {
        if (isMounted) {
          setIsRewardItemsLoading(true);
        }

        const response = await rewardApi.getRewardItems();
        const data = response?.data;

        if (!isMounted) {
          return;
        }

        setRewardItems(normalizeRewardItems(data));
      } catch (error) {
        if (isMounted) {
          console.error("쿠폰 상점 조회 실패:", error);
          setRewardItems([]);
        }
      } finally {
        if (isMounted) {
          setIsRewardItemsLoading(false);
        }
      }
    };

    loadRewardItems();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadWeeklyStats = async () => {
      try {
        const nickname = resolvedNickname;
        if (!nickname) {
          if (isMounted) {
            setWeeklyStats(DEFAULT_WEEKLY_STATS);
          }
          return;
        }

        const response = await rewardApi.getRewardWeeklyStats(nickname);
        if (!isMounted) {
          return;
        }

        setWeeklyStats(normalizeWeeklyStats(response?.data));
      } catch (error) {
        if (isMounted) {
          console.error("이번 주 활동 조회 실패:", error);
          setWeeklyStats(DEFAULT_WEEKLY_STATS);
        }
      }
    };

    loadWeeklyStats();

    return () => {
      isMounted = false;
    };
  }, [resolvedNickname]);

  useEffect(() => {
    let isMounted = true;

    const loadRankings = async () => {
      try {
        const response = await rewardApi.getRankings();
        const rankingList = Array.isArray(response?.data) ? response.data : [];
        const mapped = rankingList
          .map(toRankingRow)
          .filter((row) => row.rank > 0)
          .sort((a, b) => a.rank - b.rank);

        if (!isMounted) {
          return;
        }

        setRankingList(mapped);

        const myNickname = levelBox?.nickname?.trim() || resolvedNickname;
        const myRow = mapped.find((row) => (
          row.isMe
          || row.name.includes("(나)")
          || (myNickname && row.name === myNickname)
        ));
        if (myRow) {
          setMyRank({
            ...myRow,
            name: myRow.name.includes("(나)") ? myRow.name : `${myRow.name} (나)`,
          });
        } else {
          setMyRank(null);
        }
      } catch (error) {
        if (isMounted) {
          console.error("실시간 랭킹 조회 실패:", error);
          setRankingList([]);
          setMyRank(null);
        }
      }
    };

    loadRankings();
    const timerId = window.setInterval(loadRankings, 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(timerId);
    };
  }, [levelBox?.nickname, resolvedNickname]);

  const visibleItems = useMemo(() => {
    const filtered = rewardItems.filter((item) => {
      if (statusFilter === "ALL") {
        return item.STATUS !== "HIDDEN";
      }
      return item.STATUS === statusFilter;
    });

    if (sortType === "low") {
      return [...filtered].sort((a, b) => a.PRICE_POINT - b.PRICE_POINT);
    }
    if (sortType === "high") {
      return [...filtered].sort((a, b) => b.PRICE_POINT - a.PRICE_POINT);
    }

    return [...filtered].sort((a, b) => new Date(b.CREATED_AT) - new Date(a.CREATED_AT));
  }, [rewardItems, statusFilter, sortType]);

  const realtimeTop5 = useMemo(() => rankingList.slice(0, 5), [rankingList]);
  const roadmapItems = useMemo(() => normalizeRoadmapItems(levelBox?.roadmap), [levelBox?.roadmap]);
  const currentGradeIcon = useMemo(
    () => getGradeIcon(levelBox?.currentGradeName, "🚶"),
    [levelBox?.currentGradeName],
  );
  const nextGradeLabel = useMemo(() => {
    if (!levelBox) {
      return "";
    }
    if (levelBox.nextGradeMinLevel == null) {
      return "최종 등급";
    }
    return `${levelBox.nextGradeName} (Lv.${levelBox.nextGradeMinLevel})`;
  }, [levelBox]);

  const canPurchase = (item) => {
    return isOnSaleItem(item) && points >= item.PRICE_POINT;
  };

  const openRankingModal = () => {
    setIsRankingModalOpen(true);
  };

  const closeRankingModal = () => {
    setIsRankingModalOpen(false);
  };

  const openPurchaseModal = (item) => {
    if (!authUserId) {
      showToastMessage("로그인한 사용자만 교환할 수 있어요.");
      return;
    }

    if (!canPurchase(item)) return;
    setPendingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPendingItem(null);
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const confirmPurchase = async () => {
    if (!pendingItem) return;
    if (!authUserId) {
      showToastMessage("로그인한 사용자만 교환할 수 있어요.");
      return;
    }

    if (isExchanging) {
      return;
    }

    try {
      setIsExchanging(true);
      const response = await rewardApi.exchangeReward({
        userId: authUserId,
        rewardItemId: pendingItem.REWARD_ITEM_ID,
      });

      const data = response?.data ?? {};
      const nextPoint = toSafeNumber(data.remainingPoint, points - pendingItem.PRICE_POINT);
      const nextStock = Math.max(0, toSafeNumber(data.updatedStock, pendingItem.STOCK - 1));
      const nextStatus = String(data.itemStatus ?? "").trim().toUpperCase() || (nextStock > 0 ? "ON_SALE" : "SOLD_OUT");
      const itemName = data.itemName ?? pendingItem.NAME;

      setPoints(Math.max(0, nextPoint));
      setRewardItems((prev) =>
        prev.map((item) => {
          if (item.REWARD_ITEM_ID !== pendingItem.REWARD_ITEM_ID) {
            return item;
          }

          return {
            ...item,
            STOCK: nextStock,
            STATUS: nextStatus,
          };
        }),
      );

      const walletCoupon = data.walletCoupon;
      if (walletCoupon) {
        const normalized = normalizeWalletCoupons([walletCoupon]);
        if (normalized.length > 0) {
          setWallet((prev) => [...normalized, ...prev]);
        }
      }

      const awardedBadges = normalizeRewardBadges(data.newlyAwardedBadges);
      if (awardedBadges.length > 0) {
        setBadges((prev) => {
          const existingIds = new Set(prev.map((badge) => badge.badgeId));
          const fresh = awardedBadges.filter((badge) => !existingIds.has(badge.badgeId));
          return [...fresh, ...prev];
        });

        const awardedNames = awardedBadges.map((badge) => badge.name).join(", ");
        showToastMessage(`🎉 ${itemName} 교환 완료! 새 배지 획득: ${awardedNames}`);
      } else {
        showToastMessage(`🎉 ${itemName} 교환이 완료됐어요!`);
      }

      closeModal();
    } catch (error) {
      showToastMessage(getExchangeErrorMessage(error));
    } finally {
      setIsExchanging(false);
    }
  };

  return (
    <div className="reward-page">
      <main className="reward-main">
        <section className="reward-top-grid">
          <div className="reward-left-column">
            {isLevelBoxLoading ? (
              <article className="reward-card reward-level-card">
                <div className="reward-level-placeholder">
                  <strong>등급 데이터를 불러오는 중입니다</strong>
                </div>
              </article>
            ) : levelBox ? (
              <article className="reward-card reward-level-card">
                <div className="reward-level-label-row">
                  <p>나의 등급</p>
                  <p>보유 포인트</p>
                </div>

                <div className="reward-level-summary-row">
                  <div className="reward-level-summary-left">
                    <strong className="reward-level-number">LV.{levelBox.currentLevel}</strong>
                    <span className="reward-grade-pill reward-grade-walker">
                      {currentGradeIcon} {levelBox.currentGradeName}
                    </span>
                  </div>
                  <strong className="reward-total-xp">{points.toLocaleString()}P</strong>
                </div>

                <div>
                  <div className="reward-level-progress-head">
                    <span>다음 레벨까지</span>
                    <span>{levelBox.nextLevelRemainXp.toLocaleString()} XP 남음</span>
                  </div>
                  <div className="reward-xp-bar">
                    <div className="reward-xp-fill" style={{ width: xpAnimated ? `${levelBox.progressPercent}%` : "0%" }} />
                  </div>
                  <div className="reward-level-progress-foot">
                    <span>LV.{levelBox.currentLevel}</span>
                    <span>{levelBox.progressPercent}% 달성</span>
                    <span>LV.{levelBox.nextLevel}</span>
                  </div>
                </div>

                <div className="reward-roadmap-wrap">
                  <p className="reward-roadmap-title">등급 로드맵</p>
                  <div className="reward-roadmap-track">
                    {roadmapItems.map((grade, index) => {
                      const done = isRoadmapDone(grade, levelBox.currentLevel);
                      const current = isRoadmapCurrent(grade, levelBox.currentLevel) && !done;
                      const isLegend = grade.gradeName === "레전드";
                      const nodeClassName = [
                        "reward-roadmap-node",
                        !done && !current ? "reward-is-future" : "",
                        !done && !current && isLegend ? "reward-is-legend" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <Fragment key={`${grade.gradeName}-${grade.minLevel}-${index}`}>
                          <div className={nodeClassName}>
                            <div
                              className={[
                                "reward-roadmap-badge",
                                done ? "reward-is-done" : "",
                                current ? "reward-is-current" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              {done ? "✓" : getGradeIcon(grade.gradeName)}
                            </div>
                            <p className={current ? "reward-is-current-text" : ""}>
                              {current ? `${grade.gradeName} (현재)` : grade.gradeName}
                            </p>
                            <span>{formatRoadmapLevel(grade.minLevel, grade.maxLevel)}</span>
                          </div>

                          {index < roadmapItems.length - 1 ? (
                            <div className={`reward-roadmap-line ${done ? "reward-is-done" : ""}`} />
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </div>
                </div>

                <div className="reward-guide-benefit-box">
                  <span className="reward-guide-benefit-emoji" aria-hidden="true">
                    {getGradeIcon(levelBox.nextGradeName, "🚩")}
                  </span>
                  <div className="reward-guide-benefit-content">
                    <p>{nextGradeLabel} 달성 시 혜택</p>
                    <strong>리워드 상점 <span>5% 상시 할인</span> 쿠폰 자동 지급</strong>
                  </div>
                  <div className="reward-guide-benefit-count">
                    <p>남은 레벨</p>
                    <strong>{levelBox.remainLevelToNextGrade}</strong>
                  </div>
                </div>
              </article>
            ) : (
              <article className="reward-card reward-level-card">
                <div className="reward-level-placeholder">
                  <strong>등급 데이터 없음</strong>
                  <span>연동 가능한 사용자 데이터가 없어서 표시할 수 없어요.</span>
                </div>
              </article>
            )}

            <article className="reward-card reward-wallet-card">
              <div className="reward-wallet-head">
                <h2>내 쿠폰 보관함</h2>
                <span>{wallet.length}개 보유</span>
              </div>

              {isWalletLoading ? (
                <div className="reward-wallet-empty">
                  <div className="reward-wallet-empty-label">쿠폰함</div>
                  <strong>쿠폰 데이터를 불러오는 중...</strong>
                </div>
              ) : wallet.length > 0 ? (
                <div className="reward-wallet-grid">
                  {wallet.map((coupon) => (
                    <article key={coupon.id} className="reward-ticket">
                      <span className="reward-ticket-notch reward-is-top" aria-hidden="true" />
                      <span className="reward-ticket-notch reward-is-bottom" aria-hidden="true" />

                      <div className={`reward-ticket-side ${coupon.urgent ? "reward-is-urgent" : ""}`}>쿠폰</div>

                      <div className="reward-ticket-content">
                        <div className="reward-ticket-title-row">
                          <h3>{coupon.name}</h3>
                          <span className={coupon.urgent ? "reward-is-urgent" : ""}>{coupon.expire}</span>
                        </div>
                        <p>{coupon.store}</p>
                        <button type="button" className="reward-ticket-use-button">바로 사용</button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="reward-wallet-empty">
                  <div className="reward-wallet-empty-label">쿠폰함</div>
                  <strong>보유한 쿠폰이 없어요</strong>
                  <span>상점에서 구매해보세요</span>
                </div>
              )}
            </article>
          </div>

          <div className="reward-right-column">
            <article className="reward-card reward-weekly-card">
              <p className="reward-weekly-title">이번 주 활동</p>
              <div className="reward-weekly-grid">
                <div>
                  <strong>{weeklyStats.questDone}</strong>
                  <p>퀘스트 완료</p>
                </div>
                <div className="reward-is-center">
                  <strong className="reward-is-primary">{weeklyStats.gainXp}</strong>
                  <p>획득 XP</p>
                </div>
                <div>
                  <strong>{weeklyStats.usedCoupon}</strong>
                  <p>사용 쿠폰</p>
                </div>
              </div>

              <div>
                <p className="reward-weekly-caption">
                  상위 <span>{weeklyStats.topPercent}%</span> 탐험가입니다 🎉
                </p>
                <div className="reward-xp-bar">
                  <div
                    className="reward-weekly-fill"
                    style={{ width: weeklyAnimated ? `${weeklyStats.weeklyProgress}%` : "0%" }}
                  />
                </div>
                <p className="reward-weekly-foot">주간 목표 {weeklyStats.weeklyProgress}% 달성</p>
              </div>
            </article>

            <article className="reward-card reward-badge-card">
              <div className="reward-badge-head">
                <h2>내 배지</h2>
                <span>{badges.length}개 획득</span>
              </div>

              {isBadgesLoading ? (
                <p className="reward-badge-empty">배지 데이터를 불러오는 중입니다.</p>
              ) : badges.length > 0 ? (
                <div className="reward-badge-list">
                  {badges.slice(0, 6).map((badge) => (
                    <article key={badge.badgeId} className="reward-badge-item">
                      <span className="reward-badge-icon" aria-hidden="true">
                        {getBadgeIcon(badge.iconUrl)}
                      </span>
                      <div className="reward-badge-copy">
                        <strong>{badge.name}</strong>
                        <p>{badge.conditionText || badge.description || "획득 조건 정보 준비 중"}</p>
                        <span>{badge.earnedAt}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="reward-badge-empty">아직 획득한 배지가 없어요.</p>
              )}
            </article>

            <article className="reward-card reward-rank-card">
              <div className="reward-rank-head">
                <h2>실시간 랭킹</h2>
                <span>이번 주</span>
              </div>

              <div className="reward-rank-list">
                {realtimeTop5.length > 0 ? (
                  <>
                    {realtimeTop5.map((row) => (
                      <div key={row.rank} className="reward-rank-row">
                        <span className={`reward-rank-num reward-rank-${row.rank}`}>{row.rank}</span>
                        <span className="reward-rank-avatar" aria-hidden="true">{row.icon}</span>
                        <div className="reward-rank-user">
                          <strong>{row.name}</strong>
                          <p>{row.xp}</p>
                        </div>
                        <span className="reward-rank-level">{row.level}</span>
                      </div>
                    ))}

                    {rankingList.length > realtimeTop5.length ? (
                      <div className="reward-rank-dots" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="reward-ranking-inline-empty">데이터 없음</p>
                )}
              </div>

              <button type="button" className="reward-rank-link" onClick={openRankingModal}>
                전체 랭킹 보기 →
              </button>
            </article>
          </div>
        </section>

        <section className="reward-shop-section">
          <div className="reward-shop-head">
            <div className="reward-shop-title-wrap">
              <h2>쿠폰 상점</h2>
            </div>

            <div className="reward-shop-controls">
              <div className="reward-tab-list" role="tablist" aria-label="리워드 상태 필터">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={statusFilter === tab.id}
                    className={`reward-tab-button ${statusFilter === tab.id ? "reward-is-active" : ""}`}
                    onClick={() => setStatusFilter(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <label className="reward-select-wrap">
                <span className="reward-sr-only">정렬 기준</span>
                <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
                  <option value="latest">최신 등록순</option>
                  <option value="low">낮은 포인트</option>
                  <option value="high">높은 포인트</option>
                </select>
              </label>
            </div>
          </div>

          {isRewardItemsLoading ? (
            <div className="reward-empty-state">
              <p>⏳</p>
              <strong>쿠폰 상점 데이터를 불러오는 중입니다</strong>
            </div>
          ) : visibleItems.length > 0 ? (
            <div className="reward-shop-grid">
              {visibleItems.map((item) => {
                const shortage = item.PRICE_POINT - points;
                const canBuy = canPurchase(item);
                const stockPercent = getStockPercent(item.STOCK);
                const itemTheme = getRewardTheme(item.REWARD_ITEM_ID);

                return (
                  <article
                    key={item.REWARD_ITEM_ID}
                    className={`reward-shop-card reward-shop-card-theme-${itemTheme} ${
                      item.STATUS !== "ON_SALE" ? "reward-is-locked" : ""
                    }`}
                  >
                    <div className="reward-shop-stripe" />

                    <div className="reward-shop-card-body">
                      {item.STATUS === "SOLD_OUT" ? <span className="reward-limited-badge">품절</span> : null}

                      <div className="reward-shop-card-top reward-is-single">
                        <div className="reward-shop-price-wrap">
                          <strong>{formatPoint(item.PRICE_POINT)}</strong>
                          <p>재고 {item.STOCK.toLocaleString()}개</p>
                        </div>
                      </div>

                      <h3>{item.NAME}</h3>
                      <p className="reward-shop-store">등록일 {item.CREATED_AT}</p>
                      <p className="reward-shop-expire">{item.DESCRIPTION || "상품 설명이 준비 중입니다."}</p>

                      <div className="reward-stock-wrap">
                        <div className="reward-stock-bar">
                          <div className="reward-stock-fill" style={{ width: `${stockPercent}%` }} />
                        </div>
                        <p>
                          {item.STATUS === "ON_SALE"
                            ? `판매중 · 재고 ${item.STOCK.toLocaleString()}개`
                            : item.STATUS === "SOLD_OUT"
                              ? "품절"
                              : "비공개"}
                        </p>
                      </div>

                      {shortage > 0 && item.STATUS === "ON_SALE" ? (
                        <div className="reward-shortage-hint">⚡ {shortage.toLocaleString()}P가 더 필요해요</div>
                      ) : null}

                      <button
                        type="button"
                        className={`reward-buy-button ${
                          !canBuy ? "reward-is-disabled" : ""
                        }`}
                        onClick={() => openPurchaseModal(item)}
                        disabled={!canBuy}
                      >
                        {item.STATUS === "HIDDEN"
                          ? "비공개 상품"
                          : item.STATUS === "SOLD_OUT" || item.STOCK <= 0
                            ? "품절"
                            : shortage > 0
                              ? `${shortage.toLocaleString()}P 부족`
                              : "교환하기"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="reward-empty-state">
              <p>🔍</p>
              <strong>해당 카테고리 쿠폰이 없어요</strong>
            </div>
          )}
        </section>
      </main>

      <div className={`reward-modal-overlay ${isRankingModalOpen ? "reward-is-open" : ""}`} onClick={closeRankingModal}>
        <section
          className="reward-modal-box reward-ranking-modal-box"
          role="dialog"
          aria-modal="true"
          aria-label="전체 랭킹"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="reward-ranking-modal-head">
            <h3>전체 랭킹</h3>
            <button type="button" className="reward-ranking-close" onClick={closeRankingModal}>닫기</button>
          </div>

          <div className="reward-ranking-modal-body">
            {rankingList.length > 0 ? (
              <div className="reward-rank-list reward-ranking-full-list">
                {rankingList.map((row) => {
                  const isMyRow = myRank ? row.rank === myRank.rank && row.name === myRank.name : row.isMe;
                  return (
                    <div key={`modal-${row.rank}-${row.name}`} className={`reward-rank-row ${isMyRow ? "reward-is-me" : ""}`}>
                      <span className={`reward-rank-num ${row.rank <= 5 ? `reward-rank-${row.rank}` : ""}`}>
                        {row.rank}
                      </span>
                      <span className="reward-rank-avatar" aria-hidden="true">{row.icon}</span>
                      <div className="reward-rank-user">
                        <strong>{row.name}</strong>
                        <p>{row.xp}</p>
                      </div>
                      <span className="reward-rank-level">{row.level}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="reward-ranking-empty">데이터 없음</p>
            )}
          </div>
        </section>
      </div>

      <div className={`reward-modal-overlay ${isModalOpen ? "reward-is-open" : ""}`} onClick={closeModal}>
        <section className="reward-modal-box" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className="reward-modal-head reward-no-emoji">
            <h3>{pendingItem?.NAME ?? ""}</h3>
            <p>{pendingItem ? `재고 ${pendingItem.STOCK.toLocaleString()}개` : ""}</p>
          </div>

          <div className="reward-modal-summary">
            <div>
              <span>현재 보유 포인트</span>
              <strong>{formatPoint(points)}</strong>
            </div>
            <div>
              <span>차감 포인트</span>
              <strong className="reward-is-minus">
                {pendingItem ? `- ${formatPoint(pendingItem.PRICE_POINT)}` : "-"}
              </strong>
            </div>
            <div className="reward-is-total">
              <span>구매 후 잔액</span>
              <strong>
                {pendingItem ? formatPoint(Math.max(points - pendingItem.PRICE_POINT, 0)) : formatPoint(points)}
              </strong>
            </div>
          </div>

          <p className="reward-modal-caption">구매한 쿠폰은 보관함에서 바로 사용 가능합니다</p>

          <div className="reward-modal-actions">
            <button
              type="button"
              className="reward-modal-button reward-is-cancel"
              onClick={closeModal}
              disabled={isExchanging}
            >
              취소
            </button>
            <button
              type="button"
              className="reward-modal-button reward-is-confirm"
              onClick={confirmPurchase}
              disabled={isExchanging}
            >
              {isExchanging ? "교환 처리 중..." : "구매 확정"}
            </button>
          </div>
        </section>
      </div>

      <div className={`reward-toast ${showToast ? "reward-is-show" : ""}`}>{toastMessage}</div>
    </div>
  );
}

export default RewardPage;
