import React, { useCallback, useMemo, useState } from 'react';
import BusinessTabNav from './components/BusinessTabNav';
import CouponTab from './components/CouponTab';
import HomeTab from './components/HomeTab';
import QrTab from './components/QrTab';
import { useBusinessCoupons } from './hooks/useBusinessCoupons';
import { useBusinessOverview } from './hooks/useBusinessOverview';
import { useBusinessToast } from './hooks/useBusinessToast';
import { TAB_ITEMS } from './utils/businessConstants';
import { formatHeaderDate, sanitizeFileName } from './utils/businessUtils';
import './BusinessPage.css';

function BusinessPage() {
  const [activeTab, setActiveTab] = useState('home');
  const { toastMessage, showToast } = useBusinessToast();
  const {
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
  } = useBusinessOverview();
  const {
    proposedCoupons,
    activeCoupons,
    proposedCouponCount,
    runningCouponCount,
    weeklyCouponUseCount,
    acceptCoupon,
    holdCoupon,
    pauseCoupon,
    resumeCoupon
  } = useBusinessCoupons(showToast);

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

          <BusinessTabNav tabs={TAB_ITEMS} activeTab={activeTab} onChangeTab={setActiveTab} />
        </header>

        {activeTab === 'home' && (
          <HomeTab
            loading={loading}
            errorMessage={errorMessage}
            hasAuthHistory={hasAuthHistory}
            dashboardCards={dashboardCards}
            chartBars={chartBars}
            storeInfoRows={storeInfoRows}
            onClickUpdateInfo={() => showToast('정보 업데이트 기능은 준비 중입니다.')}
          />
        )}

        {activeTab === 'qr' && (
          <QrTab
            business={business}
            dashboard={dashboard}
            todayScanCount={todayScanCount}
            weeklyCouponUseCount={weeklyCouponUseCount}
            qrLink={qrLink}
            onDownloadQr={handleDownloadQr}
            onPrint={handlePrint}
          />
        )}

        {activeTab === 'coupon' && (
          <CouponTab
            proposedCoupons={proposedCoupons}
            activeCoupons={activeCoupons}
            proposedCouponCount={proposedCouponCount}
            runningCouponCount={runningCouponCount}
            onAcceptCoupon={acceptCoupon}
            onHoldCoupon={holdCoupon}
            onPauseCoupon={pauseCoupon}
            onResumeCoupon={resumeCoupon}
          />
        )}
      </section>

      <div className={`business-toast ${toastMessage ? 'is-show' : ''}`} aria-live="polite">
        {toastMessage}
      </div>
    </main>
  );
}

export default BusinessPage;
