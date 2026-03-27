function BadgeTab({
    isMyBadgeLoading,
    myBadgeError,
    myBadgeSummary,
    myBadgeHints,
    showEarnedBadgeOnly,
    onToggleEarnedOnly,
    filteredMyBadgeItems,
}) {
    if (isMyBadgeLoading) {
        return <div className="mypage-loading">배지 정보를 불러오는 중입니다.</div>;
    }

    if (myBadgeError) {
        return <p className="mypage-feedback-message is-error">{myBadgeError}</p>;
    }

    return (
        <>
            <div className="mypage-badge-summary-grid">
                <article className="mypage-badge-summary-card">
                    <div className="mypage-badge-box-head">
                        <h2>배지 현황</h2>
                        <span>{myBadgeSummary.total}종 전체</span>
                    </div>
                    <div className="mypage-badge-metrics-grid">
                        <div>
                            <strong>{myBadgeSummary.total}</strong>
                            <p>전체 배지</p>
                        </div>
                        <div>
                            <strong>{myBadgeSummary.earned}</strong>
                            <p>획득 완료</p>
                        </div>
                        <div>
                            <strong>{myBadgeSummary.unearned}</strong>
                            <p>미획득</p>
                        </div>
                        <div>
                            <strong>{myBadgeSummary.completionRate}%</strong>
                            <p>달성률</p>
                        </div>
                    </div>
                </article>

                <article className="mypage-badge-hint-card">
                    <div className="mypage-badge-box-head">
                        <h2>다음 배지 힌트</h2>
                    </div>
                    {myBadgeHints.length === 0 ? (
                        <p className="mypage-badge-hint-empty">축하합니다. 모든 배지를 획득했습니다.</p>
                    ) : (
                        <ul className="mypage-badge-hint-list">
                            {myBadgeHints.map((hint) => (
                                <li key={hint.badgeId}>
                                    <span className="mypage-badge-hint-dot" />
                                    <strong>{hint.name}</strong>
                                    <em>{hint.conditionText}</em>
                                </li>
                            ))}
                        </ul>
                    )}
                </article>
            </div>

            <article className="mypage-badge-board">
                <div className="mypage-badge-board-head">
                    <div>
                        <h3>내 배지</h3>
                        <p>퀘스트를 완료하고 특별한 배지를 획득하세요</p>
                    </div>
                    <span className="mypage-badge-earned-chip">{myBadgeSummary.earned}개 획득</span>
                </div>

                <div className="mypage-badge-filter-row">
                    <button
                        type="button"
                        className={`mypage-badge-earned-only${showEarnedBadgeOnly ? ' is-active' : ''}`}
                        onClick={onToggleEarnedOnly}
                    >
                        획득한 배지만
                    </button>
                </div>

                {filteredMyBadgeItems.length === 0 ? (
                    <p className="mypage-badge-empty">조건에 맞는 배지가 없습니다.</p>
                ) : (
                    <div className="mypage-badge-item-grid">
                        {filteredMyBadgeItems.map((badge) => (
                            <article key={badge.badgeId} className={`mypage-badge-item${badge.isEarned ? ' is-earned' : ''}`}>
                                <div className="mypage-badge-item-icon-wrap">
                                    {badge.iconUrl ? (
                                        <img className="mypage-badge-item-image" src={badge.iconUrl} alt="" />
                                    ) : (
                                        <span className="mypage-badge-item-icon">{badge.iconText}</span>
                                    )}
                                    {!badge.isEarned ? <span className="mypage-badge-lock">🔒</span> : null}
                                </div>

                                <strong>{badge.name}</strong>
                                <p>{badge.conditionText}</p>
                                <span className="mypage-badge-code">{badge.badgeCode}</span>

                                <div className="mypage-badge-progress-meta">
                                    <span>{badge.isEarned ? '획득 완료' : '미획득'}</span>
                                    <span>{badge.isEarned ? `획득일 ${badge.earnedAtLabel}` : '획득 전'}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </article>
        </>
    );
}

export default BadgeTab;
