import React from 'react';

function CouponTab({
  proposedCoupons,
  activeCoupons,
  proposedCouponCount,
  runningCouponCount,
  onAcceptCoupon,
  onHoldCoupon,
  onPauseCoupon,
  onResumeCoupon
}) {
  return (
    <section className="business-tab-panel">
      <div className="business-banner">
        <span className="business-banner-icon">💡</span>
        <p>
          쿠폰은 <strong>LocalQuest 운영팀이 매장에 맞게 제안</strong>합니다. 점주님은 제안을 검토하고 수락 또는 보류하시면 됩니다.
          <strong> 수락한 쿠폰만 앱에 노출</strong>되며, 언제든지 일시 중단할 수 있습니다.
        </p>
      </div>

      <div className="business-section-label">
        운영팀 제안 — 검토 대기 중
        <span className="business-count-dot">{proposedCouponCount}</span>
      </div>
      <div className="business-coupon-list">
        {proposedCoupons.map((coupon) => (
          <article
            key={coupon.id}
            className={`business-coupon-card ${coupon.status === 'proposed' ? 'is-proposed' : ''}`}
          >
            <div className="business-coupon-head">
              <div className="business-coupon-head-left">
                <div className="business-coupon-icon">{coupon.icon}</div>
                <div>
                  <h3>{coupon.title}</h3>
                  <p>{coupon.description}</p>
                </div>
              </div>
              <span
                className={`business-status-chip ${
                  coupon.status === 'proposed'
                    ? 'is-proposed'
                    : coupon.status === 'held'
                      ? 'is-held'
                      : 'is-running'
                }`}
              >
                {coupon.status === 'proposed' ? '제안됨' : coupon.status === 'held' ? '보류됨' : '수락됨'}
              </span>
            </div>

            <div className="business-coupon-body">
              <div>
                <span>혜택</span>
                <strong>{coupon.benefit}</strong>
              </div>
              <div>
                <span>유효 시간</span>
                <strong>{coupon.timeWindow}</strong>
              </div>
              <div>
                <span>예상 방문</span>
                <strong className="business-accent-green">{coupon.expectedLift}</strong>
              </div>
            </div>

            <div className="business-coupon-actions">
              {coupon.status === 'proposed' ? (
                <>
                  <button
                    type="button"
                    className="business-btn business-btn-success business-btn-sm"
                    onClick={() => onAcceptCoupon(coupon.id)}
                  >
                    수락하기
                  </button>
                  <button
                    type="button"
                    className="business-btn business-btn-ghost business-btn-sm"
                    onClick={() => onHoldCoupon(coupon.id)}
                  >
                    보류
                  </button>
                </>
              ) : (
                <span className="business-muted-caption">운영팀에게 재검토 요청이 전달됩니다.</span>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="business-section-label">
        운영 중인 쿠폰
        <span className="business-count-dot is-green">{runningCouponCount}</span>
      </div>
      <div className="business-coupon-list">
        {activeCoupons.map((coupon) => (
          <article key={coupon.id} className={`business-coupon-card ${coupon.status === 'running' ? 'is-running' : ''}`}>
            <div className="business-coupon-head">
              <div className="business-coupon-head-left">
                <div className="business-coupon-icon">{coupon.icon}</div>
                <div>
                  <h3>{coupon.title}</h3>
                  <p>{coupon.description}</p>
                </div>
              </div>
              <span className={`business-status-chip ${coupon.status === 'running' ? 'is-running' : 'is-held'}`}>
                {coupon.status === 'running' ? '운영 중' : '일시 중단'}
              </span>
            </div>

            <div className="business-coupon-body">
              <div>
                <span>혜택</span>
                <strong>{coupon.benefit}</strong>
              </div>
              <div>
                <span>누적 사용</span>
                <strong>{coupon.totalUsedText}</strong>
              </div>
              <div>
                <span>이번 주</span>
                <strong>{coupon.thisWeekText}</strong>
              </div>
            </div>

            <div className="business-coupon-actions">
              {coupon.status === 'running' ? (
                <button
                  type="button"
                  className="business-btn business-btn-ghost business-btn-sm"
                  onClick={() => onPauseCoupon(coupon.id)}
                >
                  일시 중단
                </button>
              ) : (
                <button
                  type="button"
                  className="business-btn business-btn-success business-btn-sm"
                  onClick={() => onResumeCoupon(coupon.id)}
                >
                  재개하기
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default CouponTab;
