import React from 'react';
import { formatDateOnly, formatNumber } from '../utils/businessUtils';

function QrTab({
  business,
  dashboard,
  todayScanCount,
  weeklyCouponUseCount,
  qrLink,
  onDownloadQr,
  onPrint
}) {
  return (
    <section className="business-tab-panel">
      <div className="business-qr-grid">
        <article className="business-qr-display-card">
          <h2 className="business-card-title">방문 인증 QR 코드</h2>
          <p className="business-card-subtitle business-center-text">
            고객이 매장 방문 시 스캔하는
            <br />
            퀘스트 인증용 QR입니다.
          </p>

          <div className="business-qr-frame">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" id="business-qr-svg" aria-label="매장 인증 QR 코드">
              <rect width="100" height="100" fill="#ffffff" />
              <rect x="5" y="5" width="30" height="30" rx="3" fill="none" stroke="#0e1a2b" strokeWidth="3" />
              <rect x="11" y="11" width="18" height="18" rx="2" fill="#0e1a2b" />
              <rect x="65" y="5" width="30" height="30" rx="3" fill="none" stroke="#0e1a2b" strokeWidth="3" />
              <rect x="71" y="11" width="18" height="18" rx="2" fill="#0e1a2b" />
              <rect x="5" y="65" width="30" height="30" rx="3" fill="none" stroke="#0e1a2b" strokeWidth="3" />
              <rect x="11" y="71" width="18" height="18" rx="2" fill="#0e1a2b" />
              <rect x="45" y="5" width="6" height="6" fill="#0e1a2b" />
              <rect x="53" y="5" width="6" height="6" fill="#0e1a2b" />
              <rect x="45" y="13" width="6" height="6" fill="#0e1a2b" />
              <rect x="53" y="21" width="6" height="6" fill="#0e1a2b" />
              <rect x="45" y="29" width="6" height="6" fill="#0e1a2b" />
              <rect x="45" y="45" width="6" height="6" fill="#0e1a2b" />
              <rect x="53" y="45" width="6" height="6" fill="#0e1a2b" />
              <rect x="61" y="45" width="6" height="6" fill="#0e1a2b" />
              <rect x="45" y="53" width="6" height="6" fill="#0e1a2b" />
              <rect x="61" y="53" width="6" height="6" fill="#0e1a2b" />
              <rect x="61" y="61" width="6" height="6" fill="#0e1a2b" />
              <rect x="69" y="45" width="6" height="6" fill="#0e1a2b" />
              <rect x="77" y="53" width="6" height="6" fill="#0e1a2b" />
              <rect x="85" y="45" width="6" height="6" fill="#0e1a2b" />
              <rect x="77" y="61" width="6" height="6" fill="#0e1a2b" />
              <rect x="85" y="61" width="6" height="6" fill="#0e1a2b" />
              <rect x="69" y="69" width="6" height="6" fill="#0e1a2b" />
              <rect x="85" y="77" width="6" height="6" fill="#0e1a2b" />
              <rect x="69" y="85" width="6" height="6" fill="#0e1a2b" />
              <rect x="85" y="85" width="6" height="6" fill="#0e1a2b" />
              <rect x="45" y="69" width="6" height="6" fill="#0e1a2b" />
              <rect x="53" y="77" width="6" height="6" fill="#0e1a2b" />
              <rect x="61" y="77" width="6" height="6" fill="#0e1a2b" />
              <rect x="45" y="85" width="6" height="6" fill="#0e1a2b" />
              <rect x="53" y="85" width="6" height="6" fill="#0e1a2b" />
              <rect x="5" y="45" width="6" height="6" fill="#0e1a2b" />
              <rect x="13" y="45" width="6" height="6" fill="#0e1a2b" />
              <rect x="21" y="53" width="6" height="6" fill="#0e1a2b" />
              <rect x="5" y="53" width="6" height="6" fill="#0e1a2b" />
              <rect x="29" y="53" width="6" height="6" fill="#0e1a2b" />
              <rect x="13" y="61" width="6" height="6" fill="#0e1a2b" />
              <rect x="29" y="61" width="6" height="6" fill="#0e1a2b" />
              <rect x="5" y="61" width="6" height="6" fill="#0e1a2b" />
              <rect x="21" y="45" width="6" height="6" fill="#0e1a2b" />
              <rect x="43" y="43" width="14" height="14" rx="2" fill="#ff385d" />
              <rect x="46" y="46" width="8" height="8" rx="1" fill="#ffffff" />
            </svg>

            <div className="business-qr-label">
              <strong>{business?.businessName || '매장 정보 준비 중'}</strong>
              LocalQuest 방문 퀘스트 인증
            </div>
          </div>

          <button type="button" className="business-btn business-btn-primary business-btn-full" onClick={onDownloadQr}>
            PNG로 다운로드
          </button>
          <button type="button" className="business-btn business-btn-outline business-btn-full" onClick={onPrint}>
            인쇄하기
          </button>
        </article>

        <div className="business-qr-right">
          <article className="business-content-card">
            <h2 className="business-card-title">오늘의 QR 스캔 현황</h2>
            <p className="business-card-subtitle">실시간 방문 인증 집계</p>
            <div className="business-mini-stat-grid">
              <div className="business-mini-stat">
                <strong className="is-red">{formatNumber(todayScanCount)}</strong>
                <p>오늘 스캔</p>
              </div>
              <div className="business-mini-stat">
                <strong>{formatNumber(dashboard.qrAuthCount)}</strong>
                <p>퀘스트 완료</p>
              </div>
              <div className="business-mini-stat">
                <strong className="is-green">{formatNumber(weeklyCouponUseCount)}</strong>
                <p>쿠폰 사용</p>
              </div>
            </div>
          </article>

          <article className="business-content-card">
            <h2 className="business-card-title">QR 코드 안내</h2>
            <div className="business-info-row">
              <span className="business-info-label">QR 유형</span>
              <span className="business-info-value">방문 인증형</span>
            </div>
            <div className="business-info-row">
              <span className="business-info-label">발급일</span>
              <span className="business-info-value">{formatDateOnly(business?.createdAt)}</span>
            </div>
            <div className="business-info-row">
              <span className="business-info-label">유효 기간</span>
              <span className="business-info-value">무제한</span>
            </div>
            <div className="business-info-row">
              <span className="business-info-label">누적 스캔</span>
              <span className="business-info-value business-accent-red">{formatNumber(dashboard.totalAuthCount)}회</span>
            </div>
            <div className="business-info-row">
              <span className="business-info-label">연결 URL</span>
              <span className="business-info-value business-link-text">{qrLink}</span>
            </div>

            <div className="business-guide-box">
              <p>
                카운터·테이블·출입문 등 고객이 잘 보이는 곳에 부착해 주세요.
                <br />
                스캔 1회 = 퀘스트 완료로 자동 처리됩니다.
                <br />
                QR은 재발급 없이 영구 사용 가능합니다.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default QrTab;
