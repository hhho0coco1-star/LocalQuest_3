import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import './PartnerStoryPage.css';

const storyHighlights = [
  {
    label: '방문 유입',
    value: '+38%',
    description: '주말 저녁 시간대 신규 방문 비중이 늘어난 매장 사례',
  },
  {
    label: '재참여',
    value: '2.1배',
    description: '한 번 참여한 고객이 다시 퀘스트를 수행한 흐름',
  },
  {
    label: '체류 시간',
    value: '+24분',
    description: '현장 미션과 리워드로 머무는 시간이 길어진 유형',
  },
];

const partnerStories = [
  {
    category: 'CAFE',
    title: '골목 카페가 산책 코스의 목적지가 된 사례',
    summary:
      '단순 방문 체크인이 아니라 음료 주문, 포토 스팟 참여, 리뷰 유도까지 이어지는 퀘스트로 재방문을 만들었습니다.',
    beforeLabel: 'Before',
    beforeText: '평일 저녁 유입이 적고, 방문 고객의 체류 시간이 짧았습니다.',
    afterLabel: 'After',
    afterText: '주변 산책 퀘스트와 연결되면서 저녁 시간 방문과 리뷰 작성이 함께 늘어났습니다.',
    metrics: ['저녁 방문 비중 +31%', '리뷰 작성 수 +42%', '재방문 쿠폰 사용 증가'],
  },
  {
    category: 'FOOD',
    title: '먹거리 상권에서 매장 간 동선을 묶어낸 사례',
    summary:
      '한 매장만 보는 구조가 아니라 주변 상권과 연계된 미션으로 이동 흐름을 만들고, 마지막 보상을 우리 매장에서 회수했습니다.',
    beforeLabel: 'Before',
    beforeText: '주말 피크 타임 외에는 유입 편차가 크고, 상권 내 회전이 약했습니다.',
    afterLabel: 'After',
    afterText: '탐험형 퀘스트 참여 후 보상 회수 지점으로 작동하면서 자연스러운 유입이 이어졌습니다.',
    metrics: ['보상 회수 방문 +46%', '상권 연계 참여 증가', '피크 외 시간대 유입 개선'],
  },
  {
    category: 'LOCAL SPOT',
    title: '지역 공간이 이야기 있는 목적지로 보인 사례',
    summary:
      '공간 소개를 글로만 전달하지 않고, 현장 미션과 인증 포인트를 통해 방문 자체가 콘텐츠가 되도록 설계했습니다.',
    beforeLabel: 'Before',
    beforeText: 'SNS 노출은 있었지만 실제 방문으로 이어지는 흐름이 약했습니다.',
    afterLabel: 'After',
    afterText: '방문 인증과 현장 포인트를 통해 공유 소재가 생기면서 오프라인 방문 전환이 높아졌습니다.',
    metrics: ['현장 인증 수 증가', '주말 목적 방문 확대', '공유 콘텐츠 반응 상승'],
  },
];

const storySteps = [
  {
    step: '01',
    title: '매장 목표 정리',
    description: '신규 유입, 재방문, 체류 시간 중 어디에 집중할지 먼저 정합니다.',
  },
  {
    step: '02',
    title: '퀘스트 시나리오 설계',
    description: '업종과 동선에 맞는 참여 방식, 인증 방식, 보상 구조를 구성합니다.',
  },
  {
    step: '03',
    title: '운영 후 지표 확인',
    description: '참여 흐름과 방문 변화를 확인하면서 다음 운영 방향을 다듬습니다.',
  },
];

function PartnerStoryPage() {
  const authUser = useSelector((state) => state.auth.user);
  const normalizedUserRole = String(authUser?.role || 'GUEST').replace(/^ROLE_/, '');
  const isBusinessUser = normalizedUserRole === 'BUSINESS' || normalizedUserRole === 'ADMIN';
  const primaryCtaTo = isBusinessUser ? '/business' : '/inquiry';
  const primaryCtaLabel = isBusinessUser ? '비즈니스 관리하기' : '제휴 상담 신청하기';

  return (
    <main className="partner-story-page">
      <section className="partner-story-hero">
        <div className="partner-story-hero-copy">
          <span className="partner-story-chip">PARTNER STORY</span>
          <h1>Local Quest를 통해 매장 경험이 어떻게 달라질 수 있는지 보여드립니다</h1>
          <p>
            파트너 스토리는 우리 서비스를 어떻게 활용할 수 있는지 직관적으로 보여주는 사례형
            페이지입니다. 방문 유입, 체류 경험, 재참여 흐름이 어떻게 만들어지는지 감각적으로 확인해보세요.
          </p>

          <div className="partner-story-hero-actions">
            <Link to={primaryCtaTo} className="partner-story-primary-btn">
              {primaryCtaLabel}
            </Link>
            <Link to="/business/guide" className="partner-story-secondary-btn">
              입점안내 보기
            </Link>
          </div>
        </div>

        <div className="partner-story-highlight-grid">
          {storyHighlights.map((item) => (
            <article key={item.label} className="partner-story-highlight-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="partner-story-section">
        <div className="partner-story-heading">
          <span className="partner-story-section-badge">STORY SNAPSHOT</span>
          <h2>업종별로 이런 변화를 기대할 수 있습니다</h2>
        </div>

        <div className="partner-story-card-grid">
          {partnerStories.map((story) => (
            <article key={story.title} className="partner-story-card">
              <div className="partner-story-card-head">
                <span className="partner-story-category">{story.category}</span>
                <h3>{story.title}</h3>
                <p>{story.summary}</p>
              </div>

              <div className="partner-story-compare-grid">
                <div className="partner-story-compare before">
                  <span>{story.beforeLabel}</span>
                  <strong>{story.beforeText}</strong>
                </div>
                <div className="partner-story-compare after">
                  <span>{story.afterLabel}</span>
                  <strong>{story.afterText}</strong>
                </div>
              </div>

              <ul className="partner-story-metric-list">
                {story.metrics.map((metric) => (
                  <li key={metric}>{metric}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="partner-story-section partner-story-process">
        <div className="partner-story-heading">
          <span className="partner-story-section-badge">HOW IT WORKS</span>
          <h2>파트너 스토리는 이런 운영 흐름에서 만들어집니다</h2>
        </div>

        <div className="partner-story-step-list">
          {storySteps.map((item) => (
            <article key={item.step} className="partner-story-step-card">
              <span className="partner-story-step-badge">{item.step}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="partner-story-banner">
        <div>
          <span className="partner-story-section-badge is-banner">NEXT MOVE</span>
          <h2>우리 매장에서는 어떤 스토리를 만들 수 있을지 직접 확인해보세요</h2>
          <p>
            소개와 안내만 보는 페이지가 아니라, 실제 운영 결과를 상상할 수 있는 흐름으로 구성했습니다.
            매장 목표가 정리되어 있다면 다음 단계로 바로 이어갈 수 있습니다.
          </p>
        </div>

        <div className="partner-story-banner-actions">
          <Link to={primaryCtaTo} className="partner-story-primary-btn">
            {primaryCtaLabel}
          </Link>
          <Link to="/business/partner" className="partner-story-secondary-btn">
            파트너 센터 보기
          </Link>
        </div>
      </section>
    </main>
  );
}

export default PartnerStoryPage;
