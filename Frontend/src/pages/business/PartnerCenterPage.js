import React from 'react';
import { Link } from 'react-router-dom';
import './PartnerCenterPage.css';

const partnerHighlights = [
  {
    title: '실방문 중심 유입',
    description: 'QR 인증과 현장 미션을 통해 온라인 클릭보다 실제 방문 전환에 집중할 수 있습니다.',
  },
  {
    title: '퀘스트형 체류 경험',
    description: '단순 노출이 아니라 매장 안에서 체류하고 행동하도록 설계된 참여형 흐름을 제공합니다.',
  },
  {
    title: '보상 연계 운영',
    description: '포인트, 리워드, 쿠폰형 혜택을 결합해 재방문과 입소문까지 이어질 수 있습니다.',
  },
  {
    title: '운영 데이터 확인',
    description: '파트너 대시보드에서 QR 인증 수, 정산 흐름, 방문 추이 같은 운영 지표를 확인할 수 있습니다.',
  },
];

const recommendedSegments = [
  {
    title: '체험형 매장',
    description: '공방, 클래스, 전시, 팝업처럼 방문 동선 자체가 경험이 되는 공간에 적합합니다.',
  },
  {
    title: '재방문 유도형 매장',
    description: '카페, 디저트, 소매점처럼 단골 전환과 반복 방문을 유도하고 싶은 매장에 잘 맞습니다.',
  },
  {
    title: '지역 탐험형 스팟',
    description: '동네 명소, 로컬 브랜드, 지역 문화공간처럼 탐험형 콘텐츠와 결합하기 좋습니다.',
  },
];

const operationFlow = [
  {
    step: '01',
    title: '상담 신청',
    description: '매장 정보와 운영 목적을 남겨주시면 기본 적합도를 먼저 확인합니다.',
  },
  {
    step: '02',
    title: '운영 방식 설계',
    description: '방문형, 체험형, 구매형 등 매장 성격에 맞는 퀘스트 구조와 보상을 설계합니다.',
  },
  {
    step: '03',
    title: 'QR 배포 및 오픈',
    description: '현장 QR과 운영 정보를 세팅한 뒤 실제 사용자 흐름에 맞춰 서비스를 오픈합니다.',
  },
  {
    step: '04',
    title: '성과 확인',
    description: '대시보드에서 인증 현황과 운영 결과를 보며 다음 캠페인까지 이어갈 수 있습니다.',
  },
];

function PartnerCenterPage() {
  return (
    <main className="partner-center-page">
      <section className="partner-center-hero">
        <div className="partner-center-hero-copy">
          <span className="partner-center-chip">PARTNER CENTER</span>
          <h1>우리 매장을 퀘스트 명소로 만들고 싶다면</h1>
          <p>
            LocalQuest는 지역 방문을 게임처럼 설계하는 로컬 미션 플랫폼입니다.
            파트너 매장은 방문 유입, 체류 경험, 리워드 운영을 한 번에 연결할 수 있습니다.
          </p>

          <div className="partner-center-cta-row">
            <Link to="/inquiry" className="partner-center-primary-btn">
              파트너 상담 신청하기
            </Link>
            <Link to="/business/guide" className="partner-center-secondary-btn">
              입점 절차 먼저 보기
            </Link>
          </div>
        </div>

        <aside className="partner-center-hero-panel">
          <span className="partner-center-panel-kicker">LOCALQUEST FOR BUSINESS</span>
          <strong>오프라인 방문을 행동 데이터로 바꾸는 파트너 운영 툴</strong>
          <ul>
            <li>QR 인증 기반 현장 참여 유도</li>
            <li>퀘스트 보상과 쿠폰형 혜택 결합</li>
            <li>방문 지표와 인증 흐름 대시보드 제공</li>
          </ul>
        </aside>
      </section>

      <section className="partner-center-section">
        <div className="partner-center-heading">
          <span className="partner-center-section-badge">WHY LOCALQUEST</span>
          <h2>이런 효과를 기대할 수 있어요</h2>
        </div>

        <div className="partner-center-highlight-grid">
          {partnerHighlights.map((item) => (
            <article key={item.title} className="partner-center-highlight-card">
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="partner-center-section">
        <div className="partner-center-heading">
          <span className="partner-center-section-badge">BEST FIT</span>
          <h2>특히 잘 맞는 파트너 유형</h2>
        </div>

        <div className="partner-center-segment-grid">
          {recommendedSegments.map((item) => (
            <article key={item.title} className="partner-center-segment-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="partner-center-section">
        <div className="partner-center-heading">
          <span className="partner-center-section-badge">FLOW</span>
          <h2>운영은 이렇게 진행됩니다</h2>
        </div>

        <div className="partner-center-flow-list">
          {operationFlow.map((item) => (
            <article key={item.step} className="partner-center-flow-card">
              <span className="partner-center-flow-step">{item.step}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="partner-center-banner">
        <div>
          <span className="partner-center-section-badge is-banner">READY TO START</span>
          <h2>입점 가능 여부와 운영 방식을 먼저 상담받아보세요</h2>
          <p>
            매장 주소, 운영 목적, 희망하는 혜택 유형만 있어도 기본 검토가 가능합니다.
            입점 전 흐름이 궁금하다면 입점안내 페이지부터 확인해도 좋습니다.
          </p>
        </div>

        <div className="partner-center-banner-actions">
          <Link to="/inquiry" className="partner-center-banner-primary">
            상담 신청
          </Link>
          <Link to="/business/guide" className="partner-center-banner-secondary">
            입점 안내 보기
          </Link>
        </div>
      </section>
    </main>
  );
}

export default PartnerCenterPage;
