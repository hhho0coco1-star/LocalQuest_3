import React from 'react';
import { Link } from 'react-router-dom';
import './PartnerGuidePage.css';

const guideSteps = [
  {
    step: 'STEP 1',
    title: '상담 신청 접수',
    description: '매장 기본 정보와 운영 목적을 남겨주시면 제휴 가능 여부를 먼저 검토합니다.',
  },
  {
    step: 'STEP 2',
    title: '매장 검토 및 기획',
    description: '업종과 지역 특성에 맞는 퀘스트 유형, 보상 구조, 운영 방식을 함께 정리합니다.',
  },
  {
    step: 'STEP 3',
    title: '운영 세팅',
    description: '매장 정보 등록, 대표 장소 설정, QR 발급, 운영 안내까지 실제 서비스 오픈 준비를 진행합니다.',
  },
  {
    step: 'STEP 4',
    title: '오픈 및 운영',
    description: '실사용자에게 퀘스트를 오픈하고, 이후 인증 추이와 운영 데이터를 보며 개선을 이어갑니다.',
  },
];

const requirements = [
  '매장명, 연락처, 주소 등 기본 사업장 정보',
  '운영하고 싶은 혜택 방향 또는 기대 효과',
  '현장 방문 인증이 가능한 대표 장소',
  '퀘스트/쿠폰 운영에 필요한 기본 소개 문구',
];

const guideFaq = [
  {
    question: '입점 신청 후 바로 오픈되나요?',
    answer: '상담 접수 후 매장 특성과 운영 목적을 검토한 뒤 순차적으로 안내합니다. 내부 확인 절차가 포함되어 바로 오픈되지는 않습니다.',
  },
  {
    question: '모든 매장이 QR 인증을 사용할 수 있나요?',
    answer: '대표 장소와 운영 방식이 명확한 경우 QR 인증 흐름을 설계할 수 있습니다. 실제 적용 범위는 매장 유형에 따라 조정될 수 있습니다.',
  },
  {
    question: '이미 파트너인 경우 어디서 운영 상태를 보나요?',
    answer: '로그인 후 [비즈니스] 페이지에서 인증 건수, 정산 금액, 시간대별 추이 같은 운영 지표를 확인할 수 있습니다.',
  },
];

function PartnerGuidePage() {
  return (
    <main className="partner-guide-page">
      <section className="partner-guide-hero">
        <span className="partner-guide-chip">ONBOARDING GUIDE</span>
        <h1>LocalQuest 입점은 이렇게 진행됩니다</h1>
        <p>
          처음 제휴를 검토하는 매장을 위해 상담부터 오픈까지의 흐름을 정리했습니다.
          입점 전에 어떤 정보가 필요한지, 실제 운영은 어떻게 이어지는지 한눈에 볼 수 있습니다.
        </p>
      </section>

      <section className="partner-guide-section">
        <div className="partner-guide-heading">
          <span className="partner-guide-section-badge">PROCESS</span>
          <h2>입점 절차</h2>
        </div>

        <div className="partner-guide-step-list">
          {guideSteps.map((item) => (
            <article key={item.step} className="partner-guide-step-card">
              <span className="partner-guide-step-badge">{item.step}</span>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="partner-guide-section partner-guide-split-section">
        <article className="partner-guide-info-card">
          <div className="partner-guide-heading">
            <span className="partner-guide-section-badge">CHECKLIST</span>
            <h2>미리 준비하면 좋은 정보</h2>
          </div>

          <ul className="partner-guide-check-list">
            {requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="partner-guide-side-panel">
          <span className="partner-guide-side-kicker">PARTNER TIP</span>
          <strong>입점 상담에서는 “어떤 고객 행동을 만들고 싶은지”를 알려주시면 더 빠르게 설계할 수 있습니다.</strong>
          <p>
            예를 들어 첫 방문 유도, 재방문, 체험 참여, 특정 메뉴 구매 같은 목표가 있으면
            퀘스트 유형과 혜택 설계를 더 구체적으로 제안할 수 있습니다.
          </p>
        </article>
      </section>

      <section className="partner-guide-section">
        <div className="partner-guide-heading">
          <span className="partner-guide-section-badge">FAQ</span>
          <h2>입점 전 자주 묻는 질문</h2>
        </div>

        <div className="partner-guide-faq-list">
          {guideFaq.map((item) => (
            <article key={item.question} className="partner-guide-faq-card">
              <strong>{item.question}</strong>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="partner-guide-banner">
        <div>
          <span className="partner-guide-section-badge is-banner">NEXT STEP</span>
          <h2>준비가 되었다면 상담 신청으로 이어가세요</h2>
          <p>
            입점 가능 여부와 운영 흐름은 상담 신청 후 매장 정보 기준으로 더 구체적으로 안내할 수 있습니다.
          </p>
        </div>

        <div className="partner-guide-banner-actions">
          <Link to="/inquiry" className="partner-guide-primary-btn">
            상담 신청하기
          </Link>
          <Link to="/business/partner" className="partner-guide-secondary-btn">
            파트너센터 보기
          </Link>
        </div>
      </section>
    </main>
  );
}

export default PartnerGuidePage;
