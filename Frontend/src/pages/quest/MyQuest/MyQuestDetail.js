import React, { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { questApi } from '../../../api/QuestApi';
import { hasValidCoordinates, loadKakaoMapSdk } from '../../../utils/kakaoMap';
import '../QuestDetail/QuestDetail.css';
import './MyQuestDetail.css';

const STAR_OPTIONS = [1, 2, 3, 4, 5];
const QR_SCANNER_MESSAGES = {
  starting: '카메라를 준비하는 중입니다.',
  ready: 'QR 코드를 화면 가운데에 맞춰주세요.',
  unsupported: '이 브라우저에서는 자동 QR 인식을 사용할 수 없습니다.',
  noCamera: '이 기기에서는 카메라를 사용할 수 없습니다.',
  denied: '카메라 권한이 없어 QR을 읽을 수 없습니다.',
  error: '카메라를 시작하지 못했습니다.',
  scanned: 'QR을 확인했어요. 바로 인증할게요.',
  verifying: 'QR을 확인했어요. 인증 중이에요.',
};
const GPS_FALLBACK_LOCATION = {
  name: '대흥로 215',
  latitude: 36.80740752813,
  longitude: 127.147164,
};

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

const formatDueDateTime = (value) => (value ? formatDateTime(value) : '제한 없음');

const getQuestStatusLabel = (status) => {
  if (status === 'IN_PROGRESS') return '진행 중';
  if (status === 'SAVED') return '수락됨';
  if (status === 'COMPLETED') return '완료';
  if (status === 'ABANDONED') return '포기';
  return status || '상태 정보 없음';
};

const normalizeLocationCategory = (locationCategory) => {
  if (!locationCategory) return 'VISIT';
  return String(locationCategory).trim().toUpperCase();
};

const getVerificationLabel = (locationCategory) => {
  switch (normalizeLocationCategory(locationCategory)) {
    case 'EXPERIENCE':
      return 'QR 인증';
    case 'PURCHASE':
      return '영수증 인증';
    default:
      return 'GPS 인증';
  }
};

const isLocationCompleted = (location) => Number(location?.isCompleted) === 1;

const canVerifyLocationInOrder = (locations, targetLocation) => {
  if (!Array.isArray(locations) || !targetLocation) return true;
  const targetOrder = Number(targetLocation.visitOrder);
  if (!Number.isFinite(targetOrder) || targetOrder <= 1) return true;

  return !locations.some((location) => {
    const visitOrder = Number(location?.visitOrder);
    if (!Number.isFinite(visitOrder)) return false;
    if (Number(location?.questLocationId) === Number(targetLocation.questLocationId)) return false;
    return visitOrder < targetOrder && !isLocationCompleted(location);
  });
};

const getGpsPositionWithFallback = async () => {
  if (!navigator.geolocation) {
    return {
      latitude: GPS_FALLBACK_LOCATION.latitude,
      longitude: GPS_FALLBACK_LOCATION.longitude,
      usedFallback: true,
    };
  }

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      usedFallback: false,
    };
  } catch (error) {
    return {
      latitude: GPS_FALLBACK_LOCATION.latitude,
      longitude: GPS_FALLBACK_LOCATION.longitude,
      usedFallback: true,
    };
  }
};

function MyQuestDetail() {
  const navigate = useNavigate();
  const { userQuestId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const kakaoMapKey = process.env.REACT_APP_KAKAO_MAP_KEY;
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapMarkerRef = useRef(null);
  const qrVideoRef = useRef(null);
  const qrCanvasRef = useRef(null);
  const qrStreamRef = useRef(null);
  const qrScanFrameRef = useRef(0);

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
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('idle');
  const [scannerMessage, setScannerMessage] = useState('');
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
        if (!isCancelled) setError('내 퀘스트 상세를 불러오지 못했습니다.');
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

  useEffect(() => () => {
    if (qrScanFrameRef.current) {
      window.cancelAnimationFrame(qrScanFrameRef.current);
    }
    if (qrStreamRef.current) {
      qrStreamRef.current.getTracks().forEach((track) => track.stop());
      qrStreamRef.current = null;
    }
  }, []);

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

  const stopQrScanner = () => {
    if (qrScanFrameRef.current) {
      window.cancelAnimationFrame(qrScanFrameRef.current);
      qrScanFrameRef.current = 0;
    }
    if (qrStreamRef.current) {
      qrStreamRef.current.getTracks().forEach((track) => track.stop());
      qrStreamRef.current = null;
    }
    if (qrVideoRef.current) {
      qrVideoRef.current.pause();
      qrVideoRef.current.srcObject = null;
    }
  };

  const closeQrModal = (options = {}) => {
    const { force = false } = options;
    if (isSubmittingQr && !force) return;
    stopQrScanner();
    setSelectedQrLocation(null);
    setQrAuthKey('');
    setQrError('');
    setIsScannerActive(false);
    setScannerStatus('idle');
    setScannerMessage('');
  };

  const openQrModal = (location) => {
    closeQrModal({ force: true });
    setReceiptFailure(null);
    setSelectedQrLocation(location);
    setIsScannerActive(true);
    setScannerStatus('starting');
    setScannerMessage(QR_SCANNER_MESSAGES.starting);
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
      setReceiptFailure({ locationName: failureLocationName, message: result.message || '영수증 확인에 실패했습니다.', reason: result.reason || '' });
    } catch (submitError) {
      const message = submitError.response?.data?.message || (typeof submitError.response?.data === 'string' ? submitError.response.data : '') || '영수증 확인 중 문제가 발생했습니다.';
      setReceiptError(message);
    } finally {
      setIsSubmittingReceipt(false);
    }
  };

  const handleGpsVerification = async (location) => {
    if (!location || isSubmittingGps) return;

    try {
      setIsSubmittingGps(true);
      const position = await getGpsPositionWithFallback();

      const response = await questApi.verifyQuestGps(
        userQuestId,
        location.questLocationId,
        position.latitude,
        position.longitude
      );
      const result = response.data || {};
      if (result.verified) {
        if (result.detail) setDetail(result.detail);
        alert(
          position.usedFallback
            ? `${result.message || '위치 인증이 완료되었습니다.'} 현재 위치를 찾지 못해 기본 위치(${GPS_FALLBACK_LOCATION.name})로 인증했습니다.`
            : (result.message || '위치 인증이 완료되었습니다.')
        );
        return;
      }
      openVerificationFailure(location.name, result.message || 'GPS 인증에 실패했습니다.', result.reason || '');
    } catch (gpsError) {
      const message = gpsError.response?.data?.message || '위치를 확인하는 중 문제가 발생했습니다.';
      openVerificationFailure(location.name, message);
    } finally {
      setIsSubmittingGps(false);
    }
  };

  const submitQrVerification = useEffectEvent(async (authKey) => {
    if (!selectedQrLocation || isSubmittingQr) return;
    if (!authKey.trim()) {
      setQrError('먼저 QR을 촬영해주세요.');
      return;
    }

    try {
      setIsSubmittingQr(true);
      setQrError('');
      setScannerStatus('verifying');
      setScannerMessage(QR_SCANNER_MESSAGES.verifying);
      const response = await questApi.verifyQuestQr(
        userQuestId,
        selectedQrLocation.questLocationId,
        authKey.trim()
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
      const message = qrSubmitError.response?.data?.message || 'QR 인증 중 문제가 발생했습니다.';
      setQrError(message);
    } finally {
      setIsSubmittingQr(false);
    }
  });

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!selectedQrLocation || !isScannerActive) {
      stopQrScanner();
      return undefined;
    }

    let isCancelled = false;

    const startQrScanner = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setScannerStatus('noCamera');
        setScannerMessage(QR_SCANNER_MESSAGES.noCamera);
        setIsScannerActive(false);
        return;
      }

      const BarcodeDetectorApi = window.BarcodeDetector;
      let detector = null;

      if (typeof BarcodeDetectorApi === 'function') {
        try {
          detector = new BarcodeDetectorApi({ formats: ['qr_code'] });
        } catch (detectorError) {
          detector = null;
        }
      }

      try {
        stopQrScanner();
        setScannerStatus('starting');
        setScannerMessage(QR_SCANNER_MESSAGES.starting);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        qrStreamRef.current = stream;

        if (qrVideoRef.current) {
          qrVideoRef.current.srcObject = stream;
          await qrVideoRef.current.play();
        }

        if (!detector) {
          setScannerStatus('unsupported');
          setScannerMessage(QR_SCANNER_MESSAGES.unsupported);
          return;
        }

        setScannerStatus('ready');
        setScannerMessage(QR_SCANNER_MESSAGES.ready);

        const scanFrame = async () => {
          if (isCancelled || !qrVideoRef.current) return;

          const video = qrVideoRef.current;
          if (video.readyState < 2) {
            qrScanFrameRef.current = window.requestAnimationFrame(scanFrame);
            return;
          }

          try {
            const codes = await detector.detect(video);
            const detectedValue = codes.find((code) => code.rawValue)?.rawValue?.trim();

            if (detectedValue) {
              setQrAuthKey(detectedValue);
              setQrError('');
              setScannerStatus('scanned');
              setScannerMessage(QR_SCANNER_MESSAGES.scanned);
              setIsScannerActive(false);
              stopQrScanner();
              submitQrVerification(detectedValue);
              return;
            }
          } catch (scanError) {
            const canvas = qrCanvasRef.current;
            const context = canvas?.getContext('2d', { willReadFrequently: true });

            if (canvas && context && video.videoWidth > 0 && video.videoHeight > 0) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              context.drawImage(video, 0, 0, canvas.width, canvas.height);

              try {
                const bitmap = await createImageBitmap(canvas);
                const codes = await detector.detect(bitmap);
                bitmap.close();
                const detectedValue = codes.find((code) => code.rawValue)?.rawValue?.trim();

                if (detectedValue) {
                  setQrAuthKey(detectedValue);
                  setQrError('');
                  setScannerStatus('scanned');
                  setScannerMessage(QR_SCANNER_MESSAGES.scanned);
                  setIsScannerActive(false);
                  stopQrScanner();
                  submitQrVerification(detectedValue);
                  return;
                }
              } catch (bitmapError) {
                // Ignore one frame and keep scanning.
              }
            }
          }

          qrScanFrameRef.current = window.requestAnimationFrame(scanFrame);
        };

        qrScanFrameRef.current = window.requestAnimationFrame(scanFrame);
      } catch (cameraError) {
        if (isCancelled) return;

        const denied =
          cameraError?.name === 'NotAllowedError' ||
          cameraError?.name === 'SecurityError' ||
          cameraError?.name === 'PermissionDeniedError';

        setScannerStatus(denied ? 'denied' : 'error');
        setScannerMessage(denied ? QR_SCANNER_MESSAGES.denied : QR_SCANNER_MESSAGES.error);
        setIsScannerActive(false);
        stopQrScanner();
      }
    };

    startQrScanner();

    return () => {
      isCancelled = true;
      stopQrScanner();
    };
  }, [isScannerActive, selectedQrLocation]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleStartQrScanner = () => {
    setQrError('');
    setIsScannerActive(true);
    setScannerStatus('starting');
    setScannerMessage(QR_SCANNER_MESSAGES.starting);
  };

  const handleVerifyClick = (location) => {
    const locationCategory = normalizeLocationCategory(location?.locationCategory);
    if (locationCategory === 'PURCHASE') {
      openReceiptModal(location);
      return;
    }
    if (locationCategory === 'EXPERIENCE') {
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
      alert(response.data?.alreadyCompleted ? '이미 완료한 퀘스트입니다.' : '퀘스트를 완료했습니다.');
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
      setReviewError(submitError.response?.data?.message || '후기 등록 중 문제가 발생했어요.');
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
          <section className="quest-detail-empty"><h1>내 퀘스트를 불러오는 중입니다.</h1></section>
        ) : detail ? (
          <section className="quest-detail-card">
            <div className="quest-detail-head">
              <div>
                <h1>{detail.title}</h1>
                <p>{detail.description}</p>
              </div>
              <div className="quest-detail-summary"><strong>{detail.rewardPoint}P</strong><strong>{detail.rewardExp}EXP</strong><span>보상</span></div>
            </div>

            <div className="quest-detail-meta">
              <article><span>난이도</span><strong>{getDifficultyText(detail.rewardExp)}</strong></article>
              <article><span>포함 장소</span><strong>{locationSummary}</strong></article>
              <article><span>제한 시간</span><strong>{formatDuration(detail.timeLimit)}</strong></article>
            </div>

            <div className="my-quest-detail-progress-panel">
              <div className="my-quest-detail-progress-head">
                <h2>진행 현황</h2>
                <span className={`my-quest-detail-status is-${String(detail.questStatus || '').toLowerCase()}`}>{getQuestStatusLabel(detail.questStatus)}</span>
              </div>
              <div className="my-quest-detail-progress-grid">
                <article><span>진행률</span><strong>{detail.progressPercent}%</strong></article>
                <article><span>완료한 장소</span><strong>{detail.completedLocationCount}/{detail.totalLocationCount}</strong></article>
                <article><span>시작 시간</span><strong>{formatDateTime(detail.startedAt)}</strong></article>
                <article><span>종료 시간</span><strong>{formatDueDateTime(detail.dueAt)}</strong></article>
                <article><span>완료 시간</span><strong>{formatDateTime(detail.completedAt)}</strong></article>
              </div>
              <div className="my-quest-detail-progress-bar"><span style={{ width: `${detail.progressPercent}%` }} /></div>
              {detail.questStatus !== 'COMPLETED' ? (
                <div className="my-quest-detail-action-row">
                  <button type="button" className="my-quest-detail-cancel-button" onClick={handleCancelQuest} disabled={isCancelingQuest}>{isCancelingQuest ? '취소 처리 중...' : '퀘스트 취소'}</button>
                  {Number(detail.totalLocationCount) > 0 && Number(detail.completedLocationCount) >= Number(detail.totalLocationCount) ? (
                    <button type="button" className="my-quest-detail-complete-button" onClick={handleCompleteQuest} disabled={isCompletingQuest}>{isCompletingQuest ? '완료 처리 중...' : '퀘스트 완료'}</button>
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
              <h2>방문 장소</h2>
              {Array.isArray(detail.locations) && detail.locations.length > 0 ? (
                <div className="quest-detail-location-list">
                  {detail.locations.map((location) => {
                    const uploadedReceipt = receiptUploads[location.questLocationId];
                    const isCompleted = isLocationCompleted(location);
                    const isOrderReady = canVerifyLocationInOrder(detail.locations, location);
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
                          {location.description ? <span className="quest-detail-location-note">{location.description}</span> : null}
                          {clickable ? <span className="quest-detail-location-map-hint">클릭해서 지도 보기</span> : null}
                          {isCompleted ? (
                            <span className="my-quest-detail-completed-at">완료일 {formatDateTime(location.completedAt)}</span>
                          ) : (
                            <div className="my-quest-detail-verification">
                              {isOrderReady ? <button type="button" className="my-quest-detail-verify-btn" onClick={(event) => { event.stopPropagation(); handleVerifyClick(location); }} disabled={isSubmittingGps}>{normalizeLocationCategory(location.locationCategory) === 'PURCHASE' && uploadedReceipt ? '영수증 다시 업로드' : `${getVerificationLabel(location.locationCategory)} 하기`}</button> : null}
                              {!isOrderReady ? <span className="my-quest-detail-order-note">이전 장소부터 인증해주세요.</span> : null}
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
            <form className="my-quest-receipt-form" onSubmit={handleReceiptSubmit}>
              <label className="my-quest-receipt-upload-box" htmlFor="receipt-upload"><input id="receipt-upload" type="file" accept="image/*" onChange={handleReceiptFileChange} /><strong>영수증 사진 선택</strong><span>JPG, PNG 등 이미지 파일을 올려주세요.</span></label>
              {selectedReceiptFile ? <div className="my-quest-receipt-file-meta"><strong>{selectedReceiptFile.name}</strong><span>{Math.round(selectedReceiptFile.size / 1024)}KB</span></div> : null}
              {receiptPreviewUrl ? <div className="my-quest-receipt-preview-wrap"><img className="my-quest-receipt-preview" src={receiptPreviewUrl} alt="영수증 미리보기" /></div> : null}
              {receiptError ? <p className="my-quest-receipt-error">{receiptError}</p> : null}
              <div className="my-quest-receipt-actions">
                <button type="button" className="my-quest-receipt-cancel" onClick={closeReceiptModal} disabled={isSubmittingReceipt}>취소</button>
                <button type="submit" className="my-quest-receipt-submit" disabled={isSubmittingReceipt}>{isSubmittingReceipt ? '확인 중...' : '영수증 업로드'}</button>
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
            <div className="my-quest-review-form">
              <div className="my-quest-qr-scanner">
                <div className="my-quest-qr-camera-frame">
                  <video
                    ref={qrVideoRef}
                    className="my-quest-qr-video"
                    autoPlay
                    muted
                    playsInline
                  />
                  <div className="my-quest-qr-camera-guide" aria-hidden="true" />
                </div>
                <canvas ref={qrCanvasRef} className="my-quest-qr-canvas" aria-hidden="true" />
                <div className="my-quest-qr-scanner-meta">
                  <p className={`my-quest-qr-scanner-message is-${scannerStatus}`}>
                    {scannerMessage || QR_SCANNER_MESSAGES.ready}
                  </p>
                  {!isScannerActive ? (
                    <button
                      type="button"
                      className="my-quest-qr-scanner-button"
                      onClick={handleStartQrScanner}
                    >
                      카메라 다시 열기
                    </button>
                  ) : null}
                </div>
              </div>
              {qrAuthKey ? (
                <div className="my-quest-qr-detected">QR 코드가 감지되었습니다.</div>
              ) : null}
              {qrError ? <p className="my-quest-receipt-error">{qrError}</p> : null}
              <div className="my-quest-receipt-actions">
                <button type="button" className="my-quest-receipt-cancel" onClick={() => closeQrModal()} disabled={isSubmittingQr}>취소</button>
                <button type="submit" className="my-quest-receipt-submit" disabled={isSubmittingQr}>{isSubmittingQr ? '확인 중...' : 'QR 인증하기'}</button>
              </div>
            </div>
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
                <button type="submit" className="my-quest-review-submit" disabled={isSubmittingReview}>{isSubmittingReview ? '등록 중...' : myReview ? '후기 수정' : '후기 남기기'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MyQuestDetail;
