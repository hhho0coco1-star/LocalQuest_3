import { useEffect, useMemo, useState } from 'react';
import { businessApi } from '../../../api/BusinessApi';
import { EMPTY_DASHBOARD } from '../utils/businessConstants';
import {
  buildHourlySeries,
  formatCurrency,
  formatDateTime,
  formatNumber,
  padTwoDigits
} from '../utils/businessUtils';

export function useBusinessOverview() {
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

  const qrLink = useMemo(() => {
    const slug = (business?.businessName || 'localquest-store')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
    return `localquest.io/q/${slug || 'localquest-store'}`;
  }, [business?.businessName]);

  return {
    loading,
    errorMessage,
    business,
    dashboard,
    dashboardCards,
    storeInfoRows,
    hasAuthHistory,
    chartBars,
    todayScanCount,
    qrLink
  };
}
