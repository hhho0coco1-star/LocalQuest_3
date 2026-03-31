import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import LocalQuestLogo from './LocalQuestLogo';
import { TERMS } from '../../data/termsData';
import { rewardApi } from '../../api/RewardApi';
import { badgeApi } from '../../api/BadgeApi';
import './Footer.css';

const BADGE_DEX_SECTIONS = [
  { id: 'habit', label: '습관형', summary: '퀘스트 완료' },
  { id: 'explore', label: '탐험형', summary: '장소 탐색' },
  { id: 'complete', label: '완수형', summary: '리뷰 작성' },
  { id: 'benefit', label: '혜택형', summary: '리워드 교환' }
];

const BADGE_DEX_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'habit', label: '습관형' },
  { id: 'explore', label: '탐험형' },
  { id: 'benefit', label: '혜택형' },
  { id: 'complete', label: '완수형' }
];

const BADGE_ICON_MAP = {
  badge_first_step: '🎯',
  badge_quest_runner: '🏃',
  badge_local_regular: '🏆',
  badge_local_explorer: '🧭',
  badge_first_reviewer: '📝',
  badge_trusted_reviewer: '✅',
  badge_first_exchange: '🎁',
  badge_exchange_runner: '🛍️',
  badge_point_master: '💎'
};

const BADGE_META_BY_ICON_KEY = {
  badge_first_step: { section: 'habit', trigger: '퀘스트 완료 시', difficulty: 'easy' },
  badge_quest_runner: { section: 'habit', trigger: '퀘스트 완료 시', difficulty: 'mid' },
  badge_local_regular: { section: 'habit', trigger: '퀘스트 완료 시', difficulty: 'hard' },
  badge_local_explorer: { section: 'explore', trigger: '퀘스트 완료 시', difficulty: 'mid' },
  badge_first_reviewer: { section: 'complete', trigger: '리뷰 등록 시', difficulty: 'easy' },
  badge_trusted_reviewer: { section: 'complete', trigger: '리뷰 등록 시', difficulty: 'mid' },
  badge_first_exchange: { section: 'benefit', trigger: '리워드 교환 시', difficulty: 'easy' },
  badge_exchange_runner: { section: 'benefit', trigger: '리워드 교환 시', difficulty: 'mid' },
  badge_point_master: { section: 'benefit', trigger: '리워드 교환 시', difficulty: 'hard' }
};

const BADGE_SECTION_TRIGGER_MAP = {
  habit: '퀘스트 완료 시',
  explore: '퀘스트 완료 시',
  complete: '리뷰 등록 시',
  benefit: '리워드 교환 시'
};

const BADGE_SECTION_FALLBACK_RULES = [
  { section: 'benefit', keywords: ['교환', '포인트', '리워드', 'reward', 'coupon'] },
  { section: 'complete', keywords: ['리뷰', 'review'] },
  { section: 'explore', keywords: ['탐험', '장소', '방문', 'location', 'local'] },
  { section: 'habit', keywords: ['퀘스트', 'quest'] }
];

const toSafeText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

const pickBadgeValue = (badge, keys = []) => {
  for (const key of keys) {
    if (badge && badge[key] !== undefined && badge[key] !== null) {
      return badge[key];
    }
  }
  return '';
};

const toBadgeCode = (badgeId, index) => {
  const numericBadgeId = Number(badgeId);
  if (Number.isFinite(numericBadgeId) && numericBadgeId > 0) {
    return `B${String(Math.trunc(numericBadgeId)).padStart(3, '0')}`;
  }
  return `B${String(index + 1).padStart(3, '0')}`;
};

const inferBadgeSection = (badge, iconKey) => {
  const mappedSection = BADGE_META_BY_ICON_KEY[iconKey]?.section;
  if (mappedSection) {
    return mappedSection;
  }

  const searchableText = `${toSafeText(badge?.name)} ${toSafeText(badge?.description)} ${toSafeText(badge?.conditionText)}`.toLowerCase();
  for (const rule of BADGE_SECTION_FALLBACK_RULES) {
    if (rule.keywords.some((keyword) => searchableText.includes(keyword))) {
      return rule.section;
    }
  }

  return 'habit';
};

const toBadgeDifficultyByCondition = (conditionText) => {
  const normalized = toSafeText(conditionText).replace(/,/g, '');
  const thresholdMatch = normalized.match(/(\d+)/);
  if (!thresholdMatch) {
    return 'easy';
  }

  const threshold = Number(thresholdMatch[1]);
  if (!Number.isFinite(threshold)) {
    return 'easy';
  }
  if (threshold >= 20 || threshold >= 1000) {
    return 'hard';
  }
  if (threshold >= 5) {
    return 'mid';
  }
  return 'easy';
};

const normalizeBadgeCategory = (rawValue) => {
  const normalized = toSafeText(rawValue).toLowerCase();
  if (normalized === 'habit') return 'habit';
  if (normalized === 'explore') return 'explore';
  if (normalized === 'complete') return 'complete';
  if (normalized === 'benefit') return 'benefit';
  return '';
};

const normalizeBadgeDifficulty = (rawValue) => {
  const normalized = toSafeText(rawValue).toLowerCase();
  if (normalized === 'easy' || normalized === 'mid' || normalized === 'hard') {
    return normalized;
  }
  return '';
};

const normalizeTriggerType = (rawValue) => {
  const normalized = toSafeText(rawValue).toUpperCase();
  if (normalized === 'QUEST_COMPLETE') return '퀘스트 완료 시';
  if (normalized === 'REVIEW_CREATE') return '리뷰 등록 시';
  if (normalized === 'REWARD_EXCHANGE') return '리워드 교환 시';
  return '';
};

const normalizeBadgeDexItems = (rows) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((badge, index) => {
    const badgeCategory = pickBadgeValue(badge, ['badgeCategory', 'BADGE_CATEGORY', 'badge_category']);
    const badgeDifficulty = pickBadgeValue(badge, ['badgeDifficulty', 'BADGE_DIFFICULTY', 'badge_difficulty']);
    const triggerType = pickBadgeValue(badge, ['triggerType', 'TRIGGER_TYPE', 'trigger_type']);
    const iconUrl = pickBadgeValue(badge, ['iconUrl', 'ICON_URL', 'icon_url']);
    const badgeId = pickBadgeValue(badge, ['badgeId', 'BADGE_ID', 'badge_id']);
    const badgeName = pickBadgeValue(badge, ['name', 'NAME']);
    const conditionText = pickBadgeValue(badge, ['conditionText', 'CONDITION_TEXT', 'condition_text']);
    const description = pickBadgeValue(badge, ['description', 'DESCRIPTION']);

    const iconKey = toSafeText(iconUrl).toLowerCase();
    const section = normalizeBadgeCategory(badgeCategory) || inferBadgeSection(badge, iconKey);
    const meta = BADGE_META_BY_ICON_KEY[iconKey] ?? {};
    const difficultyFromApi = normalizeBadgeDifficulty(badgeDifficulty);
    const difficulty = difficultyFromApi
      || (['easy', 'mid', 'hard'].includes(meta.difficulty) ? meta.difficulty : toBadgeDifficultyByCondition(conditionText));
    const triggerFromApi = normalizeTriggerType(triggerType);

    return {
      code: toBadgeCode(badgeId, index),
      section,
      icon: BADGE_ICON_MAP[iconKey] ?? '🏅',
      name: toSafeText(badgeName) || `배지 ${index + 1}`,
      condition: toSafeText(conditionText) || toSafeText(description) || '조건 정보 없음',
      trigger: triggerFromApi || meta.trigger || BADGE_SECTION_TRIGGER_MAP[section] || '조건 달성 시',
      difficulty
    };
  });
};

const getDifficultyCount = (difficulty) => {
  if (difficulty === 'hard') return 3;
  if (difficulty === 'mid') return 2;
  return 1;
};

const getFilterThemeClass = (filterId) => {
  if (filterId === 'habit') return 'is-habit';
  if (filterId === 'explore') return 'is-explore';
  if (filterId === 'benefit') return 'is-benefit';
  if (filterId === 'complete') return 'is-complete';
  return '';
};

const toPublicRankingRow = (row, index) => {
  const rankValue = Number(row?.ranking ?? row?.rank ?? index + 1);
  const xpValue = Number(row?.totalExp ?? row?.exp ?? 0);
  const levelValue = Number(row?.levelNo ?? row?.level ?? 0);

  const safeRank = Number.isFinite(rankValue) && rankValue > 0 ? rankValue : index + 1;
  const safeXp = Number.isFinite(xpValue) ? xpValue : 0;
  const levelText = Number.isFinite(levelValue) && levelValue > 0 ? `LV.${levelValue}` : 'LV.--';

  return {
    rank: safeRank,
    name: row?.nickname ?? row?.name ?? '알 수 없음',
    xp: `${safeXp.toLocaleString()} XP`,
    level: levelText
  };
};

const extractRankingRows = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload?.list)) {
    return payload.list;
  }
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  return [];
};

const Footer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalBody, setModalBody] = useState('');
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [rankingItems, setRankingItems] = useState([]);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [rankingErrorMessage, setRankingErrorMessage] = useState('');
  const [isBadgeDexOpen, setIsBadgeDexOpen] = useState(false);
  const [activeBadgeFilter, setActiveBadgeFilter] = useState('all');
  const [badgeDexItems, setBadgeDexItems] = useState([]);
  const [isBadgeDexLoading, setIsBadgeDexLoading] = useState(false);
  const [badgeDexErrorMessage, setBadgeDexErrorMessage] = useState('');

  // --- [1. 페이지 경로 설정] ---
  const paths = {
    explore: "/explore",
    partner: "/business/partner",
    guide: "/business/guide",
    alliance: "/inquiry",
    faq: "/support/faq",
    notice: "/support/notice",
    contact: "/support/contact",
    support: "/support"
  };

  const openModal = (title, body) => {
    setModalTitle(title);
    setModalBody(body);
    setIsModalOpen(true);
  };

  const openRankingModal = () => {
    setIsRankingModalOpen(true);
  };

  const closeRankingModal = () => {
    setIsRankingModalOpen(false);
  };

  const openBadgeDex = () => {
    setActiveBadgeFilter('all');
    setIsBadgeDexOpen(true);
  };

  const closeBadgeDex = () => {
    setIsBadgeDexOpen(false);
  };

  useEffect(() => {
    if (!isBadgeDexOpen && !isRankingModalOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (isBadgeDexOpen) {
          closeBadgeDex();
        }
        if (isRankingModalOpen) {
          closeRankingModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBadgeDexOpen, isRankingModalOpen]);

  useEffect(() => {
    if (!isBadgeDexOpen && !isRankingModalOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isBadgeDexOpen, isRankingModalOpen]);

  useEffect(() => {
    if (!isRankingModalOpen) {
      return undefined;
    }

    let isMounted = true;

    const loadRanking = async () => {
      setIsRankingLoading(true);
      setRankingErrorMessage('');

      try {
        const response = await rewardApi.getRankings();
        const payload = response?.data;
        if (!isMounted) {
          return;
        }

        const rankingRows = extractRankingRows(payload);
        const normalized = rankingRows
          .map((row, index) => toPublicRankingRow(row, index))
          .sort((left, right) => left.rank - right.rank);

        setRankingItems(normalized);
      } catch (error) {
        console.error('푸터 랭킹 조회 실패:', error);
        if (isMounted) {
          setRankingItems([]);
          setRankingErrorMessage('랭킹 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } finally {
        if (isMounted) {
          setIsRankingLoading(false);
        }
      }
    };

    loadRanking();

    return () => {
      isMounted = false;
    };
  }, [isRankingModalOpen]);

  useEffect(() => {
    if (!isBadgeDexOpen) {
      return undefined;
    }

    let isMounted = true;

    const loadBadgeDex = async () => {
      if (isMounted) {
        setIsBadgeDexLoading(true);
        setBadgeDexErrorMessage('');
      }

      try {
        const response = await badgeApi.getBadgeCatalog();
        if (!isMounted) {
          return;
        }

        setBadgeDexItems(normalizeBadgeDexItems(response?.data));
      } catch (error) {
        console.error('배지 도감 조회 실패:', error);
        if (isMounted) {
          setBadgeDexErrorMessage('배지 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } finally {
        if (isMounted) {
          setIsBadgeDexLoading(false);
        }
      }
    };

    loadBadgeDex();

    return () => {
      isMounted = false;
    };
  }, [isBadgeDexOpen]);

  const visibleBadgeItems = useMemo(() => {
    if (activeBadgeFilter === 'all') {
      return badgeDexItems;
    }

    return badgeDexItems.filter((item) => item.section === activeBadgeFilter);
  }, [activeBadgeFilter, badgeDexItems]);

  return (
    <div>
      <footer className="footer-main-container">
        <div className="footer-inner-content">
          <div className="footer-brand-section">
            <div className="footer-logo-box">
              <LocalQuestLogo className="footer-localquest-logo" />
            </div>
            <p className="footer-brand-desc">
              지역을 게임처럼 탐험하는<br />
              미션 기반 O2O 로컬 발견 플랫폼
            </p>
          </div>

          <div className="footer-menu-wrapper">
            <div className="footer-menu-col">
              <h4 className="footer-menu-title">서비스</h4>
              <ul className="footer-menu-list">
                <li><Link to={paths.explore} className="footer-link">탐색하기</Link></li>
                <li>
                  <button type="button" className="footer-link footer-link-button" onClick={openRankingModal}>
                    랭킹
                  </button>
                </li>
                <li>
                  <button type="button" className="footer-link footer-link-button" onClick={openBadgeDex}>
                    배지 도감
                  </button>
                </li>
              </ul>
            </div>
            <div className="footer-menu-col">
              <h4 className="footer-menu-title">비즈니스</h4>
              <ul className="footer-menu-list">
                <li><Link to={paths.partner} className="footer-link">파트너 센터</Link></li>
                <li><Link to={paths.guide} className="footer-link">입점 안내</Link></li>
                <li><Link to={paths.alliance} className="footer-link">제휴 제안</Link></li>
              </ul>
            </div>
            <div className="footer-menu-col">
              <h4 className="footer-menu-title">고객지원</h4>
              <ul className="footer-menu-list">
                {/* state를 통해 어떤 탭을 열지 전달합니다 */}
                <li><Link to={paths.support} state={{ tab: 'notice' }} className="footer-link">공지사항</Link></li>
                <li><Link to={paths.support} state={{ tab: 'faq' }} className="footer-link">자주 묻는 질문</Link></li>
                <li><Link to={paths.support} state={{ tab: 'contact' }} className="footer-link">1:1 문의</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p className="footer-copyright">© 2026 Local Quest. All Rights Reserved.</p>
          <div className="footer-legal-links">
            <span className="footer-legal-item" onClick={() => openModal('이용약관', TERMS.SERVICE)}>이용약관</span>
            <span className="footer-legal-item footer-bold" onClick={() => openModal('개인정보처리방침', TERMS.PRIVACY)}>개인정보처리방침</span>
          </div>
        </div>
      </footer>

      {/* [모달 영역] */}
      {isModalOpen && (
        <div className="modal-fixed-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-fixed-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-fixed-header">
              <h3>{modalTitle}</h3>
              <button onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-fixed-body">
              {modalBody}
            </div>
          </div>
        </div>
      )}

      {isRankingModalOpen && (
        <div className="footer-ranking-overlay" onClick={closeRankingModal}>
          <section
            className="footer-ranking-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="전체 랭킹"
          >
            <div className="footer-ranking-head">
              <div>
                <h3>전체 랭킹</h3>
                <p>로그인 없이 전체 이용자가 확인할 수 있는 랭킹입니다.</p>
              </div>
              <button type="button" className="footer-ranking-close" onClick={closeRankingModal}>닫기</button>
            </div>

            <div className="footer-ranking-body">
              {isRankingLoading ? (
                <p className="footer-ranking-status">랭킹 정보를 불러오는 중입니다.</p>
              ) : rankingErrorMessage ? (
                <p className="footer-ranking-status">{rankingErrorMessage}</p>
              ) : rankingItems.length > 0 ? (
                <div className="footer-ranking-list">
                  {rankingItems.map((row) => (
                    <div key={`footer-rank-${row.rank}-${row.name}`} className="footer-ranking-row">
                      <span
                        className={`footer-ranking-rank ${row.rank <= 3 ? `is-top-${row.rank}` : ''}`.trim()}
                        aria-label={`${row.rank}위`}
                      >
                        {row.rank}
                      </span>
                      <div className="footer-ranking-user">
                        <strong>{row.name}</strong>
                        <p>{`${row.level} · ${row.xp}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="footer-ranking-status">표시할 랭킹 데이터가 없습니다.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {isBadgeDexOpen && (
        <div className="badge-dex-overlay" onClick={closeBadgeDex}>
          <section
            className="badge-dex-sheet"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="배지 도감"
          >
            <div className="badge-dex-handle" />

            <header className="badge-dex-header">
              <div className="badge-dex-title-wrap">
                <div className="badge-dex-title-icon">🏅</div>
                <div>
                  <h3 className="badge-dex-title">배지 도감</h3>
                  <p className="badge-dex-subtitle">LocalQuest에서 획득할 수 있는 모든 배지를 확인해보세요.</p>
                </div>
              </div>
              <button type="button" className="badge-dex-close" onClick={closeBadgeDex} aria-label="배지 도감 닫기">
                ✕
              </button>
            </header>

            <div className="badge-dex-filter-row">
              {BADGE_DEX_FILTERS.map((filter) => {
                const themeClass = getFilterThemeClass(filter.id);
                const isActive = activeBadgeFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    className={`badge-dex-filter-tab ${themeClass} ${isActive ? 'is-active' : ''}`.trim()}
                    onClick={() => setActiveBadgeFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <div className="badge-dex-body">
              {isBadgeDexLoading ? (
                <p className="badge-dex-status">배지 정보를 불러오는 중입니다.</p>
              ) : badgeDexErrorMessage ? (
                <p className="badge-dex-status">{badgeDexErrorMessage}</p>
              ) : visibleBadgeItems.length === 0 ? (
                <p className="badge-dex-status">등록된 배지가 없습니다.</p>
              ) : (
                BADGE_DEX_SECTIONS.map((section) => {
                  const sectionItems = visibleBadgeItems.filter((item) => item.section === section.id);
                  if (sectionItems.length === 0) {
                    return null;
                  }

                  return (
                    <section key={section.id} className="badge-dex-section">
                      <header className={`badge-dex-section-header is-${section.id}`}>
                        <div className="badge-dex-section-dot" />
                        <strong>{section.label}</strong>
                        <span>{`${section.summary} · ${sectionItems.length}종`}</span>
                      </header>

                      <div className="badge-dex-list">
                        {sectionItems.map((item) => {
                          const filledPips = getDifficultyCount(item.difficulty);
                          return (
                            <article key={item.code} className={`badge-dex-card is-${item.section}`}>
                              <div className="badge-dex-icon" aria-hidden="true">{item.icon}</div>
                              <div className="badge-dex-info">
                                <div className="badge-dex-name-row">
                                  <strong className="badge-dex-name">{item.name}</strong>
                                  <span className="badge-dex-tag">{section.label}</span>
                                  <span className="badge-dex-code">{item.code}</span>
                                </div>
                                <p className="badge-dex-condition">{item.condition}</p>
                                <div className="badge-dex-bottom">
                                  <span className="badge-dex-trigger">{item.trigger}</span>
                                  <div className="badge-dex-difficulty">
                                    <span>난이도</span>
                                    <div className="badge-dex-pips">
                                      {Array.from({ length: 3 }, (_, index) => (
                                        <span
                                          key={`${item.code}-${index}`}
                                          className={`badge-dex-pip ${index < filledPips ? `is-filled ${item.difficulty}` : ''}`.trim()}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Footer;
