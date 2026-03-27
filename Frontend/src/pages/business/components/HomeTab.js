import React from 'react';
import { padTwoDigits } from '../utils/businessUtils';

function HomeTab({
  loading,
  errorMessage,
  hasAuthHistory,
  dashboardCards,
  chartBars,
  storeInfoRows,
  onClickUpdateInfo
}) {
  return (
    <section className="business-tab-panel">
      {loading ? (
        <div className="business-notice">비즈니스 정보를 불러오는 중입니다.</div>
      ) : errorMessage ? (
        <div className="business-notice">{errorMessage}</div>
      ) : (
        <div className="business-notice">
          {hasAuthHistory ? '인증 이력이 정상적으로 조회되었습니다.' : '등록된 인증 이력이 없습니다.'}
        </div>
      )}

      <section className="business-stat-grid" aria-label="대시보드 지표">
        {dashboardCards.map((item) => (
          <article key={item.label} className={`business-stat-card ${item.highlight ? 'is-highlight' : ''}`}>
            <p className="business-stat-label">{item.label}</p>
            <strong className={`business-stat-value ${item.smaller ? 'is-smaller' : ''}`}>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="business-home-grid" aria-label="대시보드 상세">
        <article className="business-content-card">
          <h2 className="business-card-title">시간대별 방문객 유입 추이</h2>
          <p className="business-card-subtitle">오늘 기준 시간대별 QR 스캔 수</p>
          <div className="business-chart-wrap">
            {chartBars.map((bar) => (
              <div key={bar.label} className="business-chart-group">
                <div
                  className={`business-chart-bar ${bar.tone === 'high' ? 'is-high' : ''} ${bar.tone === 'mid' ? 'is-mid' : ''}`}
                  style={{ height: `${bar.height}%` }}
                  title={`${bar.label}:00 ~ ${padTwoDigits((Number(bar.label) + 2) % 24)}:00 / ${bar.value}건`}
                />
              </div>
            ))}
          </div>
          <div className="business-chart-labels">
            {chartBars.map((bar) => (
              <span key={`label-${bar.label}`}>{bar.label}</span>
            ))}
          </div>
        </article>

        <article className="business-content-card">
          <h2 className="business-card-title">매장 정보 관리</h2>
          {storeInfoRows.map((item) => (
            <div key={item.label} className="business-info-row">
              <span className="business-info-label">{item.label}</span>
              <span className="business-info-value">{item.value}</span>
            </div>
          ))}
          <button
            type="button"
            className="business-btn business-btn-primary business-btn-full"
            onClick={onClickUpdateInfo}
          >
            정보 업데이트
          </button>
        </article>
      </section>
    </section>
  );
}

export default HomeTab;
