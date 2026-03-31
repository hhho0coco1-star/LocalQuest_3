import React, { useCallback, useMemo, useState } from 'react';
import { businessApi } from '../../api/BusinessApi';
import { resolveApiErrorMessage } from '../../utils/errorMessage';
import BusinessTabNav from './components/BusinessTabNav';
import BusinessUpdateModal from './components/BusinessUpdateModal';
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
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isUpdateSaving, setIsUpdateSaving] = useState(false);
  const [updateErrorMessage, setUpdateErrorMessage] = useState('');
  const [updateForm, setUpdateForm] = useState({
    businessName: '',
    phone: '',
    zipCode: '',
    address: '',
    addressDetail: '',
    description: ''
  });
  const { toastMessage, showToast } = useBusinessToast();
  const {
    loading,
    errorMessage,
    business,
    dashboard,
    qrInfo,
    qrImageSrc,
    dashboardCards,
    storeInfoRows,
    hasAuthHistory,
    chartBars,
    todayScanCount,
    todayQuestCompleteCount,
    todayCouponUseCount,
    qrLink,
    reloadBusinessOverview
  } = useBusinessOverview();
  const {
    proposedCoupons,
    activeCoupons,
    proposedCouponCount,
    runningCouponCount,
    acceptCoupon,
    holdCoupon,
    pauseCoupon,
    resumeCoupon
  } = useBusinessCoupons(showToast);

  const handleDownloadQr = useCallback(() => {
    if (!qrImageSrc) {
      if (qrInfo && qrInfo.active === false) {
        showToast('운영중지 상태에서는 QR 이미지를 표시할 수 없습니다.');
        return;
      }
      showToast('QR 이미지를 아직 불러오지 못했습니다.');
      return;
    }

    const link = document.createElement('a');
    link.download = `localquest_qr_${sanitizeFileName(business?.businessName)}.png`;
    link.href = qrImageSrc;
    link.click();
    showToast('QR 이미지를 다운로드합니다.');
  }, [business?.businessName, qrImageSrc, qrInfo, showToast]);

  const handlePrint = useCallback(() => {
    window.print();
    showToast('인쇄 창을 열었습니다.');
  }, [showToast]);

  const headerDate = useMemo(() => formatHeaderDate(new Date()), []);

  const openUpdateModal = useCallback(() => {
    if (!business) {
      showToast('등록된 매장 정보가 없습니다.');
      return;
    }

    setUpdateForm({
      businessName: business.businessName || '',
      phone: business.phone || '',
      zipCode: business.zipCode || '',
      address: business.address || '',
      addressDetail: business.addressDetail || '',
      description: business.description || ''
    });
    setUpdateErrorMessage('');
    setIsUpdateModalOpen(true);
  }, [business, showToast]);

  const closeUpdateModal = useCallback(() => {
    if (isUpdateSaving) {
      return;
    }
    setIsUpdateModalOpen(false);
    setUpdateErrorMessage('');
  }, [isUpdateSaving]);

  const handleUpdateFieldChange = useCallback((event) => {
    const { name, value } = event.target;
    setUpdateForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmitUpdate = useCallback(async (event) => {
    event.preventDefault();
    if (isUpdateSaving) {
      return;
    }

    const payload = {
      businessName: updateForm.businessName.trim(),
      phone: updateForm.phone.trim(),
      zipCode: updateForm.zipCode.trim(),
      address: updateForm.address.trim(),
      addressDetail: updateForm.addressDetail.trim(),
      description: updateForm.description.trim()
    };

    if (!payload.businessName) {
      setUpdateErrorMessage('매장명을 입력해주세요.');
      return;
    }
    if (!payload.zipCode) {
      setUpdateErrorMessage('우편번호를 입력해주세요.');
      return;
    }
    if (!payload.address) {
      setUpdateErrorMessage('기본주소를 입력해주세요.');
      return;
    }

    try {
      setIsUpdateSaving(true);
      setUpdateErrorMessage('');
      await businessApi.updateMyBusiness(payload);
      await reloadBusinessOverview();
      setIsUpdateModalOpen(false);
      showToast('매장 정보가 수정되었습니다.');
    } catch (error) {
      const resolvedMessage = resolveApiErrorMessage(
        error,
        '매장 정보 수정에 실패했습니다. 잠시 후 다시 시도해주세요.'
      );
      const normalizedMessage = /<\s*html/i.test(resolvedMessage)
        ? '서버가 현재 저장 요청 메서드를 처리하지 못했습니다. 백엔드 재시작 후 다시 시도해주세요.'
        : resolvedMessage;
      setUpdateErrorMessage(normalizedMessage);
    } finally {
      setIsUpdateSaving(false);
    }
  }, [isUpdateSaving, reloadBusinessOverview, showToast, updateForm]);

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
            onClickUpdateInfo={openUpdateModal}
          />
        )}

        {activeTab === 'qr' && (
          <QrTab
            business={business}
            totalAuthCount={dashboard?.totalAuthCount}
            todayScanCount={todayScanCount}
            todayQuestCompleteCount={todayQuestCompleteCount}
            todayCouponUseCount={todayCouponUseCount}
            qrLink={qrLink}
            qrImageSrc={qrImageSrc}
            qrActive={qrInfo?.active !== false}
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

      <BusinessUpdateModal
        isOpen={isUpdateModalOpen}
        formState={updateForm}
        isSaving={isUpdateSaving}
        errorMessage={updateErrorMessage}
        onFieldChange={handleUpdateFieldChange}
        onClose={closeUpdateModal}
        onSubmit={handleSubmitUpdate}
      />
    </main>
  );
}

export default BusinessPage;
