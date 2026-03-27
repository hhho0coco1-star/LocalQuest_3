import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { badgeApi } from "../../../api/BadgeApi";
import "./badgePage.css";

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

  return "";
}

function formatEarnedAt(value) {
  if (!value) return "미획득";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "미획득";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function BadgePage() {
  const authNickname = useSelector((state) => state.auth?.user?.nickname ?? "");
  const nickname = useMemo(() => resolveNicknameFromClient(authNickname), [authNickname]);

  const [catalog, setCatalog] = useState([]);
  const [earnedBadgeNameSet, setEarnedBadgeNameSet] = useState(new Set());
  const [earnedMapByName, setEarnedMapByName] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadBadgePage = async () => {
      setIsLoading(true);
      try {
        const [catalogResponse, userBadgeResponse] = await Promise.all([
          badgeApi.getBadgeCatalog(),
          nickname ? badgeApi.getUserBadges(nickname) : Promise.resolve({ data: [] }),
        ]);

        if (!isMounted) return;

        const catalogRows = Array.isArray(catalogResponse?.data) ? catalogResponse.data : [];
        const userRows = Array.isArray(userBadgeResponse?.data) ? userBadgeResponse.data : [];

        setCatalog(catalogRows);

        const nextSet = new Set(userRows.map((row) => row?.name).filter(Boolean));
        setEarnedBadgeNameSet(nextSet);

        const nextMap = new Map();
        userRows.forEach((row) => {
          if (!row?.name) return;
          nextMap.set(row.name, row);
        });
        setEarnedMapByName(nextMap);
      } catch (error) {
        if (!isMounted) return;
        console.error("배지 페이지 데이터 조회 실패:", error);
        setCatalog([]);
        setEarnedBadgeNameSet(new Set());
        setEarnedMapByName(new Map());
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadBadgePage();

    return () => {
      isMounted = false;
    };
  }, [nickname]);

  return (
    <div className="badge-page">
      <main className="badge-main">
        <header className="badge-main-head">
          <p>BADGE CENTER</p>
          <h1>뱃지 도감 관리 페이지</h1>
          <span>리워드 페이지에서 분리한 배지 전용 작업 영역입니다.</span>
        </header>

        {isLoading ? (
          <div className="badge-empty-box">배지 정보를 불러오는 중입니다.</div>
        ) : catalog.length === 0 ? (
          <div className="badge-empty-box">등록된 배지가 없습니다.</div>
        ) : (
          <section className="badge-grid">
            {catalog.map((badge) => {
              const isEarned = earnedBadgeNameSet.has(badge?.name);
              const earnedInfo = earnedMapByName.get(badge?.name);
              const earnedAt = formatEarnedAt(earnedInfo?.earnedAt);

              return (
                <article key={badge.badgeId ?? badge.name} className={`badge-card ${isEarned ? "is-earned" : ""}`}>
                  <div className="badge-card-top">
                    <strong>{badge?.name ?? "이름 없음"}</strong>
                    <span>{isEarned ? "획득" : "미획득"}</span>
                  </div>
                  <p>{badge?.description ?? "설명이 없습니다."}</p>
                  <small>{badge?.conditionText ?? "조건 정보 없음"}</small>
                  <div className="badge-card-foot">
                    <em>{badge?.iconUrl ?? "-"}</em>
                    <em>{earnedAt}</em>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export default BadgePage;
