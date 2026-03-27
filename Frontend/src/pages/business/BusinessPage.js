import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { businessApi } from '../../api/BusinessApi';
import './BusinessPage.css';

const EMPTY_DASHBOARD = {
  totalAuthCount: 0,
  qrAuthCount: 0,
  receiptAuthCount: 0,
  totalPaymentAmount: 0,
  totalSettlementAmount: 0,
  lastAuthAt: null,
  authUserCount: 0,
  authLocationCount: 0,
  hourlyAuthCounts: []
};

const INITIAL_PROPOSED_COUPONS = [
  {
    id: 'coupon-proposal-lunch',
    icon: '☕',
    title: '점심 퀘스트 완료 쿠폰',
    description: '평일 11:30 퀘스트 수행 고객 대상',
    benefit: '아메리카노 500원 할인',
    timeWindow: '당일 14:00까지',
    expectedLift: '+8~12명/일',
    status: 'proposed'
  },
  {
    id: 'coupon-proposal-evening',
    icon: '🌙',
    title: '퇴근길 퀘스트 쿠폰',
    description: '평일 17:30 퀘스트 수행 고객 대상',
    benefit: '음료 1+1 이벤트',
    timeWindow: '당일 20:00까지',
    expectedLift: '+5~9명/일',
    status: 'proposed'
  }
];

const INITIAL_ACTIVE_COUPONS = [
  {
    id: 'coupon-running-weekend',
    icon: '🏃',
    title: '주말 러닝 퀘스트 쿠폰',
    description: '주말 10:00 퀘스트 수행 고객 대상',
    benefit: '에너지바 증정',
    totalUsedText: '37건',
    thisWeekText: '8건',
    thisWeekCount: 8,
    status: 'running'
  }
];

const TAB_ITEMS = [
  { key: 'home', label: '홈 대시보드' },
  { key: 'qr', label: 'QR 코드 발급' },
  { key: 'coupon', label: '쿠폰 설정' }
];

const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const formatNumber = (value) => {
  const numeric = Number(value || 0);
  return new Intl.NumberFormat('ko-KR').format(Number.isFinite(numeric) ? numeric : 0);
};

const formatCurrency = (value) => `${formatNumber(value)}원`;

const padTwoDigits = (value) => String(value).padStart(2, '0');

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value.map((v) => Number(v));
    if ([year, month, day, hour, minute, second].every((v) => Number.isFinite(v))) {
      const dateFromArray = new Date(year, month - 1, day, hour, minute, second);
      if (!Number.isNaN(dateFromArray.getTime())) {
        return dateFromArray;
      }
    }
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const formatDateTime = (value) => {
  const date = parseDateValue(value);
  if (!date) {
    return '-';
  }

  return `${date.getFullYear()}.${padTwoDigits(date.getMonth() + 1)}.${padTwoDigits(date.getDate())} ${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}`;
};

const formatDateOnly = (value) => {
  const date = parseDateValue(value);
  if (!date) {
    return '-';
  }
  return `${date.getFullYear()}.${padTwoDigits(date.getMonth() + 1)}.${padTwoDigits(date.getDate())}`;
};

const formatHeaderDate = (date = new Date()) =>
  `${date.getFullYear()}.${padTwoDigits(date.getMonth() + 1)}.${padTwoDigits(date.getDate())} (${KOREAN_WEEKDAYS[date.getDay()]})`;

const buildHourlySeries = (hourlyAuthCounts) => {
  const seeded = Array.from({ length: 24 }, (_, hourOfDay) => ({ hourOfDay, authCount: 0 }));
  if (!Array.isArray(hourlyAuthCounts)) {
    return seeded;
  }

  hourlyAuthCounts.forEach((item) => {
    const parsedHour = Number(item?.hourOfDay ?? item?.hour ?? item?.hourKey);
    const parsedCount = Number(item?.authCount ?? 0);
    if (!Number.isFinite(parsedHour) || parsedHour < 0 || parsedHour > 23) {
      return;
    }

    seeded[parsedHour].authCount = Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 0;
  });

  return seeded;
};

const sanitizeFileName = (value) =>
  String(value || 'store')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_');

function BusinessPage() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [business, setBusiness] = useState(null);
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [proposedCoupons, setProposedCoupons] = useState(INITIAL_PROPOSED_COUPONS);
  const [activeCoupons, setActiveCoupons] = useState(INITIAL_ACTIVE_COUPONS);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    setToastMessage(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage('');
      toastTimerRef.current = null;
    }, 2600);
  }, []);

  useEffect(
    () => () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const loadBusinessOverview = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const response = await businessApi.getMyBusinessOverview();
        const payload = response?.data || {};

        if (!isMounted) {
          return;
        }

        setBusiness(payload.business || null);
        setDashboard(payload.dashboard || EMPTY_DASHBOARD);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const status = error?.response?.status;
        if (status === 404) {
          setErrorMessage('등록된 비즈니스 정보가 없습니다.');
        } else {
          const fallbackMessage = '비즈니스 정보를 불러오지 못했습니다.';
          setErrorMessage(error?.response?.data?.message || fallbackMessage);
        }

        setBusiness(null);
        setDashboard(EMPTY_DASHBOARD);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBusinessOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const dashboardCards = useMemo(
    () => [
      { label: '총 인증 건수', value: formatNumber(dashboard.totalAuthCount), highlight: false },
      { label: 'QR 인증 건수', value: formatNumber(dashboard.qrAuthCount), highlight: false },
      { label: '영수증 인증 건수', value: formatNumber(dashboard.receiptAuthCount), highlight: false },
      { label: '누적 결제 금액', value: formatCurrency(dashboard.totalPaymentAmount), highlight: true },
      { label: '누적 정산 금액', value: formatCurrency(dashboard.totalSettlementAmount), highlight: false },
      { label: '최근 인증 일시', value: formatDateTime(dashboard.lastAuthAt), highlight: false, smaller: true },
      { label: '인증 사용자 수', value: formatNumber(dashboard.authUserCount), highlight: false },
      { label: '인증 발생 장소 수', value: formatNumber(dashboard.authLocationCount), highlight: true }
    ],
    [dashboard]
  );

  const storeInfoRows = useMemo(() => {
    const address = [business?.address, business?.addressDetail].filter(Boolean).join(' ');

    return [
      { label: '매장명', value: business?.businessName || '-' },
      { label: '전화번호', value: business?.phone || '-' },
      { label: '매장 주소', value: address || '-' },
      { label: '우편번호', value: business?.zipCode || '-' },
      { label: '등록일', value: business?.createdAt ? formatDateTime(business.createdAt) : '-' },
      { label: '매장 소개', value: business?.description || '-' }
    ];
  }, [business]);

  const hasAuthHistory = Number(dashboard.totalAuthCount || 0) > 0;

  const chartBars = useMemo(() => {
    const series = buildHourlySeries(dashboard.hourlyAuthCounts);
    const bars = [];
    for (let hour = 0; hour < 24; hour += 2) {
      const first = Number(series[hour]?.authCount || 0);
      const second = Number(series[hour + 1]?.authCount || 0);
      bars.push({
        hour,
        label: padTwoDigits(hour),
        value: first + second
      });
    }

    const maxValue = Math.max(...bars.map((item) => item.value), 1);
    return bars.map((item) => {
      const ratio = item.value / maxValue;
      const height = item.value > 0 ? Math.max(ratio * 100, 4) : 2;
      return {
        ...item,
        height,
        tone: item.value === maxValue && maxValue > 0 ? 'high' : ratio >= 0.45 ? 'mid' : 'base'
      };
    });
  }, [dashboard.hourlyAuthCounts]);

  const todayScanCount = useMemo(
    () => buildHourlySeries(dashboard.hourlyAuthCounts).reduce((sum, item) => sum + Number(item.authCount || 0), 0),
    [dashboard.hourlyAuthCounts]
  );

  const runningCouponCount = useMemo(
    () => activeCoupons.filter((coupon) => coupon.status === 'running').length,
    [activeCoupons]
  );

  const proposedCouponCount = useMemo(
    () => proposedCoupons.filter((coupon) => coupon.status === 'proposed').length,
    [proposedCoupons]
  );

  const weeklyCouponUseCount = useMemo(
    () =>
      activeCoupons
        .filter((coupon) => coupon.status === 'running')
        .reduce((sum, coupon) => sum + Number(coupon.thisWeekCount || 0), 0),
    [activeCoupons]
  );

  const qrLink = useMemo(() => {
    const slug = (business?.businessName || 'localquest-store')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
    return `localquest.io/q/${slug || 'localquest-store'}`;
  }, [business?.businessName]);

  const acceptCoupon = useCallback(
    (couponId) => {
      setProposedCoupons((prev) => {
        const found = prev.find((coupon) => coupon.id === couponId);
        if (!found || found.status !== 'proposed') {
          return prev;
        }

        setActiveCoupons((activePrev) => [
          ...activePrev,
          {
            id: found.id,
            icon: found.icon,
            title: found.title,
            description: found.description,
            benefit: found.benefit,
            totalUsedText: '0건',
            thisWeekText: '0건',
            thisWeekCount: 0,
            status: 'running'
          }
        ]);

        showToast('쿠폰이 수락되어 앱에 노출됩니다.');
        return prev.map((coupon) => (coupon.id === couponId ? { ...coupon, status: 'accepted' } : coupon));
      });
    },
    [showToast]
  );

  const holdCoupon = useCallback(
    (couponId) => {
      setProposedCoupons((prev) =>
        prev.map((coupon) => (coupon.id === couponId && coupon.status === 'proposed' ? { ...coupon, status: 'held' } : coupon))
      );
      showToast('운영팀에게 재검토 요청을 전달했습니다.');
    },
    [showToast]
  );

  const pauseCoupon = useCallback(
    (couponId) => {
      setActiveCoupons((prev) =>
        prev.map((coupon) => (coupon.id === couponId ? { ...coupon, status: 'paused' } : coupon))
      );
      showToast('쿠폰을 일시 중단했습니다.');
    },
    [showToast]
  );

  const resumeCoupon = useCallback(
    (couponId) => {
      setActiveCoupons((prev) =>
        prev.map((coupon) => (coupon.id === couponId ? { ...coupon, status: 'running' } : coupon))
      );
      showToast('쿠폰이 다시 노출됩니다.');
    },
    [showToast]
  );

  const handleDownloadQr = useCallback(() => {
    const svg = document.getElementById('business-qr-svg');
    if (!svg) {
      showToast('QR 이미지를 찾을 수 없습니다.');
      return;
    }

    const serialized = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const context = canvas.getContext('2d');
    const image = new Image();

    image.onload = () => {
      if (!context) {
        showToast('QR 다운로드를 준비하지 못했습니다.');
        return;
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const link = document.createElement('a');
      link.download = `localquest_qr_${sanitizeFileName(business?.businessName)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('QR 이미지를 다운로드합니다.');
    };

    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
  }, [business?.businessName, showToast]);

  const handlePrint = useCallback(() => {
    window.print();
    showToast('인쇄 창을 열었습니다.');
  }, [showToast]);

  const headerDate = useMemo(() => formatHeaderDate(new Date()), []);

  return (
    <main className="business-page">
      <section className="business-shell">
        <header className="business-header">
          <div className="business-header-top">
            <div>
              <div className="business-partner-label">Partner Center</div>
              <h1>비지니스 관리 대시보드</h1>
              <p>매장 운영 현황과 퀘스트 관리를 한 번에 확인하세요.</p>
            </div>
            <div className="business-header-meta">
              <span className="business-header-date">{headerDate}</span>
              <span className="business-header-badge">신규 쿠폰 제안 {proposedCouponCount}건</span>
            </div>
          </div>

          <nav className="business-tabs" role="tablist" aria-label="비즈니스 메뉴">
            {TAB_ITEMS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`business-tab ${activeTab === tab.key ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {activeTab === 'home' && (
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
                <button type="button" className="business-btn business-btn-primary business-btn-full" onClick={() => showToast('정보 업데이트 기능은 준비 중입니다.')}>
                  정보 업데이트
                </button>
              </article>
            </section>
          </section>
        )}

        {activeTab === 'qr' && (
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

                <button type="button" className="business-btn business-btn-primary business-btn-full" onClick={handleDownloadQr}>
                  PNG로 다운로드
                </button>
                <button type="button" className="business-btn business-btn-outline business-btn-full" onClick={handlePrint}>
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
        )}

        {activeTab === 'coupon' && (
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
                          onClick={() => acceptCoupon(coupon.id)}
                        >
                          수락하기
                        </button>
                        <button
                          type="button"
                          className="business-btn business-btn-ghost business-btn-sm"
                          onClick={() => holdCoupon(coupon.id)}
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
                        onClick={() => pauseCoupon(coupon.id)}
                      >
                        일시 중단
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="business-btn business-btn-success business-btn-sm"
                        onClick={() => resumeCoupon(coupon.id)}
                      >
                        재개하기
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>

      <div className={`business-toast ${toastMessage ? 'is-show' : ''}`} aria-live="polite">
        {toastMessage}
      </div>
    </main>
  );
}

export default BusinessPage;
