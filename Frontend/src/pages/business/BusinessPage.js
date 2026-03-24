import React, { useState } from 'react';
import './BusinessPage.css';

const dashboardCards = [
  { label: '총 인증 건수', value: '0' },
  { label: 'QR 인증 건수', value: '0' },
  { label: '영수증 인증 건수', value: '0' },
  { label: '누적 결제 금액', value: '0원' },
  { label: '누적 정산 금액', value: '0원' },
  { label: '최근 인증 일시', value: '-' },
  { label: '인증 사용자 수', value: '0' },
  { label: '인증 발생 장소 수', value: '0' }
];

const storeInfoCards = [
  { label: '매장 번호', value: '11' },
  { label: '최종 방문일', value: '1' },
  { label: '매장명', value: 'LocalQuest 천안점' },
  { label: '누적 방문 수', value: '31120' },
  { label: '상호명', value: '청년상회' },
  { label: '사업자 번호', value: '123-45-67890' },
  { label: '전화번호', value: '041-555-1234' },
  { label: '등록일', value: '2026-03-24T12:20:40' },
  { label: '주소 및 운영 가이드', value: '충남 천안시 동남구 중앙시장길 123' }
];

function BusinessPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <main className="business-page">
      <section className="business-card">
        <header className="business-card-header">
          <h1>매장 상세</h1>
          <button type="button" className="business-close-icon" aria-label="매장 상세 닫기">
            ×
          </button>
        </header>

        <div className="business-tabs">
          <button
            type="button"
            className={`business-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            매장 기본정보
          </button>
          <button
            type="button"
            className={`business-tab ${activeTab === 'store' ? 'active' : ''}`}
            onClick={() => setActiveTab('store')}
          >
            비즈니스 정보
          </button>
        </div>

        {activeTab === 'dashboard' ? (
          <div className="business-panel">
            <div className="business-notice">등록된 인증 이력이 없습니다.</div>
            <div className="business-grid">
              {dashboardCards.map((item) => (
                <article key={item.label} className="business-metric-card">
                  <p className="business-metric-label">{item.label}</p>
                  <strong className="business-metric-value">{item.value}</strong>
                </article>
              ))}
            </div>
            <div className="business-action-row">
              <button type="button" className="business-primary-btn">
                QR 보기
              </button>
            </div>
          </div>
        ) : (
          <div className="business-panel">
            <div className="business-store-grid">
              {storeInfoCards.map((item) => (
                <article key={item.label} className="business-store-card">
                  <p className="business-store-label">{item.label}</p>
                  <strong className="business-store-value">{item.value}</strong>
                </article>
              ))}
            </div>
            <div className="business-action-row business-action-row-end">
              <button type="button" className="business-secondary-btn">
                닫기
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default BusinessPage;
