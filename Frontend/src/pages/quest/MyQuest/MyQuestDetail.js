import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { questApi } from '../../../api/QuestApi';
import '../QuestDetail/QuestDetail.css';
import './MyQuestDetail.css';

const STAR_OPTIONS = [1, 2, 3, 4, 5];
const KAKAO_MAP_SCRIPT_SELECTOR = 'script[data-kakao-map-sdk="true"]';

const getDifficultyText = (rewardExp) => {
  if (rewardExp >= 300) return '어려움';
  if (rewardExp >= 180) return '보통';
  return '쉬움';
};

const formatDuration = (timeLimit) => (timeLimit ? `${timeLimit}분` : '제한 없음');

const formatDateTime = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const date = String(parsed.getDate()).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${date} ${hours}:${minutes}`;
};

const formatDueDateTime = (value) => (value ? formatDateTime(value) : '마감 정보 없음');

const getQuestStatusLabel = (status) => {
  if (status === 'IN_PROGRESS') return '진행 중';
  if (status === 'SAVED') return '수락됨';
  if (status === 'COMPLETED') return '완료';
  if (status === 'ABANDONED') return '포기';
  return status || '상태 정보 없음';
};

const hasValidCoordinates = (location) =>
  Number.isFinite(Number(location?.latitude)) && Number.isFinite(Number(location?.longitude));

const normalizeLocationType = (locationType) => {
  if (!locationType) return 'VISIT';
  return String(locationType).trim().toUpperCase();
};

const getVerificationLabel = (locationType) => {
  switch (normalizeLocationType(locationType)) {
    case 'EXPERIENCE':
      return 'QR 인증';
    case 'PURCHASE':
      return '영수증 인증';
    default:
      return 'GPS 인증';
  }
};

const loadKakaoMapSdk = (appKey) =>
  new Promise((resolve, reject) => {
    if (!appKey) {
      reject(new Error('missing-key'));
      return;
    }
    if (window.kakao?.maps?.LatLng) {
      resolve(window.kakao);
      return;
    }
    const handleReady = () => {
      if (window.kakao?.maps?.LatLng) {
        resolve(window.kakao);
        return;
      }
      if (window.kakao?.maps?.load) {
        window.kakao.maps.load(() => {
          if (window.kakao?.maps?.LatLng) {
            resolve(window.kakao);
            return;
          }
          reject(new Error('sdk-load-failed'));
        });
        return;
      }
      reject(new Error('sdk-load-failed'));
    };
    const existingScript = document.querySelector(KAKAO_MAP_SCRIPT_SELECTOR);
    if (existingScript) {
      if (existingScript.getAttribute('data-loaded') === 'true') {
        handleReady();
        return;
      }
      existingScript.addEventListener('load', handleReady, { once: true });
      existingScript.addEventListener('error', () => reject(new Error('sdk-load-failed')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.setAttribute('data-kakao-map-sdk', 'true');
    script.addEventListener('load', () => {
      script.setAttribute('data-loaded', 'true');
      handleReady();
    }, { once: true });
    script.addEventListener('error', () => reject(new Error('sdk-load-failed')), { once: true });
    document.head.appendChild(script);
  });

function MyQuestDetail() {
  const navigate = useNavigate();
  const { userQuestId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const kakaoMapKey = process.env.REACT_APP_KAKAO_MAP_KEY;
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapMarkerRef = useRef(null);

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedQrLocation, setSelectedQrLocation] = useState(null);
  const [selectedReceiptFile, setSelectedReceiptFile] = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('');
  const [receiptError, setReceiptError] = useState('');
  const [receiptUploads, setReceiptUploads] = useState({});
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);
  const [qrAuthKey, setQrAuthKey] = useState('');
  const [qrError, setQrError] = useState('');
  const [isSubmittingQr, setIsSubmittingQr] = useState(false);
  const [isSubmittingGps, setIsSubmittingGps] = useState(false);
  const [receiptFailure, setReceiptFailure] = useState(null);
  const [isCompletingQuest, setIsCompletingQuest] = useState(false);
  const [isCancelingQuest, setIsCancelingQuest] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
  const [reviewError, setReviewError] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);
  const [mapLoadState, setMapLoadState] = useState('idle');

  useEffect(() => {
    let isCancelled = false;
    const fetchMyQuestDetail = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await questApi.getMyQuestDetail(userQuestId);
        if (!isCancelled) setDetail(response.data);
      } catch (fetchError) {
        if (!isCancelled) setError('내 퀘스트 상세 정보를 불러오지 못했습니다.');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    fetchMyQuestDetail();
    return () => {
      isCancelled = true;
    };
  }, [userQuestId]);

  useEffect(() => () => {
    if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
  }, [receiptPreviewUrl]);

  useEffect(() => {
    let isCancelled = false;
    const loadMyReviewState = async () => {
      if (!detail?.questId || !user?.userId || detail.questStatus !== 'COMPLETED') {
        if (!isCancelled) setMyReview(null);
        return;
      }
      try {
        const response = await questApi.getQuestReviews(detail.questId);
        if (isCancelled) return;
        const reviews = Array.isArray(response.data) ? response.data : [];
        setMyReview(reviews.find((review) => Number(review.userId) === Number(user.userId)) || null);
      } catch (reviewLoadError) {
        if (!isCancelled) setMyReview(null);
      }
    };
    loadMyReviewState();
    return () => {
      isCancelled = true;
    };
  }, [detail?.questId, detail?.questStatus, user?.userId]);

  useEffect(() => {
    let isCancelled = false;
    const renderLocationMap = async () => {
      if (!selectedMapLocation || !mapContainerRef.current) return;
      if (!kakaoMapKey) {
        setMapLoadState('missing-key');
        return;
      }
      try {
        setMapLoadState('loading');
        const kakao = await loadKakaoMapSdk(kakaoMapKey);
        if (isCancelled || !mapContainerRef.current) return;
        const position = new kakao.maps.LatLng(Number(selectedMapLocation.latitude), Number(selectedMapLocation.longitude));
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new kakao.maps.Map(mapContainerRef.current, { center: position, level: 3 });
        }
        mapInstanceRef.current.setCenter(position);
        if (!mapMarkerRef.current) {
          mapMarkerRef.current = new kakao.maps.Marker({ position });
          mapMarkerRef.current.setMap(mapInstanceRef.current);
        } else {
          mapMarkerRef.current.setPosition(position);
          mapMarkerRef.current.setMap(mapInstanceRef.current);
        }
        setMapLoadState('ready');
      } catch (mapError) {
        if (!isCancelled) setMapLoadState(mapError.message === 'missing-key' ? 'missing-key' : 'error');
      }
    };
    renderLocationMap();
    return () => {
      isCancelled = true;
    };
  }, [kakaoMapKey, selectedMapLocation]);

  const locationSummary = useMemo(() => {
    const locations = Array.isArray(detail?.locations) ? detail.locations : [];
    return locations.length ? locations.map((location) => location.name).join(', ') : '지정된 장소 정보가 없습니다.';
  }, [detail?.locations]);

  const closeReceiptModal = (options = {}) => {
    const { force = false } = options;
    if (isSubmittingReceipt && !force) return;
    if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    setSelectedLocation(null);
    setSelectedReceiptFile(null);
    setReceiptPreviewUrl('');
    setReceiptError('');
  };

  const openReceiptModal = (location) => {
    closeReceiptModal();
    setReceiptFailure(null);
    setSelectedLocation(location);
  };

  const closeQrModal = (options = {}) => {
    const { force = false } = options;
    if (isSubmittingQr && !force) return;
    setSelectedQrLocation(null);
    setQrAuthKey('');
    setQrError('');
  };

  const openQrModal = (location) => {
    closeQrModal({ force: true });
    setReceiptFailure(null);
    setSelectedQrLocation(location);
  };

  const closeReceiptFailureModal = () => setReceiptFailure(null);

  const openVerificationFailure = (locationName, message, reason = '') => {
    setReceiptFailure({ locationName, message, reason });
  };

  const openMapModal = (location) => {
    if (!hasValidCoordinates(location)) return;
    setSelectedMapLocation(location);
  };

  const closeMapModal = () => {
    setSelectedMapLocation(null);
    setMapLoadState('idle');
    mapMarkerRef.current = null;
    mapInstanceRef.current = null;
  };

  const openKakaoMapWindow = () => {
    if (!selectedMapLocation || !hasValidCoordinates(selectedMapLocation)) return;
    const url = `https://map.kakao.com/link/map/${encodeURIComponent(selectedMapLocation.name || '퀘스트 위치')},${selectedMapLocation.latitude},${selectedMapLocation.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleReceiptFileChange = (event) => {
    const file = event.target.files?.[0];
    if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    if (!file) {
      setSelectedReceiptFile(null);
      setReceiptPreviewUrl('');
      setReceiptError('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setSelectedReceiptFile(null);
      setReceiptPreviewUrl('');
      setReceiptError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    setSelectedReceiptFile(file);
    setReceiptPreviewUrl(URL.createObjectURL(file));
    setReceiptError('');
  };

  const handleReceiptSubmit = async (event) => {
    event.preventDefault();
    if (!selectedLocation) return;
    if (!selectedReceiptFile) {
      setReceiptError('영수증 사진을 먼저 선택해주세요.');
      return;
    }
    try {
      setIsSubmittingReceipt(true);
      setReceiptError('');
      const formData = new FormData();
      formData.append('receiptImage', selectedReceiptFile);
      const response = await questApi.verifyQuestReceipt(userQuestId, selectedLocation.questLocationId, formData);
      const result = response.data || {};
      if (result.verified) {
        setReceiptUploads((prev) => ({ ...prev, [selectedLocation.questLocationId]: { fileName: selectedReceiptFile.name, uploadedAt: new Date().toISOString() } }));
        if (result.detail) setDetail(result.detail);
        closeReceiptModal({ force: true });
        return;
      }
      const failureLocationName = selectedLocation.name;
      closeReceiptModal({ force: true });
      setReceiptFailure({ locationName: failureLocationName, message: result.message || '영수증 인증에 실패했습니다.', reason: result.reason || '' });
    } catch (submitError) {
      const message = submitError.response?.data?.message || (typeof submitError.response?.data === 'string' ? submitError.response.data : '') || '영수증 인증 중 오류가 발생했습니다.';
      setReceiptError(message);
    } finally {
      setIsSubmittingReceipt(false);
    }
  };

  const handleGpsVerification = async (location) => {
    if (!location || isSubmittingGps) return;
    if (!navigator.geolocation) {
      openVerificationFailure(location.name, '이 기기에서는 위치 인증을 지원하지 않습니다.');
      return;
    }

    try {
      setIsSubmittingGps(true);
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const response = await questApi.verifyQuestGps(
        userQuestId,
        location.questLocationId,
        position.coords.latitude,
        position.coords.longitude
      );
      const result = response.data || {};
      if (result.verified) {
        if (result.detail) setDetail(result.detail);
        alert(result.message || 'GPS 인증이 완료되었습니다.');
        return;
      }
      openVerificationFailure(location.name, result.message || 'GPS 인증에 실패했습니다.', result.reason || '');
    } catch (gpsError) {
      const message = gpsError.response?.data?.message || '현재 위치를 확인하는 중 오류가 발생했습니다.';
      openVerificationFailure(location.name, message);
    } finally {
      setIsSubmittingGps(false);
    }
  };

  const handleQrSubmit = async (event) => {
    event.preventDefault();
    if (!selectedQrLocation || isSubmittingQr) return;
    if (!qrAuthKey.trim()) {
      setQrError('QR 인증값을 입력해 주세요.');
      return;
    }

    try {
      setIsSubmittingQr(true);
      setQrError('');
      const response = await questApi.verifyQuestQr(
        userQuestId,
        selectedQrLocation.questLocationId,
        qrAuthKey.trim()
      );
      const result = response.data || {};
      if (result.verified) {
        if (result.detail) setDetail(result.detail);
        closeQrModal({ force: true });
        alert(result.message || 'QR 인증이 완료되었습니다.');
        return;
      }

      const failureLocationName = selectedQrLocation.name;
      closeQrModal({ force: true });
      openVerificationFailure(failureLocationName, result.message || 'QR 인증에 실패했습니다.', result.reason || '');
    } catch (qrSubmitError) {
      const message = qrSubmitError.response?.data?.message || 'QR 인증 중 오류가 발생했습니다.';
      setQrError(message);
    } finally {
      setIsSubmittingQr(false);
    }
  };

  const handleVerifyClick = (location) => {
    const locationType = normalizeLocationType(location?.locationType);
    if (locationType === 'PURCHASE') {
      openReceiptModal(location);
      return;
    }
    if (locationType === 'EXPERIENCE') {
      openQrModal(location);
      return;
    }
    handleGpsVerification(location);
  };

  const handleCompleteQuest = async () => {
    if (!detail || isCompletingQuest) return;
    try {
      setIsCompletingQuest(true);
      const response = await questApi.completeMyQuest(userQuestId);
      if (response.data?.detail) setDetail(response.data.detail);
      alert(response.data?.alreadyCompleted ? '이미 완료된 퀘스트입니다.' : '퀘스트를 완료했습니다.');
    } catch (completeError) {
      alert(completeError.response?.data?.message || '퀘스트 완료 처리에 실패했습니다.');
    } finally {
      setIsCompletingQuest(false);
    }
  };

  const handleCancelQuest = async () => {
    if (!detail || isCancelingQuest) return;
    const confirmed = window.confirm('이 퀘스트를 취소하시겠습니까? 진행 기록은 유지됩니다.');
    if (!confirmed) return;
    try {
      setIsCancelingQuest(true);
      await questApi.cancelMyQuest(userQuestId);
      alert('퀘스트를 취소했습니다.');
      navigate('/mypage');
    } catch (cancelError) {
      alert(cancelError.response?.data?.message || '퀘스트 취소 처리에 실패했습니다.');
    } finally {
      setIsCancelingQuest(false);
    }
  };

  const openReviewModal = () => {
    setIsReviewModalOpen(true);
    setReviewForm({ rating: Number(myReview?.rating) || 5, content: myReview?.content || '' });
    setReviewError('');
  };

  const closeReviewModal = () => {
    if (isSubmittingReview) return;
    setIsReviewModalOpen(false);
    setReviewForm({ rating: 5, content: '' });
    setReviewError('');
  };

  const refreshMyReview = async () => {
    if (!detail?.questId || !user?.userId) {
      setMyReview(null);
      return;
    }
    const response = await questApi.getQuestReviews(detail.questId);
    const reviews = Array.isArray(response.data) ? response.data : [];
    setMyReview(reviews.find((review) => Number(review.userId) === Number(user.userId)) || null);
  };

  const handleReviewChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!detail?.questId || !user?.userId || isSubmittingReview) return;
    const trimmedContent = reviewForm.content.trim();
    if (!trimmedContent) {
      setReviewError('리뷰 내용을 입력해주세요.');
      return;
    }
    try {
      setIsSubmittingReview(true);
      setReviewError('');
      const payload = { userId: user.userId, rating: Number(reviewForm.rating), content: trimmedContent };
      if (myReview?.reviewId) {
        await questApi.updateQuestReview(detail.questId, myReview.reviewId, payload);
      } else {
        await questApi.createQuestReview(detail.questId, payload);
      }
      await refreshMyReview();
      setIsReviewModalOpen(false);
      setReviewForm({ rating: 5, content: '' });
      alert(myReview?.reviewId ? '리뷰가 수정되었습니다.' : '리뷰가 등록되었습니다.');
    } catch (submitError) {
      setReviewError(submitError.response?.data?.message || '리뷰 처리 중 문제가 발생했습니다.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReviewDelete = async () => {
    if (!detail?.questId || !user?.userId || !myReview?.reviewId || isSubmittingReview) return;
    const confirmed = window.confirm('작성한 리뷰를 삭제하시겠습니까?');
    if (!confirmed) return;
    try {
      setIsSubmittingReview(true);
      setReviewError('');
      await questApi.deleteQuestReview(detail.questId, myReview.reviewId, user.userId);
      setMyReview(null);
      setIsReviewModalOpen(false);
      setReviewForm({ rating: 5, content: '' });
      alert('리뷰가 삭제되었습니다.');
    } catch (deleteError) {
      setReviewError(deleteError.response?.data?.message || '리뷰 삭제 중 문제가 발생했습니다.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="quest-detail-page">
      <div className="quest-detail-main">
        <button type="button" className="quest-detail-back" onClick={() => navigate('/mypage')}>
          내 퀘스트로 돌아가기
        </button>

        {loading ? (
          <section className="quest-detail-empty"><h1>내 퀘스트 상세를 불러오는 중입니다.</h1></section>
        ) : detail ? (
          <section className="quest-detail-card">
            <div className="quest-detail-head">
              <div>
                <span className="quest-detail-category">{detail.category}</span>
                <h1>{detail.title}</h1>
                <p>{detail.description}</p>
              </div>
              <div className="quest-detail-summary"><strong>{detail.rewardPoint}P</strong><span>보상</span></div>
            </div>

            <div className="quest-detail-meta">
              <article><span>난이도</span><strong>{getDifficultyText(detail.rewardExp)}</strong></article>
              <article><span>포함 장소</span><strong>{locationSummary}</strong></article>
              <article><span>제한 시간</span><strong>{formatDuration(detail.timeLimit)}</strong></article>
            </div>

            <div className="my-quest-detail-progress-panel">
              <div className="my-quest-detail-progress-head">
                <h2>진행 상태</h2>
                <span className={`my-quest-detail-status is-${String(detail.questStatus || '').toLowerCase()}`}>{getQuestStatusLabel(detail.questStatus)}</span>
              </div>
              <div className="my-quest-detail-progress-grid">
                <article><span>진행률</span><strong>{detail.progressPercent}%</strong></article>
                <article><span>완료한 장소</span><strong>{detail.completedLocationCount}/{detail.totalLocationCount}</strong></article>
                <article><span>시작일</span><strong>{formatDateTime(detail.startedAt)}</strong></article>
                <article><span>마감</span><strong>{formatDueDateTime(detail.dueAt)}</strong></article>
                <article><span>완료일</span><strong>{formatDateTime(detail.completedAt)}</strong></article>
              </div>
              <div className="my-quest-detail-progress-bar"><span style={{ width: `${detail.progressPercent}%` }} /></div>
              {detail.questStatus !== 'COMPLETED' ? (
                <div className="my-quest-detail-action-row">
                  <button type="button" className="my-quest-detail-cancel-button" onClick={handleCancelQuest} disabled={isCancelingQuest}>{isCancelingQuest ? '취소 처리 중...' : '퀘스트 취소하기'}</button>
                  {Number(detail.totalLocationCount) > 0 && Number(detail.completedLocationCount) >= Number(detail.totalLocationCount) ? (
                    <button type="button" className="my-quest-detail-complete-button" onClick={handleCompleteQuest} disabled={isCompletingQuest}>{isCompletingQuest ? '완료 처리 중...' : '퀘스트 완료하기'}</button>
                  ) : null}
                </div>
              ) : null}
              {detail.questStatus === 'COMPLETED' ? (
                <div className="my-quest-detail-action-row">
                  <button type="button" className="my-quest-detail-review-button" onClick={openReviewModal}>{myReview ? '리뷰 수정' : '리뷰 쓰기'}</button>
                </div>
              ) : null}
            </div>

            <div className="quest-detail-steps">
              <h2>방문 순서</h2>
              {Array.isArray(detail.locations) && detail.locations.length > 0 ? (
                <div className="quest-detail-location-list">
                  {detail.locations.map((location) => {
                    const uploadedReceipt = receiptUploads[location.questLocationId];
                    const isCompleted = Number(location.isCompleted) === 1;
                    const clickable = hasValidCoordinates(location);
                    return (
                      <article key={location.questLocationId || location.locationId} className={`quest-detail-location-item my-quest-detail-location-item${isCompleted ? ' is-completed' : ''}${clickable ? ' is-clickable' : ''}`} onClick={() => openMapModal(location)} onKeyDown={(event) => {
                        if (!clickable) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openMapModal(location);
                        }
                      }} role={clickable ? 'button' : undefined} tabIndex={clickable ? 0 : undefined}>
                        <div className="quest-detail-location-order">{location.visitOrder}</div>
                        <div className="quest-detail-location-body">
                          <div className="my-quest-detail-location-head">
                            <h3>{location.name}</h3>
                            <span className={`my-quest-detail-location-badge${isCompleted ? ' is-completed' : ''}`}>{isCompleted ? '완료' : '미완료'}</span>
                          </div>
                          {location.address ? <p>{location.address}</p> : null}
                          {location.addressDetail ? <p>{location.addressDetail}</p> : null}
                          {clickable ? <span className="quest-detail-location-map-hint">클릭해서 지도 보기</span> : null}
                          {location.description ? <span className="quest-detail-location-note">{location.description}</span> : null}
                          {isCompleted ? (
                            <span className="my-quest-detail-completed-at">완료일 {formatDateTime(location.completedAt)}</span>
                          ) : (
                            <div className="my-quest-detail-verification">
                              <button type="button" className="my-quest-detail-verify-btn" onClick={(event) => { event.stopPropagation(); handleVerifyClick(location); }} disabled={isSubmittingGps}>{normalizeLocationType(location.locationType) === 'PURCHASE' && uploadedReceipt ? '영수증 다시 올리기' : `${getVerificationLabel(location.locationType)} 하기`}</button>
                              <span className="my-quest-detail-type-note">{getVerificationLabel(location.locationType)}</span>
                              {uploadedReceipt ? <span className="my-quest-detail-uploaded-note">영수증 업로드됨: {uploadedReceipt.fileName}</span> : null}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : <p className="quest-detail-empty-copy">아직 연결된 로케이션이 없습니다.</p>}
            </div>
          </section>
        ) : (
          <section className="quest-detail-empty"><h1>{error || '내 퀘스트를 찾을 수 없습니다.'}</h1><p>내 퀘스트 목록으로 돌아가 다시 선택해주세요.</p></section>
        )}
      </div>

      {selectedLocation ? (
        <div className="my-quest-receipt-modal-overlay" onClick={closeReceiptModal}>
          <div className="my-quest-receipt-modal" onClick={(event) => event.stopPropagation()}>
            <div className="my-quest-receipt-modal-head"><div><span className="my-quest-receipt-chip">영수증 인증</span><h2>{selectedLocation.name}</h2></div><button type="button" className="my-quest-receipt-close" onClick={closeReceiptModal}>x</button></div>
            <p className="my-quest-receipt-copy">영수증 사진을 올리면 해당 장소 방문 인증 자료로 사용됩니다.</p>
            <form className="my-quest-receipt-form" onSubmit={handleReceiptSubmit}>
              <label className="my-quest-receipt-upload-box" htmlFor="receipt-upload"><input id="receipt-upload" type="file" accept="image/*" onChange={handleReceiptFileChange} /><strong>영수증 사진 선택</strong><span>JPG, PNG 등 이미지 파일을 올려주세요.</span></label>
              {selectedReceiptFile ? <div className="my-quest-receipt-file-meta"><strong>{selectedReceiptFile.name}</strong><span>{Math.round(selectedReceiptFile.size / 1024)}KB</span></div> : null}
              {receiptPreviewUrl ? <div className="my-quest-receipt-preview-wrap"><img className="my-quest-receipt-preview" src={receiptPreviewUrl} alt="영수증 미리보기" /></div> : null}
              {receiptError ? <p className="my-quest-receipt-error">{receiptError}</p> : null}
              <p className="my-quest-receipt-helper">영수증을 업로드하면 자동으로 매장명과 인증 여부를 확인합니다.</p>
              <div className="my-quest-receipt-actions">
                <button type="button" className="my-quest-receipt-cancel" onClick={closeReceiptModal} disabled={isSubmittingReceipt}>취소</button>
                <button type="submit" className="my-quest-receipt-submit" disabled={isSubmittingReceipt}>{isSubmittingReceipt ? '인증 확인 중...' : '영수증 업로드'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {selectedQrLocation ? (
        <div className="my-quest-receipt-modal-overlay" onClick={() => closeQrModal()}>
          <div className="my-quest-receipt-result-modal my-quest-qr-modal" onClick={(event) => event.stopPropagation()}>
            <div className="my-quest-receipt-modal-head">
              <div>
                <span className="my-quest-receipt-chip">QR 인증</span>
                <h2>{selectedQrLocation.name}</h2>
              </div>
              <button type="button" className="my-quest-receipt-close" onClick={() => closeQrModal()}>x</button>
            </div>
            <p className="my-quest-receipt-copy">현장 QR에 표시된 인증값을 입력하면 체험형 장소 인증이 완료됩니다.</p>
            <form className="my-quest-review-form" onSubmit={handleQrSubmit}>
              <input
                className="my-quest-qr-input"
                type="text"
                value={qrAuthKey}
                onChange={(event) => setQrAuthKey(event.target.value)}
                placeholder="QR 인증값 입력"
                autoFocus
              />
              {qrError ? <p className="my-quest-receipt-error">{qrError}</p> : null}
              <div className="my-quest-receipt-actions">
                <button type="button" className="my-quest-receipt-cancel" onClick={() => closeQrModal()} disabled={isSubmittingQr}>취소</button>
                <button type="submit" className="my-quest-receipt-submit" disabled={isSubmittingQr}>{isSubmittingQr ? '확인 중..' : 'QR 인증하기'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {receiptFailure ? (
        <div className="my-quest-receipt-modal-overlay" onClick={closeReceiptFailureModal}>
          <div className="my-quest-receipt-result-modal" onClick={(event) => event.stopPropagation()}>
            <span className="my-quest-receipt-result-chip is-failed">인증 실패</span><h2>{receiptFailure.locationName}</h2><p className="my-quest-receipt-result-copy">{receiptFailure.message}</p>
            {receiptFailure.reason ? <p className="my-quest-receipt-result-reason">{receiptFailure.reason}</p> : null}
            <div className="my-quest-receipt-actions"><button type="button" className="my-quest-receipt-submit" onClick={closeReceiptFailureModal}>확인</button></div>
          </div>
        </div>
      ) : null}

      {selectedMapLocation ? (
        <div className="quest-location-map-modal-overlay" onClick={closeMapModal}>
          <div className="quest-location-map-modal" onClick={(event) => event.stopPropagation()}>
            <div className="quest-location-map-modal-head"><div><span className="quest-location-map-chip">지도 보기</span><h2>{selectedMapLocation.name}</h2><p>{[selectedMapLocation.address, selectedMapLocation.addressDetail].filter(Boolean).join(' ')}</p></div><button type="button" className="quest-location-map-close" onClick={closeMapModal}>x</button></div>
            <div className="quest-location-map-canvas-wrap"><div ref={mapContainerRef} className="quest-location-map-canvas" />{mapLoadState === 'loading' ? <div className="quest-location-map-state">지도를 불러오는 중입니다.</div> : null}{mapLoadState === 'missing-key' ? <div className="quest-location-map-state">카카오 지도 키가 설정되지 않았습니다.</div> : null}{mapLoadState === 'error' ? <div className="quest-location-map-state">지도를 표시하지 못했습니다.</div> : null}</div>
            <div className="quest-location-map-footer"><span className="quest-location-map-coords">{selectedMapLocation.latitude}, {selectedMapLocation.longitude}</span><button type="button" className="quest-location-map-link-button" onClick={openKakaoMapWindow}>카카오맵에서 보기</button></div>
          </div>
        </div>
      ) : null}

      {isReviewModalOpen && detail ? (
        <div className="my-quest-review-modal-overlay" onClick={closeReviewModal}>
          <div className="my-quest-review-modal" onClick={(event) => event.stopPropagation()}>
            <div className="my-quest-review-modal-head"><div><span className="my-quest-review-chip">{myReview ? '리뷰 수정' : '리뷰 쓰기'}</span><h2>{detail.title}</h2></div><button type="button" className="my-quest-review-close" onClick={closeReviewModal}>x</button></div>
            <form className="my-quest-review-form" onSubmit={handleReviewSubmit}>
              <div className="my-quest-review-rating-row"><span>별점</span><div className="my-quest-review-stars" aria-label="별점 선택">{STAR_OPTIONS.map((star) => (<button key={star} type="button" className={`my-quest-review-star-button${star <= reviewForm.rating ? ' is-active' : ''}`} onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}>{star <= reviewForm.rating ? '★' : '☆'}</button>))}</div></div>
              <textarea className="my-quest-review-textarea" name="content" value={reviewForm.content} onChange={handleReviewChange} placeholder="완료한 퀘스트 경험을 남겨주세요." />
              {reviewError ? <p className="my-quest-review-message is-error">{reviewError}</p> : null}
              <div className="my-quest-review-actions">
                {myReview ? <button type="button" className="my-quest-review-delete" onClick={handleReviewDelete} disabled={isSubmittingReview}>삭제</button> : null}
                <button type="button" className="my-quest-review-cancel" onClick={closeReviewModal} disabled={isSubmittingReview}>취소</button>
                <button type="submit" className="my-quest-review-submit" disabled={isSubmittingReview}>{isSubmittingReview ? '처리 중...' : myReview ? '리뷰 수정' : '리뷰 등록'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MyQuestDetail;
