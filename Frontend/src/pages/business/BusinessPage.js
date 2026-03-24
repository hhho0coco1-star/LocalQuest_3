import React, { useEffect, useMemo, useState } from 'react';
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

const CHART_WIDTH = 800;
const CHART_HEIGHT = 280;
const CHART_TOP_PADDING = 18;
const CHART_BOTTOM_PADDING = 34;
const CHART_GRID_ROWS = 5;

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

const buildLinePath = (points) => points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');

const buildFillPath = (points, baselineY) => {
  if (points.length === 0) {
    return '';
  }

  return `${buildLinePath(points)} L${points[points.length - 1].x},${baselineY} L${points[0].x},${baselineY} Z`;
};

function BusinessPage() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [business, setBusiness] = useState(null);
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);

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
      { label: '최근 인증 일시', value: formatDateTime(dashboard.lastAuthAt), highlight: false },
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

  const chartModel = useMemo(() => {
    const series = buildHourlySeries(dashboard.hourlyAuthCounts);
    const maxCount = Math.max(...series.map((item) => Number(item.authCount || 0)), 1);
    const chartRangeY = CHART_HEIGHT - CHART_TOP_PADDING - CHART_BOTTOM_PADDING;
    const baselineY = CHART_HEIGHT - CHART_BOTTOM_PADDING;

    const points = series.map((item, index) => {
      const x = (index / (series.length - 1)) * CHART_WIDTH;
      const y = baselineY - (item.authCount / maxCount) * chartRangeY;
      return {
        ...item,
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2))
      };
    });

    const gridLines = Array.from({ length: CHART_GRID_ROWS }, (_, index) => {
      const ratio = index / (CHART_GRID_ROWS - 1);
      return Number((CHART_TOP_PADDING + ratio * chartRangeY).toFixed(2));
    });

    const xAxisLabels = points.filter((point, index) => index % 2 === 0 || index === points.length - 1);

    return {
      gridLines,
      points,
      xAxisLabels,
      linePath: buildLinePath(points),
      fillPath: buildFillPath(points, baselineY)
    };
  }, [dashboard.hourlyAuthCounts]);

  return (
    <main className="business-page">
      <section className="business-card">
        <header className="business-card-header">
          <div className="business-title-wrap">
            <h1>비지니스 관리 대시보드</h1>
            <p className="business-subtitle">매장 운영 현황과 퀘스트 관리를 한 번에 확인하세요.</p>
          </div>
        </header>

        {loading ? (
          <div className="business-notice">비즈니스 정보를 불러오는 중입니다.</div>
        ) : errorMessage ? (
          <div className="business-notice">{errorMessage}</div>
        ) : (
          <div className="business-notice">
            {hasAuthHistory ? '인증 이력이 정상적으로 조회되었습니다.' : '등록된 인증 이력이 없습니다.'}
          </div>
        )}

        <section className="business-grid" aria-label="대시보드 지표">
          {dashboardCards.map((item) => (
            <article
              key={item.label}
              className={`business-metric-card ${item.highlight ? 'is-highlight' : ''}`}
            >
              <p className="business-metric-label">{item.label}</p>
              <strong className="business-metric-value">{item.value}</strong>
            </article>
          ))}
        </section>

        <section className="business-main-layout" aria-label="대시보드 상세">
          <article className="business-chart-panel">
            <h2>시간대별 방문객 유입 추이</h2>
            <div className="business-chart-box" role="img" aria-label="시간대별 방문객 유입 추이 그래프">
              <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none" className="business-chart-svg">
                <g className="business-grid-lines">
                  {chartModel.gridLines.map((gridY) => (
                    <line key={gridY} x1="0" y1={gridY} x2={CHART_WIDTH} y2={gridY} />
                  ))}
                </g>
                <path className="business-chart-fill" d={chartModel.fillPath} />
                <path className="business-chart-line" d={chartModel.linePath} />
                <g className="business-chart-labels">
                  {chartModel.xAxisLabels.map((point) => (
                    <text key={point.hourOfDay} x={point.x} y={CHART_HEIGHT - 8} textAnchor="middle">
                      {`${padTwoDigits(point.hourOfDay)}:00`}
                    </text>
                  ))}
                </g>
              </svg>
            </div>
          </article>

          <article className="business-store-panel">
            <h2>매장 정보 관리</h2>
            <div className="business-store-fields">
              {storeInfoRows.map((item) => (
                <div key={item.label} className="business-field-row">
                  <label className="business-field-label">{item.label}</label>
                  <div className="business-field-value">{item.value}</div>
                </div>
              ))}
            </div>
            <button type="button" className="business-primary-btn">정보 업데이트</button>
          </article>
        </section>
      </section>
    </main>
  );
}

export default BusinessPage;
