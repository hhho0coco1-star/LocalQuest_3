import React, { useEffect, useMemo, useState } from 'react';
import { businessApi } from '../../api/BusinessApi';
import './BusinessCouponRequestPanel.css';

const COUPON_REQUEST_FILTERS = [
  { value: 'ALL', label: '전체' },
  { value: 'REQUESTED', label: '요청중' },
  { value: 'HOLD', label: '보류' },
  { value: 'ACCEPTED', label: '수락' },
  { value: 'CANCELLED', label: '취소' }
];

const formatNumber = (value) => {
  const numeric = Number(value || 0);
  return new Intl.NumberFormat('ko-KR').format(Number.isFinite(numeric) ? numeric : 0);
};

const padTwoDigits = (value) => String(value).padStart(2, '0');

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value.map((item) => Number(item));
    if ([year, month, day, hour, minute, second].every((item) => Number.isFinite(item))) {
      const parsed = new Date(year, month - 1, day, hour, minute, second);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const formatDateTime = (value) => {
  const date = parseDateValue(value);
  if (!date) {
    return '-';
  }

  return `${date.getFullYear()}.${padTwoDigits(date.getMonth() + 1)}.${padTwoDigits(date.getDate())} ${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}`;
};

const formatCouponRequestStatus = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'REQUESTED') {
    return '요청중';
  }
  if (normalized === 'HOLD') {
    return '보류';
  }
  if (normalized === 'ACCEPTED') {
    return '수락';
  }
  if (normalized === 'CANCELLED') {
    return '취소';
  }
  return normalized || '-';
};

const formatTargetStatus = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ON_SALE') {
    return '판매중';
  }
  if (normalized === 'SOLD_OUT') {
    return '품절';
  }
  if (normalized === 'HIDDEN') {
    return '숨김';
  }
  return normalized || '-';
};

const formatHistoryActionType = (actionType) => {
  const normalized = String(actionType || '').toUpperCase();
  if (normalized === 'CREATED') {
    return '요청 생성';
  }
  if (normalized === 'UPDATED') {
    return '요청 수정';
  }
  if (normalized === 'RESUBMITTED') {
    return '재요청';
  }
  if (normalized === 'HOLD') {
    return '보류';
  }
  if (normalized === 'ACCEPTED') {
    return '수락';
  }
  if (normalized === 'CANCELLED') {
    return '취소';
  }
  return normalized || '-';
};

function BusinessCouponRequestPanel() {
  const [couponRequests, setCouponRequests] = useState([]);
  const [couponRequestsLoading, setCouponRequestsLoading] = useState(true);
  const [couponRequestError, setCouponRequestError] = useState('');
  const [selectedCouponRequestId, setSelectedCouponRequestId] = useState(0);
  const [couponRequestDetail, setCouponRequestDetail] = useState(null);
  const [couponRequestDetailLoading, setCouponRequestDetailLoading] = useState(false);
  const [couponRequestActionLoading, setCouponRequestActionLoading] = useState(false);
  const [couponRequestFilter, setCouponRequestFilter] = useState('ALL');
  const [couponRequestActionMessage, setCouponRequestActionMessage] = useState('');
  const [holdReason, setHoldReason] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadCouponRequests = async () => {
      try {
        setCouponRequestsLoading(true);
        setCouponRequestError('');

        const params = couponRequestFilter === 'ALL'
          ? undefined
          : { requestStatus: couponRequestFilter };
        const response = await businessApi.getMyCouponRequests(params);
        const nextRequests = Array.isArray(response?.data?.requests) ? response.data.requests : [];

        if (!isMounted) {
          return;
        }

        setCouponRequests(nextRequests);
        setSelectedCouponRequestId((currentId) => {
          if (nextRequests.some((item) => Number(item?.requestId) === Number(currentId))) {
            return currentId;
          }
          return nextRequests.length > 0 ? Number(nextRequests[0].requestId) : 0;
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setCouponRequests([]);
        setSelectedCouponRequestId(0);
        setCouponRequestDetail(null);
        setCouponRequestError(error?.response?.data?.message || '비즈니스 쿠폰 제안 목록을 불러오지 못했습니다.');
      } finally {
        if (isMounted) {
          setCouponRequestsLoading(false);
        }
      }
    };

    loadCouponRequests();

    return () => {
      isMounted = false;
    };
  }, [couponRequestFilter]);

  useEffect(() => {
    let isMounted = true;

    if (!(selectedCouponRequestId > 0)) {
      setCouponRequestDetail(null);
      setCouponRequestDetailLoading(false);
      setHoldReason('');
      return () => {
        isMounted = false;
      };
    }

    const loadCouponRequestDetail = async () => {
      try {
        setCouponRequestDetailLoading(true);
        setCouponRequestActionMessage('');

        const response = await businessApi.getMyCouponRequestDetail(selectedCouponRequestId);
        if (!isMounted) {
          return;
        }

        setCouponRequestDetail(response?.data || null);
        setHoldReason('');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setCouponRequestDetail(null);
        setCouponRequestError(error?.response?.data?.message || '비즈니스 쿠폰 제안 상세를 불러오지 못했습니다.');
      } finally {
        if (isMounted) {
          setCouponRequestDetailLoading(false);
        }
      }
    };

    loadCouponRequestDetail();

    return () => {
      isMounted = false;
    };
  }, [selectedCouponRequestId]);

  const reloadCouponRequests = async (preferredRequestId) => {
    try {
      setCouponRequestsLoading(true);
      setCouponRequestError('');

      const params = couponRequestFilter === 'ALL'
        ? undefined
        : { requestStatus: couponRequestFilter };
      const response = await businessApi.getMyCouponRequests(params);
      const nextRequests = Array.isArray(response?.data?.requests) ? response.data.requests : [];

      setCouponRequests(nextRequests);
      setSelectedCouponRequestId((currentId) => {
        if (preferredRequestId && nextRequests.some((item) => Number(item?.requestId) === Number(preferredRequestId))) {
          return Number(preferredRequestId);
        }
        if (nextRequests.some((item) => Number(item?.requestId) === Number(currentId))) {
          return currentId;
        }
        return nextRequests.length > 0 ? Number(nextRequests[0].requestId) : 0;
      });
    } catch (error) {
      setCouponRequestError(error?.response?.data?.message || '비즈니스 쿠폰 제안 목록을 다시 불러오지 못했습니다.');
    } finally {
      setCouponRequestsLoading(false);
    }
  };

  const handleAcceptCouponRequest = async () => {
    const currentRequest = couponRequestDetail?.request;
    if (!(selectedCouponRequestId > 0) || couponRequestActionLoading) {
      return;
    }
    if (!currentRequest || String(currentRequest.requestStatus || '').toUpperCase() !== 'REQUESTED') {
      return;
    }
    if (!window.confirm('이 쿠폰 제안을 수락하고 실제 쿠폰을 생성하시겠습니까?')) {
      return;
    }

    try {
      setCouponRequestActionLoading(true);
      const response = await businessApi.acceptMyCouponRequest(selectedCouponRequestId);
      setCouponRequestDetail(response?.data || null);
      setCouponRequestActionMessage('쿠폰 제안을 수락했고 실제 쿠폰이 생성되었습니다.');
      await reloadCouponRequests(selectedCouponRequestId);
    } catch (error) {
      window.alert(error?.response?.data?.message || '쿠폰 제안을 수락하지 못했습니다.');
    } finally {
      setCouponRequestActionLoading(false);
    }
  };

  const handleHoldCouponRequest = async () => {
    const currentRequest = couponRequestDetail?.request;
    const trimmedHoldReason = holdReason.trim();

    if (!(selectedCouponRequestId > 0) || couponRequestActionLoading) {
      return;
    }
    if (!currentRequest || String(currentRequest.requestStatus || '').toUpperCase() !== 'REQUESTED') {
      return;
    }
    if (!trimmedHoldReason) {
      window.alert('보류 사유를 입력해 주세요.');
      return;
    }

    try {
      setCouponRequestActionLoading(true);
      const response = await businessApi.holdMyCouponRequest(selectedCouponRequestId, trimmedHoldReason);
      setCouponRequestDetail(response?.data || null);
      setCouponRequestActionMessage('쿠폰 제안을 보류 처리했습니다. 관리자가 내용을 수정한 뒤 다시 요청할 수 있습니다.');
      setHoldReason('');
      await reloadCouponRequests(selectedCouponRequestId);
    } catch (error) {
      window.alert(error?.response?.data?.message || '쿠폰 제안을 보류 처리하지 못했습니다.');
    } finally {
      setCouponRequestActionLoading(false);
    }
  };

  const couponRequestStats = useMemo(() => {
    const totalCount = couponRequests.length;
    const requestedCount = couponRequests.filter((item) => String(item?.requestStatus || '').toUpperCase() === 'REQUESTED').length;
    const holdCount = couponRequests.filter((item) => String(item?.requestStatus || '').toUpperCase() === 'HOLD').length;
    const acceptedCount = couponRequests.filter((item) => String(item?.requestStatus || '').toUpperCase() === 'ACCEPTED').length;

    return [
      { label: '전체 제안', value: formatNumber(totalCount) },
      { label: '응답 대기', value: formatNumber(requestedCount) },
      { label: '보류', value: formatNumber(holdCount) },
      { label: '수락 완료', value: formatNumber(acceptedCount) }
    ];
  }, [couponRequests]);

  const selectedCouponRequest = couponRequestDetail?.request || null;
  const couponRequestHistory = Array.isArray(couponRequestDetail?.history) ? couponRequestDetail.history : [];
  const canRespondCouponRequest = String(selectedCouponRequest?.requestStatus || '').toUpperCase() === 'REQUESTED';

  return (
    <section className="business-coupon-section" aria-label="비즈니스 쿠폰 제안함">
      <div className="business-coupon-header">
        <div className="business-coupon-title-wrap">
          <h2>쿠폰 제안함</h2>
          <p className="business-coupon-subtitle">관리자가 제안한 매장 전용 쿠폰을 검토하고 수락 또는 보류할 수 있습니다.</p>
        </div>
        <div className="business-coupon-filter-group" role="tablist" aria-label="쿠폰 제안 상태 필터">
          {COUPON_REQUEST_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`business-coupon-filter ${couponRequestFilter === filter.value ? 'is-active' : ''}`}
              onClick={() => setCouponRequestFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="business-coupon-summary-grid">
        {couponRequestStats.map((item) => (
          <article key={item.label} className="business-coupon-summary-card">
            <p className="business-coupon-summary-label">{item.label}</p>
            <strong className="business-coupon-summary-value">{item.value}</strong>
          </article>
        ))}
      </div>

      {couponRequestActionMessage ? (
        <div className="business-coupon-notice is-success">{couponRequestActionMessage}</div>
      ) : null}
      {couponRequestError ? (
        <div className="business-coupon-notice is-error">{couponRequestError}</div>
      ) : null}

      <div className="business-coupon-layout">
        <section className="business-coupon-list-panel">
          <div className="business-coupon-list-header">
            <h3>제안 목록</h3>
            <span>{formatNumber(couponRequests.length)}건</span>
          </div>

          {couponRequestsLoading ? (
            <div className="business-coupon-empty">쿠폰 제안 목록을 불러오는 중입니다.</div>
          ) : couponRequests.length === 0 ? (
            <div className="business-coupon-empty">현재 확인할 쿠폰 제안이 없습니다.</div>
          ) : (
            <div className="business-coupon-list">
              {couponRequests.map((request) => {
                const requestId = Number(request?.requestId || 0);
                const isActive = requestId === Number(selectedCouponRequestId);
                return (
                  <button
                    key={requestId}
                    type="button"
                    className={`business-coupon-item ${isActive ? 'is-active' : ''}`}
                    onClick={() => setSelectedCouponRequestId(requestId)}
                  >
                    <div className="business-coupon-item-top">
                      <strong>{request?.couponName || '-'}</strong>
                      <span className={`business-coupon-badge is-${String(request?.requestStatus || '').toLowerCase()}`}>
                        {formatCouponRequestStatus(request?.requestStatus)}
                      </span>
                    </div>
                    <div className="business-coupon-item-meta">
                      <span>{request?.locationName || '-'}</span>
                      <span>{formatDateTime(request?.requestedAt)}</span>
                    </div>
                    <div className="business-coupon-item-meta">
                      <span>{formatNumber(request?.pricePoint)} PT</span>
                      <span>재고 {formatNumber(request?.stock)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="business-coupon-detail-panel">
          {couponRequestDetailLoading ? (
            <div className="business-coupon-empty">쿠폰 제안 상세를 불러오는 중입니다.</div>
          ) : !selectedCouponRequest ? (
            <div className="business-coupon-empty">왼쪽 목록에서 확인할 쿠폰 제안을 선택해 주세요.</div>
          ) : (
            <>
              <div className="business-coupon-detail-header">
                <div>
                  <h3>{selectedCouponRequest.couponName || '-'}</h3>
                  <p>{selectedCouponRequest.locationName || '-'} · {selectedCouponRequest.businessName || '-'}</p>
                </div>
                <div className="business-coupon-detail-badges">
                  <span className={`business-coupon-badge is-${String(selectedCouponRequest.requestStatus || '').toLowerCase()}`}>
                    {formatCouponRequestStatus(selectedCouponRequest.requestStatus)}
                  </span>
                  <span className={`business-coupon-badge is-target-${String(selectedCouponRequest.targetStatus || '').toLowerCase()}`}>
                    {formatTargetStatus(selectedCouponRequest.targetStatus)}
                  </span>
                </div>
              </div>

              <div className="business-coupon-detail-grid">
                <div className="business-coupon-detail-card">
                  <span className="business-coupon-detail-label">매장 주소</span>
                  <strong>{selectedCouponRequest.locationAddress || '-'}</strong>
                </div>
                <div className="business-coupon-detail-card">
                  <span className="business-coupon-detail-label">요청 버전</span>
                  <strong>v{selectedCouponRequest.requestVersion || 1}</strong>
                </div>
                <div className="business-coupon-detail-card">
                  <span className="business-coupon-detail-label">교환 포인트</span>
                  <strong>{formatNumber(selectedCouponRequest.pricePoint)} PT</strong>
                </div>
                <div className="business-coupon-detail-card">
                  <span className="business-coupon-detail-label">초기 재고</span>
                  <strong>{formatNumber(selectedCouponRequest.stock)}</strong>
                </div>
                <div className="business-coupon-detail-card">
                  <span className="business-coupon-detail-label">요청일시</span>
                  <strong>{formatDateTime(selectedCouponRequest.requestedAt)}</strong>
                </div>
                <div className="business-coupon-detail-card">
                  <span className="business-coupon-detail-label">응답일시</span>
                  <strong>{formatDateTime(selectedCouponRequest.respondedAt)}</strong>
                </div>
                <div className="business-coupon-detail-card is-wide">
                  <span className="business-coupon-detail-label">쿠폰 설명</span>
                  <p>{selectedCouponRequest.couponDescription || '등록된 설명이 없습니다.'}</p>
                </div>
                <div className="business-coupon-detail-card is-wide">
                  <span className="business-coupon-detail-label">최근 보류 사유</span>
                  <p>{selectedCouponRequest.lastHoldReason || '보류 이력이 없습니다.'}</p>
                </div>
                <div className="business-coupon-detail-card is-wide">
                  <span className="business-coupon-detail-label">생성된 쿠폰 ID</span>
                  <strong>{selectedCouponRequest.approvedRewardItemId || '-'}</strong>
                </div>
              </div>

              <div className="business-coupon-action-panel">
                <div className="business-coupon-action-copy">
                  <h4>응답 처리</h4>
                  <p>
                    {canRespondCouponRequest
                      ? '현재 요청은 응답 대기 상태입니다. 수락하면 실제 쿠폰이 생성되고, 보류하면 관리자에게 수정 요청이 전달됩니다.'
                      : '현재 상태에서는 새로운 응답을 처리할 수 없습니다.'}
                  </p>
                </div>

                {canRespondCouponRequest ? (
                  <>
                    <textarea
                      className="business-coupon-hold-input"
                      placeholder="보류 사유를 입력하면 관리자가 해당 사유를 확인하고 수정 후 재요청할 수 있습니다."
                      value={holdReason}
                      onChange={(event) => setHoldReason(event.target.value)}
                      disabled={couponRequestActionLoading}
                    />
                    <div className="business-coupon-action-buttons">
                      <button
                        type="button"
                        className="business-coupon-secondary-btn"
                        onClick={handleHoldCouponRequest}
                        disabled={couponRequestActionLoading}
                      >
                        {couponRequestActionLoading ? '처리중...' : '보류'}
                      </button>
                      <button
                        type="button"
                        className="business-primary-btn business-coupon-primary-btn"
                        onClick={handleAcceptCouponRequest}
                        disabled={couponRequestActionLoading}
                      >
                        {couponRequestActionLoading ? '처리중...' : '수락 후 쿠폰 생성'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="business-coupon-action-state">
                    {String(selectedCouponRequest.requestStatus || '').toUpperCase() === 'HOLD'
                      ? '관리자가 내용을 보완해 다시 요청할 때까지 대기 중입니다.'
                      : String(selectedCouponRequest.requestStatus || '').toUpperCase() === 'ACCEPTED'
                        ? '수락이 완료되어 실제 쿠폰이 생성되었습니다.'
                        : '취소된 요청입니다.'}
                  </div>
                )}
              </div>

              <div className="business-coupon-history-panel">
                <div className="business-coupon-history-header">
                  <h4>처리 이력</h4>
                  <span>{formatNumber(couponRequestHistory.length)}건</span>
                </div>
                {couponRequestHistory.length === 0 ? (
                  <div className="business-coupon-empty is-compact">등록된 처리 이력이 없습니다.</div>
                ) : (
                  <div className="business-coupon-history-list">
                    {couponRequestHistory.map((history) => (
                      <article key={`${history.historyId}-${history.requestVersion}`} className="business-coupon-history-item">
                        <div className="business-coupon-history-top">
                          <strong>{formatHistoryActionType(history.actionType)}</strong>
                          <span>v{history.requestVersion || 1}</span>
                        </div>
                        <div className="business-coupon-history-meta">
                          <span>{history.actionByNickname || (history.actionByUserId ? `USER #${history.actionByUserId}` : 'SYSTEM')}</span>
                          <span>{formatDateTime(history.createdAt)}</span>
                        </div>
                        {history.commentText ? (
                          <p className="business-coupon-history-comment">{history.commentText}</p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}

export default BusinessCouponRequestPanel;
