import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { questApi } from '../../api/QuestApi';
import './MainPage.css';

const LOCATION_CONSENT_KEY = 'localquest_location_consent';
const CHEONAN_CENTER = {
  lat: 36.81511,
  lng: 127.11389,
};
const STAR_OPTIONS = [1, 2, 3, 4, 5];

const hotQuestData = [
  {
    id: 1,
    title: '천안 중앙시장 먹거리 퀘스트',
    region: '충남 천안',
    description:
      '중앙시장 먹거리 골목을 따라 이동하며 인증 미션을 수행하는 대표 미식 퀘스트입니다.',
  },
  {
    id: 2,
    title: '불당동 카페거리 감성 퀘스트',
    region: '천안 불당동',
    description:
      '불당동 카페거리를 따라 걸으며 포토 인증과 체크포인트 미션을 완료하는 감성 퀘스트입니다.',
  },
  {
    id: 3,
    title: '독립기념관 역사 체험 퀘스트',
    region: '천안 목천읍',
    description:
      '독립기념관 일대를 따라 이동하며 역사 포인트를 기록하는 체험형 퀘스트입니다.',
  },
];

const questTabItems = [
  { key: 'overview', label: '홈' },
  { key: 'reviews', label: '리뷰' },
  { key: 'info', label: '정보' },
];

function formatQuestAddress(source) {
  return [source?.locationName || source?.name, source?.address, source?.addressDetail]
    .filter(Boolean)
    .join(' / ');
}

function formatReviewDate(value) {
  if (!value) {
    return '';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value).slice(0, 10);
  }

  return parsedDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function renderStarText(rating) {
  const numericRating = Math.max(0, Math.min(5, Number(rating) || 0));
  return Array.from({ length: 5 }, (_, index) => (index < numericRating ? '★' : '☆')).join('');
}

function MainPage() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRefs = useRef([]);
  const overlayRefs = useRef([]);
  const consentRef = useRef(false);

  const [hasLocationConsent, setHasLocationConsent] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(LOCATION_CONSENT_KEY) === 'granted';
  });
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingQuest, setPendingQuest] = useState(null);
  const [mapQuestList, setMapQuestList] = useState([]);
  const [activeQuestId, setActiveQuestId] = useState(null);
  const [questLoadError, setQuestLoadError] = useState('');
  const [mapStatus, setMapStatus] = useState('idle');
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [activePanelTab, setActivePanelTab] = useState('overview');
  const [questDetail, setQuestDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [questReviews, setQuestReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    content: '',
  });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editReviewForm, setEditReviewForm] = useState({
    rating: 5,
    content: '',
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState('');
  const [reviewSubmitMessage, setReviewSubmitMessage] = useState('');

  const kakaoMapKey = process.env.REACT_APP_KAKAO_MAP_KEY;

  useEffect(() => {
    consentRef.current = hasLocationConsent;
  }, [hasLocationConsent]);

  // 리뷰 목록은 생성/수정/삭제 이후에도 재사용되므로 별도 함수로 분리해 둔다.
  const fetchQuestReviews = useCallback(async (questId, options = {}) => {
    const { showLoading = true } = options;

    try {
      if (showLoading) {
        setReviewLoading(true);
      }
      setReviewError('');

      const response = await questApi.getQuestReviews(questId);
      setQuestReviews(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setReviewError('리뷰를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      if (showLoading) {
        setReviewLoading(false);
      }
    }
  }, []);

  // 지도에 뿌릴 퀘스트 목록은 대표 좌표가 있는 데이터만 남긴다.
  useEffect(() => {
    let isCancelled = false;

    const fetchQuestMapList = async () => {
      try {
        setQuestLoadError('');
        const response = await questApi.getQuestMapList();
        const nextQuestList = Array.isArray(response.data)
          ? response.data.filter(
              (quest) => Number.isFinite(quest.latitude) && Number.isFinite(quest.longitude)
            )
          : [];

        if (isCancelled) {
          return;
        }

        setMapQuestList(nextQuestList);
        if (nextQuestList.length > 0) {
          setActiveQuestId((prev) => prev || nextQuestList[0].questId);
        }
      } catch (error) {
        if (!isCancelled) {
          setQuestLoadError('천안 퀘스트 위치를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
      }
    };

    fetchQuestMapList();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 카카오 지도 SDK는 한 번만 로드하고, 준비된 map 인스턴스를 ref에 보관한다.
  useEffect(() => {
    if (!kakaoMapKey) {
      setMapStatus('missing-key');
      return undefined;
    }

    let isCancelled = false;

    const initializeMap = () => {
      if (isCancelled || !window.kakao?.maps?.LatLng || !mapRef.current) {
        if (!isCancelled) {
          setMapStatus('error');
        }
        return;
      }

      mapRef.current.innerHTML = '';

      const defaultPosition = new window.kakao.maps.LatLng(CHEONAN_CENTER.lat, CHEONAN_CENTER.lng);
      const map = new window.kakao.maps.Map(mapRef.current, {
        center: defaultPosition,
        level: 6,
      });

      mapInstanceRef.current = map;
      setMapStatus('ready');
    };

    const handleScriptError = () => {
      if (!isCancelled) {
        setMapStatus('error');
      }
    };

    const handleSdkReady = () => {
      if (isCancelled) {
        return;
      }

      if (window.kakao?.maps?.LatLng) {
        initializeMap();
        return;
      }

      if (window.kakao?.maps?.load) {
        window.kakao.maps.load(() => {
          if (!isCancelled) {
            initializeMap();
          }
        });
        return;
      }

      handleScriptError();
    };

    if (window.kakao?.maps?.LatLng) {
      initializeMap();
      return () => {
        isCancelled = true;
      };
    }

    if (window.kakao?.maps?.load) {
      window.kakao.maps.load(() => {
        if (!isCancelled) {
          initializeMap();
        }
      });
      return () => {
        isCancelled = true;
      };
    }

    setMapStatus('loading');

    const existingScript = document.querySelector('script[data-kakao-map-sdk="true"]');

    if (existingScript) {
      if (existingScript.getAttribute('data-loaded') === 'true') {
        handleSdkReady();
        return () => {
          isCancelled = true;
        };
      }

      existingScript.addEventListener('load', handleSdkReady);
      existingScript.addEventListener('error', handleScriptError);

      return () => {
        isCancelled = true;
        existingScript.removeEventListener('load', handleSdkReady);
        existingScript.removeEventListener('error', handleScriptError);
      };
    }

    const script = document.createElement('script');
    const handleScriptLoad = () => {
      script.setAttribute('data-loaded', 'true');
      handleSdkReady();
    };

    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapKey}&autoload=false`;
    script.async = true;
    script.setAttribute('data-kakao-map-sdk', 'true');
    script.addEventListener('load', handleScriptLoad);
    script.addEventListener('error', handleScriptError);
    document.head.appendChild(script);

    return () => {
      isCancelled = true;
      script.removeEventListener('load', handleScriptLoad);
      script.removeEventListener('error', handleScriptError);
    };
  }, [kakaoMapKey]);
  const openQuestPanel = useCallback((quest) => {
    setSelectedQuest(quest);
    setActivePanelTab('overview');
    setReviewSubmitError('');
    setReviewSubmitMessage('');
    setReviewForm({ rating: 5, content: '' });
    setEditingReviewId(null);
    setEditReviewForm({ rating: 5, content: '' });
  }, []);

  // 위치 동의는 퀘스트 상세를 열기 직전에만 체크한다.
  const handleQuestSelect = useCallback(
    (quest) => {
      setActiveQuestId(quest.questId);

      if (mapInstanceRef.current && window.kakao?.maps?.LatLng) {
        mapInstanceRef.current.panTo(new window.kakao.maps.LatLng(quest.latitude, quest.longitude));
      }

      if (!consentRef.current) {
        setPendingQuest(quest);
        setShowConsentModal(true);
        return;
      }

      openQuestPanel(quest);
    },
    [openQuestPanel]
  );

  // 마커와 오버레이는 퀘스트 목록/선택 상태가 바뀔 때마다 다시 그린다.
  useEffect(() => {
    if (mapStatus !== 'ready' || !mapInstanceRef.current || !window.kakao?.maps) {
      return undefined;
    }

    const map = mapInstanceRef.current;

    markerRefs.current.forEach((marker) => marker.setMap(null));
    overlayRefs.current.forEach((overlay) => overlay.setMap(null));
    markerRefs.current = [];
    overlayRefs.current = [];

    if (!mapQuestList.length) {
      const center = new window.kakao.maps.LatLng(CHEONAN_CENTER.lat, CHEONAN_CENTER.lng);
      map.setCenter(center);
      map.setLevel(6);
      return undefined;
    }

    const bounds = new window.kakao.maps.LatLngBounds();

    mapQuestList.forEach((quest) => {
      const position = new window.kakao.maps.LatLng(quest.latitude, quest.longitude);
      bounds.extend(position);

      const marker = new window.kakao.maps.Marker({
        map,
        position,
      });

      markerRefs.current.push(marker);

      const content = document.createElement('button');
      content.type = 'button';
      content.className = `map-quest-overlay-chip${activeQuestId === quest.questId ? ' is-active' : ''}`;

      const title = document.createElement('strong');
      title.textContent = quest.title;

      const subtitle = document.createElement('span');
      subtitle.textContent = quest.locationName || quest.category || 'QUEST';

      content.appendChild(title);
      content.appendChild(subtitle);
      content.addEventListener('click', () => handleQuestSelect(quest));

      const overlay = new window.kakao.maps.CustomOverlay({
        position,
        content,
        yAnchor: 1.9,
      });

      overlay.setMap(map);
      overlayRefs.current.push(overlay);

      window.kakao.maps.event.addListener(marker, 'click', () => handleQuestSelect(quest));
    });

    if (mapQuestList.length === 1) {
      map.setCenter(bounds.getCenter());
      map.setLevel(4);
    } else {
      map.setBounds(bounds);
    }

    return () => {
      markerRefs.current.forEach((marker) => marker.setMap(null));
      overlayRefs.current.forEach((overlay) => overlay.setMap(null));
      markerRefs.current = [];
      overlayRefs.current = [];
    };
  }, [activeQuestId, handleQuestSelect, mapQuestList, mapStatus]);

  // 상세 패널이 열리면 퀘스트 상세/리뷰를 함께 불러와서 탭 전환 시 즉시 보여준다.
  useEffect(() => {
    if (!selectedQuest?.questId) {
      return undefined;
    }

    let isCancelled = false;

    const fetchQuestDetail = async () => {
      try {
        setDetailLoading(true);
        setDetailError('');
        setQuestDetail(null);

        const response = await questApi.getQuestDetail(selectedQuest.questId);
        if (!isCancelled) {
          setQuestDetail(response.data);
        }
      } catch (error) {
        if (!isCancelled) {
          setDetailError('퀘스트 상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
      } finally {
        if (!isCancelled) {
          setDetailLoading(false);
        }
      }
    };

    fetchQuestDetail();
    fetchQuestReviews(selectedQuest.questId);

    return () => {
      isCancelled = true;
    };
  }, [fetchQuestReviews, selectedQuest?.questId]);

  const handleConsentApprove = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCATION_CONSENT_KEY, 'granted');
    }

    setHasLocationConsent(true);
    consentRef.current = true;
    setShowConsentModal(false);

    if (pendingQuest) {
      setActiveQuestId(pendingQuest.questId);
      openQuestPanel(pendingQuest);
      setPendingQuest(null);
    }
  };

  const handleConsentClose = () => {
    setShowConsentModal(false);
    setPendingQuest(null);
  };

  const handleQuestPanelClose = () => {
    setSelectedQuest(null);
    setQuestDetail(null);
    setQuestReviews([]);
    setActivePanelTab('overview');
    setReviewSubmitError('');
    setReviewSubmitMessage('');
    setEditingReviewId(null);
    setEditReviewForm({ rating: 5, content: '' });
  };

  const handleReviewFieldChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditReviewFieldChange = (event) => {
    const { name, value } = event.target;
    setEditReviewForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 비로그인 사용자는 리뷰 읽기만 가능하고, 작성 폼은 로그인 후에만 노출한다.
  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!selectedQuest?.questId) {
      return;
    }

    if (!isAuthenticated || !user?.userId) {
      setReviewSubmitError('로그인한 사용자만 리뷰를 작성할 수 있습니다.');
      return;
    }

    const trimmedContent = reviewForm.content.trim();
    if (!trimmedContent) {
      setReviewSubmitError('리뷰 내용을 입력해주세요.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      setReviewSubmitError('');
      setReviewSubmitMessage('');

      await questApi.createQuestReview(selectedQuest.questId, {
        userId: user.userId,
        rating: Number(reviewForm.rating),
        content: trimmedContent,
      });

      await fetchQuestReviews(selectedQuest.questId, { showLoading: false });
      setReviewForm({ rating: 5, content: '' });
      setReviewSubmitMessage('리뷰가 등록되었습니다.');
      setActivePanelTab('reviews');
    } catch (error) {
      setReviewSubmitError(
        error.response?.data?.message || '리뷰 등록 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const startReviewEdit = (review) => {
    setEditingReviewId(review.reviewId);
    setEditReviewForm({
      rating: Number(review.rating) || 5,
      content: review.content || '',
    });
    setReviewSubmitError('');
    setReviewSubmitMessage('');
    setActivePanelTab('reviews');
  };

  const cancelReviewEdit = () => {
    setEditingReviewId(null);
    setEditReviewForm({ rating: 5, content: '' });
    setReviewSubmitError('');
    setReviewSubmitMessage('');
  };

  // 수정/삭제는 내가 작성한 리뷰 카드에서만 가능하게 막는다.
  const handleReviewUpdate = async (event) => {
    event.preventDefault();

    if (!selectedQuest?.questId || !editingReviewId) {
      return;
    }

    if (!isAuthenticated || !user?.userId) {
      setReviewSubmitError('로그인한 사용자만 리뷰를 수정할 수 있습니다.');
      return;
    }

    const trimmedContent = editReviewForm.content.trim();
    if (!trimmedContent) {
      setReviewSubmitError('리뷰 내용을 입력해주세요.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      setReviewSubmitError('');
      setReviewSubmitMessage('');

      await questApi.updateQuestReview(selectedQuest.questId, editingReviewId, {
        userId: user.userId,
        rating: Number(editReviewForm.rating),
        content: trimmedContent,
      });

      await fetchQuestReviews(selectedQuest.questId, { showLoading: false });
      setEditingReviewId(null);
      setEditReviewForm({ rating: 5, content: '' });
      setReviewSubmitMessage('리뷰가 수정되었습니다.');
    } catch (error) {
      setReviewSubmitError(
        error.response?.data?.message || '리뷰 수정 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReviewDelete = async (reviewId) => {
    if (!selectedQuest?.questId || !isAuthenticated || !user?.userId) {
      setReviewSubmitError('로그인한 사용자만 리뷰를 삭제할 수 있습니다.');
      return;
    }

    const shouldDelete = window.confirm('이 리뷰를 삭제할까요?');
    if (!shouldDelete) {
      return;
    }

    try {
      setIsSubmittingReview(true);
      setReviewSubmitError('');
      setReviewSubmitMessage('');

      await questApi.deleteQuestReview(selectedQuest.questId, reviewId, user.userId);
      await fetchQuestReviews(selectedQuest.questId, { showLoading: false });

      if (editingReviewId === reviewId) {
        cancelReviewEdit();
      }

      setReviewSubmitMessage('리뷰가 삭제되었습니다.');
    } catch (error) {
      setReviewSubmitError(
        error.response?.data?.message || '리뷰 삭제 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };
  const reviewCount = questReviews.length;
  const reviewAverage = reviewCount
    ? (
        questReviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviewCount
      ).toFixed(1)
    : '0.0';
  const panelQuest = questDetail ?? selectedQuest;
  const panelLocations = questDetail?.locations ?? [];
  const representativeLocation =
    panelLocations[0] ||
    (selectedQuest
      ? {
          name: selectedQuest.locationName,
          address: selectedQuest.address,
          addressDetail: selectedQuest.addressDetail,
          latitude: selectedQuest.latitude,
          longitude: selectedQuest.longitude,
          locationType: selectedQuest.locationType,
        }
      : null);

  const myReview = useMemo(() => {
    if (!isAuthenticated || !user?.userId) {
      return null;
    }

    return questReviews.find((review) => Number(review.userId) === Number(user.userId)) || null;
  }, [isAuthenticated, questReviews, user?.userId]);

  const canWriteReview = Boolean(isAuthenticated && user?.userId && !myReview && !editingReviewId);

  const renderReviewForm = ({
    title,
    subtitle,
    formState,
    setRating,
    onChange,
    onSubmit,
    submitLabel,
    cancelButton,
  }) => (
    <form className="quest-review-form" onSubmit={onSubmit}>
      <div className="quest-review-form-head">
        <h4>{title}</h4>
        <span>{subtitle}</span>
      </div>

      <div className="review-rating-row">
        <div className="review-rating-stars" aria-label="별점 선택">
          {STAR_OPTIONS.map((star) => (
            <button
              key={star}
              type="button"
              className={`review-rating-btn${star <= formState.rating ? ' is-active' : ''}`}
              onClick={() => setRating(star)}
              aria-label={`${star}점 선택`}
            >
              <span className="review-rating-star">{star <= formState.rating ? '★' : '☆'}</span>
            </button>
          ))}
        </div>
        <span className="review-rating-value">{formState.rating} / 5</span>
      </div>

      <textarea
        className="quest-review-textarea"
        name="content"
        value={formState.content}
        onChange={onChange}
        placeholder="퀘스트를 직접 경험한 후기를 남겨주세요."
      />

      {reviewSubmitError ? (
        <p className="quest-review-message is-error">{reviewSubmitError}</p>
      ) : null}
      {reviewSubmitMessage ? (
        <p className="quest-review-message is-success">{reviewSubmitMessage}</p>
      ) : null}

      <div className={cancelButton ? 'quest-review-submit-row-split' : 'quest-review-submit-row'}>
        {cancelButton}
        <button type="submit" className="quest-review-submit" disabled={isSubmittingReview}>
          {isSubmittingReview ? '처리 중...' : submitLabel}
        </button>
      </div>
    </form>
  );

  return (
    <div className="main-page-shell">
      <div className="main-page">
        <section className="hero-map-section">
          <div className="hero-copy">
            <span className="hero-chip">MISSION BASED O2O PLATFORM</span>
            <h1 className="hero-title">
              <span className="hero-title-line">지루한 일상이</span>
              <span className="hero-title-line accent">게임이 되는 순간</span>
            </h1>
            <p className="hero-description">
              단순한 방문이 아닙니다. GPS와 QR 인증을 통해 지역 곳곳에 숨겨진 퀘스트를 수행하고,
              레벨을 높이며 당신만의 탐험 지도를 완성하세요.
            </p>
          </div>

          <div className={`map-shell${mapStatus === 'ready' ? ' is-consented' : ''}`}>
            <div ref={mapRef} className="map-canvas" />

            {mapStatus === 'loading' ? (
              <div className="map-overlay-message">지도를 불러오는 중입니다.</div>
            ) : null}

            {mapStatus === 'missing-key' ? (
              <div className="map-overlay-message">
                카카오 지도 앱 키가 없어 지도를 표시할 수 없습니다.
              </div>
            ) : null}

            {mapStatus === 'error' ? (
              <div className="map-overlay-message">
                지도를 불러오는 중 문제가 발생했습니다. 카카오 콘솔 설정과 앱 키를 확인해주세요.
              </div>
            ) : null}
          </div>

          <div className="map-quest-strip">
            <div className="map-quest-strip-head">
              <div className="section-heading">
                <span className="section-badge">LOCAL MAP</span>
                <h2>천안 퀘스트를 지도로 만나보세요</h2>
                <p>
                  마커 또는 아래 카드에서 퀘스트를 선택하면 상세 정보와 리뷰를 확인할 수 있습니다.
                </p>
              </div>
            </div>

            {questLoadError ? <div className="map-quest-empty">{questLoadError}</div> : null}

            <div className="map-quest-card-list">
              {mapQuestList.length ? (
                mapQuestList.map((quest) => (
                  <button
                    key={quest.questId}
                    type="button"
                    className={`map-quest-card${activeQuestId === quest.questId ? ' is-active' : ''}`}
                    onClick={() => handleQuestSelect(quest)}
                  >
                    <div className="map-quest-card-top">
                      <span className="map-quest-category">{quest.category || 'QUEST'}</span>
                      <span className="map-quest-reward">+ {quest.rewardPoint}P</span>
                    </div>
                    <strong>{quest.title}</strong>
                    <p>{quest.description}</p>
                    <span className="map-quest-location">{formatQuestAddress(quest)}</span>
                  </button>
                ))
              ) : (
                <div className="map-quest-empty">표시할 퀘스트가 아직 없습니다.</div>
              )}
            </div>
          </div>
        </section>

        <section className="hot-quest-section">
          <div className="section-heading">
            <span className="section-badge">HOT QUEST</span>
            <h2>지금 가장 핫한 지역 퀘스트</h2>
          </div>
          <div className="quest-card-grid">
            {hotQuestData.map((quest) => (
              <article key={quest.id} className="quest-card">
                <span className="quest-region">{quest.region}</span>
                <h3>{quest.title}</h3>
                <p>{quest.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="partner-banner-section">
          <div className="partner-banner partner-banner-cta">
            <span className="section-badge">BUSINESS PARTNER</span>
            <h2>우리 매장을 퀘스트 명소로 만들고 싶으신가요?</h2>
            <p>
              Local Quest 파트너가 되어 매장에 활기를 더하세요. 실방문객 중심의 마케팅 효과를 직접
              경험해보세요.
            </p>
            <Link to="/business" className="partner-cta-btn">
              비즈니스 상담 신청하기
            </Link>
          </div>
        </section>
      </div>

      {selectedQuest ? (
        <div className="map-quest-panel-overlay" onClick={handleQuestPanelClose}>
          <div className="map-quest-panel" onClick={(event) => event.stopPropagation()}>
            <div className="map-quest-panel-head">
              <div>
                <span className="map-quest-panel-chip">{panelQuest?.category || 'QUEST'}</span>
                <h3>{panelQuest?.title || '퀘스트 상세'}</h3>
              </div>
              <button type="button" className="map-quest-panel-close" onClick={handleQuestPanelClose}>
                ×
              </button>
            </div>

            <div className="map-quest-panel-tabs">
              {questTabItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`map-quest-tab${activePanelTab === item.key ? ' is-active' : ''}`}
                  onClick={() => setActivePanelTab(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="map-quest-panel-body">
              {detailLoading ? <div className="panel-loading-state">퀘스트 정보를 불러오는 중입니다.</div> : null}
              {detailError ? <div className="panel-empty-state">{detailError}</div> : null}

              {!detailLoading && !detailError && activePanelTab === 'overview' ? (
                <div className="quest-panel-section">
                  <div className="quest-panel-hero-card">
                    <div className="quest-panel-hero-copy">
                      <strong>{panelQuest?.title}</strong>
                      <p>{panelQuest?.description || '선택한 지역에서 수행 가능한 퀘스트입니다.'}</p>
                    </div>
                    <div className="quest-panel-stat-grid">
                      <div className="quest-panel-stat">
                        <span>보상 포인트</span>
                        <strong>{panelQuest?.rewardPoint ?? 0}P</strong>
                      </div>
                      <div className="quest-panel-stat">
                        <span>경험치</span>
                        <strong>{panelQuest?.rewardExp ?? 0} EXP</strong>
                      </div>
                      <div className="quest-panel-stat">
                        <span>제한 시간</span>
                        <strong>{panelQuest?.timeLimit ?? '-'}분</strong>
                      </div>
                      <div className="quest-panel-stat">
                        <span>대표 위치</span>
                        <strong>{representativeLocation?.name || '위치 준비 중'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="quest-panel-section-head">
                    <h4>방문 루트</h4>
                    <span>{panelLocations.length ? `${panelLocations.length}개 지점` : '대표 위치 기준'}</span>
                  </div>

                  <div className="quest-panel-route-list">
                    {panelLocations.length ? (
                      panelLocations.map((location) => (
                        <div key={location.questLocationId} className="quest-panel-route-item">
                          <span className="quest-panel-route-order">{location.visitOrder}</span>
                          <div>
                            <strong>{location.name}</strong>
                            <p>{formatQuestAddress(location)}</p>
                          </div>
                        </div>
                      ))
                    ) : representativeLocation ? (
                      <div className="quest-panel-route-item">
                        <span className="quest-panel-route-order">1</span>
                        <div>
                          <strong>{representativeLocation.name || '대표 위치'}</strong>
                          <p>{formatQuestAddress(representativeLocation)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="panel-empty-state">아직 연결된 위치 정보가 없습니다.</div>
                    )}
                  </div>

                  <div className="quest-panel-action-row">
                    <Link className="quest-panel-primary-link" to={`/quest/${selectedQuest.questId}`}>
                      퀘스트 상세보기
                    </Link>
                  </div>
                </div>
              ) : null}

              {!detailLoading && !detailError && activePanelTab === 'reviews' ? (
                <div className="quest-panel-section">
                  <div className="quest-panel-section-head">
                    <h4>방문자 리뷰</h4>
                    <span>직접 경험한 사용자들의 후기</span>
                  </div>

                  <div className="quest-review-summary">
                    <div>
                      <span>평균 별점</span>
                      <strong>{reviewAverage}</strong>
                    </div>
                    <div>
                      <span>등록 리뷰</span>
                      <strong>{reviewCount}개</strong>
                    </div>
                  </div>

                  {!isAuthenticated ? (
                    <div className="quest-review-login-box">
                      <p>
                        비로그인 사용자는 리뷰를 읽을 수만 있습니다. 리뷰 작성, 수정, 삭제는 로그인 후
                        이용해주세요.
                      </p>
                      <button
                        type="button"
                        className="quest-review-login-btn"
                        onClick={() => navigate('/login')}
                      >
                        로그인하러 가기
                      </button>
                    </div>
                  ) : null}

                  {isAuthenticated && editingReviewId
                    ? renderReviewForm({
                        title: '리뷰 수정',
                        subtitle: '내가 남긴 리뷰를 다시 정리해보세요.',
                        formState: editReviewForm,
                        setRating: (rating) =>
                          setEditReviewForm((prev) => ({
                            ...prev,
                            rating,
                          })),
                        onChange: handleEditReviewFieldChange,
                        onSubmit: handleReviewUpdate,
                        submitLabel: '리뷰 수정하기',
                        cancelButton: (
                          <button
                            type="button"
                            className="quest-review-cancel-btn"
                            onClick={cancelReviewEdit}
                          >
                            취소
                          </button>
                        ),
                      })
                    : null}

                  {canWriteReview
                    ? renderReviewForm({
                        title: '리뷰 작성',
                        subtitle: '퀘스트를 직접 수행한 후기를 남겨주세요.',
                        formState: reviewForm,
                        setRating: (rating) =>
                          setReviewForm((prev) => ({
                            ...prev,
                            rating,
                          })),
                        onChange: handleReviewFieldChange,
                        onSubmit: handleReviewSubmit,
                        submitLabel: '리뷰 등록하기',
                      })
                    : null}

                  {isAuthenticated && myReview && !editingReviewId ? (
                    <div className="quest-review-note-box">
                      이 퀘스트에 리뷰를 작성했습니다.
                      
                    </div>
                  ) : null}

                  {reviewLoading ? <div className="panel-loading-state">리뷰를 불러오는 중입니다.</div> : null}
                  {!reviewLoading && reviewError ? <div className="panel-empty-state">{reviewError}</div> : null}

                  {!reviewLoading && !reviewError ? (
                    <div className="quest-review-list">
                      {questReviews.length ? (
                        questReviews.map((review) => {
                          const isMyReview =
                            isAuthenticated && Number(review.userId) === Number(user?.userId);

                          return (
                            <article key={review.reviewId} className="quest-review-card">
                              <div className="quest-review-card-head">
                                <div className="quest-review-card-side">
                                  <strong>{review.authorName || '로컬 유저'}</strong>
                                  <span>{formatReviewDate(review.createdAt)}</span>
                                </div>

                                <div className="quest-review-card-side">
                                  <span className="quest-review-rating">{renderStarText(review.rating)}</span>
                                  {isMyReview ? (
                                    <div className="quest-review-card-actions">
                                      <button
                                        type="button"
                                        className="quest-review-action-btn"
                                        onClick={() => startReviewEdit(review)}
                                      >
                                        수정
                                      </button>
                                      <button
                                        type="button"
                                        className="quest-review-action-btn is-danger"
                                        onClick={() => handleReviewDelete(review.reviewId)}
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <p>{review.content}</p>
                            </article>
                          );
                        })
                      ) : (
                        <div className="panel-empty-state">아직 등록된 리뷰가 없습니다.</div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {!detailLoading && !detailError && activePanelTab === 'info' ? (
                <div className="quest-panel-section">
                  <div className="quest-panel-section-head">
                    <h4>퀘스트 정보</h4>
                    <span>위치와 기본 안내</span>
                  </div>

                  <div className="quest-panel-info-list">
                    <div className="quest-panel-info-item">
                      <span>카테고리</span>
                      <strong>{panelQuest?.category || '미분류'}</strong>
                    </div>
                    <div className="quest-panel-info-item">
                      <span>대표 주소</span>
                      <strong>{formatQuestAddress(representativeLocation) || '주소 정보 준비 중'}</strong>
                    </div>
                    <div className="quest-panel-info-item">
                      <span>좌표</span>
                      <strong>
                        {representativeLocation?.latitude && representativeLocation?.longitude
                          ? `${representativeLocation.latitude}, ${representativeLocation.longitude}`
                          : '좌표 정보 준비 중'}
                      </strong>
                    </div>
                    <div className="quest-panel-info-item">
                      <span>설명</span>
                      <strong>{panelQuest?.description || '퀘스트 설명이 아직 등록되지 않았습니다.'}</strong>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showConsentModal ? (
        <div className="modal-overlay" onClick={handleConsentClose}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>위치기반서비스 이용 동의</h3>
            <p>
              지도의 퀘스트 상세를 확인하려면 위치기반서비스 동의가 필요합니다. 동의 후에는 천안 지역
              퀘스트와 연결된 위치 정보를 더 자세히 확인할 수 있습니다.
            </p>
            <div className="modal-action-row">
              <button type="button" className="modal-secondary-btn" onClick={handleConsentClose}>
                닫기
              </button>
              <button type="button" className="modal-primary-btn" onClick={handleConsentApprove}>
                동의하고 계속하기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MainPage;
