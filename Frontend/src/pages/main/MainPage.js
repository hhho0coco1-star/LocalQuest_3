import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { questApi } from '../../api/QuestApi';
import './MainPage.css';

const LOCATION_CONSENT_KEY = 'localquest_location_consent';
const QUEST_SEARCH_RADIUS_METERS = 3000;
const DEFAULT_MAP_LEVEL = 5;
const HUMAN_CENTER_ADDRESS = '충남 천안시 동남구 대흥로 215';
const HUMAN_CENTER_FALLBACK = {
  lat: 36.81511,
  lng: 127.11389,
};

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

function formatQuestRegion(source) {
  const addressTokens = String(source?.address || '')
    .split(/\s+/)
    .filter(Boolean);

  if (addressTokens.length >= 2) {
    return `${addressTokens[0]} ${addressTokens[1]}`;
  }

  return source?.locationName || '천안 추천';
}

function calculateDistanceMeters(startLat, startLng, endLat, endLng) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const latitudeDelta = toRadians(endLat - startLat);
  const longitudeDelta = toRadians(endLng - startLng);
  const startLatitudeInRadians = toRadians(startLat);
  const endLatitudeInRadians = toRadians(endLat);

  const haversineValue =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(startLatitudeInRadians) *
    Math.cos(endLatitudeInRadians) *
    Math.sin(longitudeDelta / 2) *
    Math.sin(longitudeDelta / 2);

  const angularDistance = 2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));
  return earthRadius * angularDistance;
}

function filterQuestsWithinRadius(questList, center, radiusMeters = QUEST_SEARCH_RADIUS_METERS) {
  if (!center) {
    return [];
  }

  return questList.filter((quest) => {
    if (!Number.isFinite(quest.latitude) || !Number.isFinite(quest.longitude)) {
      return false;
    }

    return (
      calculateDistanceMeters(center.lat, center.lng, quest.latitude, quest.longitude) <= radiusMeters
    );
  });
}

function buildRadiusMessage(center, questCount) {
  if (!center) {
    return '';
  }

  if (questCount > 0) {
    return `${center.mode === 'current' ? '내 현재 위치 기준' : '지도 중심 기준'} 3km 내 퀘스트 ${questCount}개`;
  }

  if (center.mode === 'current') {
    return '내 현재 위치 3km 내에 퀘스트가 없습니다. 지도를 이동해 다른 위치의 퀘스트를 탐색해보세요.';
  }

  return '현재 지도 중심 3km 내에 퀘스트가 없습니다. 지도를 더 이동해보세요.';
}

function MainPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRefs = useRef([]);
  const overlayRefs = useRef([]);
  const currentLocationMarkerRef = useRef(null);
  const searchCircleRef = useRef(null);
  const skipNextIdleRef = useRef(false);
  const consentRef = useRef(false);
  const topQuestTrackRef = useRef(null);
  const topQuestDragRef = useRef({
    isPointerDown: false,
    startX: 0,
    startScrollLeft: 0,
    hasDragged: false,
  });
  const topQuestSuppressClickUntilRef = useRef(0);

  const [hasLocationConsent, setHasLocationConsent] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(LOCATION_CONSENT_KEY) === 'granted';
  });
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingQuest, setPendingQuest] = useState(null);
  const [mapQuestList, setMapQuestList] = useState([]);
  const [visibleQuestList, setVisibleQuestList] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchCenter, setSearchCenter] = useState(null);
  const [radiusStatusMessage, setRadiusStatusMessage] = useState('');
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
  const [topRatedQuests, setTopRatedQuests] = useState([]);
  const [topRatedLoading, setTopRatedLoading] = useState(true);
  const [topRatedError, setTopRatedError] = useState('');
  const [topQuestScrollValue, setTopQuestScrollValue] = useState(0);
  const [canScrollTopQuestPrev, setCanScrollTopQuestPrev] = useState(false);
  const [canScrollTopQuestNext, setCanScrollTopQuestNext] = useState(false);
  const [isTopQuestDragging, setIsTopQuestDragging] = useState(false);

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

  const updateTopQuestScrollState = useCallback(() => {
    const track = topQuestTrackRef.current;

    if (!track) {
      setTopQuestScrollValue(0);
      setCanScrollTopQuestPrev(false);
      setCanScrollTopQuestNext(false);
      return;
    }

    const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
    const nextScrollValue = maxScrollLeft > 0 ? (track.scrollLeft / maxScrollLeft) * 100 : 0;

    setTopQuestScrollValue(nextScrollValue);
    setCanScrollTopQuestPrev(track.scrollLeft > 8);
    setCanScrollTopQuestNext(track.scrollLeft < maxScrollLeft - 8);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchTopRatedQuests = async () => {
      try {
        setTopRatedLoading(true);
        setTopRatedError('');

        const response = await questApi.getTopRatedQuests();
        if (!isCancelled) {
          setTopRatedQuests(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        if (!isCancelled) {
          setTopRatedError('추천 퀘스트를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
      } finally {
        if (!isCancelled) {
          setTopRatedLoading(false);
        }
      }
    };

    fetchTopRatedQuests();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    updateTopQuestScrollState();

    const handleResize = () => {
      updateTopQuestScrollState();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [topRatedQuests, updateTopQuestScrollState]);

  // 지도에 뿌릴 퀘스트 목록은 대표 좌표가 있는 데이터만 남긴다.
  useEffect(() => {
    let isCancelled = false;

    const fetchQuestMapList = async () => {
      try {
        setQuestLoadError('');
        const response = await questApi.getQuestMapList();
        const nextQuestList = Array.isArray(response.data)
          ? response.data
            .map((quest) => ({
              ...quest,
              latitude: Number(quest.latitude),
              longitude: Number(quest.longitude),
            }))
            .filter((quest) => Number.isFinite(quest.latitude) && Number.isFinite(quest.longitude))
          : [];

        if (isCancelled) {
          return;
        }

        setMapQuestList(nextQuestList);
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

      const defaultPosition = new window.kakao.maps.LatLng(
        HUMAN_CENTER_FALLBACK.lat,
        HUMAN_CENTER_FALLBACK.lng
      );
      const map = new window.kakao.maps.Map(mapRef.current, {
        center: defaultPosition,
        level: DEFAULT_MAP_LEVEL,
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

    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapKey}&autoload=false&libraries=services`;
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

  useEffect(() => {
    if (mapStatus !== 'ready' || !mapInstanceRef.current || currentLocation || searchCenter) {
      return undefined;
    }

    let isCancelled = false;
    const map = mapInstanceRef.current;

    const applyInitialCenter = (lat, lng, label = '현재 위치') => {
      if (isCancelled || !window.kakao?.maps?.LatLng) {
        return;
      }

      const nextCurrentLocation = {
        lat,
        lng,
        label,
      };

      skipNextIdleRef.current = true;
      map.setCenter(new window.kakao.maps.LatLng(lat, lng));
      map.setLevel(DEFAULT_MAP_LEVEL);
      setCurrentLocation(nextCurrentLocation);
      setSearchCenter({
        ...nextCurrentLocation,
        mode: 'current',
      });
    };

    const applyFallbackCenter = () => {
      applyInitialCenter(HUMAN_CENTER_FALLBACK.lat, HUMAN_CENTER_FALLBACK.lng, HUMAN_CENTER_ADDRESS);
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isCancelled) {
            return;
          }

          applyInitialCenter(position.coords.latitude, position.coords.longitude);
        },
        () => {
          if (!isCancelled) {
            applyFallbackCenter();
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );

      return () => {
        isCancelled = true;
      };
    }

    applyFallbackCenter();

    return () => {
      isCancelled = true;
    };
  }, [currentLocation, mapStatus, searchCenter]);

  useEffect(() => {
    if (!searchCenter) {
      setVisibleQuestList([]);
      setRadiusStatusMessage('');
      return;
    }

    const nextVisibleQuestList = filterQuestsWithinRadius(mapQuestList, searchCenter);
    setVisibleQuestList(nextVisibleQuestList);
    setRadiusStatusMessage(buildRadiusMessage(searchCenter, nextVisibleQuestList.length));
    setActiveQuestId((prev) => {
      if (nextVisibleQuestList.some((quest) => quest.questId === prev)) {
        return prev;
      }

      return nextVisibleQuestList[0]?.questId ?? null;
    });
  }, [mapQuestList, searchCenter]);

  useEffect(() => {
    if (mapStatus !== 'ready' || !mapInstanceRef.current || !window.kakao?.maps?.event) {
      return undefined;
    }

    const map = mapInstanceRef.current;
    const handleIdle = () => {
      if (skipNextIdleRef.current) {
        skipNextIdleRef.current = false;
        return;
      }

      const center = map.getCenter();
      if (!center) {
        return;
      }

      const nextLat = center.getLat();
      const nextLng = center.getLng();

      setSearchCenter((prev) => {
        if (
          prev &&
          Math.abs(prev.lat - nextLat) < 0.00001 &&
          Math.abs(prev.lng - nextLng) < 0.00001
        ) {
          return prev;
        }

        return {
          lat: nextLat,
          lng: nextLng,
          mode: 'map',
          label: 'map-center',
        };
      });
    };

    window.kakao.maps.event.addListener(map, 'idle', handleIdle);

    return () => {
      window.kakao.maps.event.removeListener(map, 'idle', handleIdle);
    };
  }, [mapStatus]);

  const openQuestPanel = useCallback((quest) => {
    setSelectedQuest(quest);
    setActivePanelTab('overview');
  }, []);

  // 위치 동의는 퀘스트 상세를 열기 직전에만 체크한다.
  const handleQuestSelect = useCallback(
    (quest) => {
      setActiveQuestId(quest.questId);

      if (
        mapInstanceRef.current &&
        window.kakao?.maps?.LatLng &&
        Number.isFinite(quest.latitude) &&
        Number.isFinite(quest.longitude)
      ) {
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

  const scrollTopRatedQuests = useCallback((direction) => {
    const track = topQuestTrackRef.current;
    if (!track) {
      return;
    }

    const scrollAmount = Math.max(track.clientWidth * 0.82, 320);
    track.scrollBy({
      left: direction * scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  const handleTopQuestRangeChange = useCallback(
    (event) => {
      const track = topQuestTrackRef.current;
      if (!track) {
        return;
      }

      const nextValue = Number(event.target.value) || 0;
      const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);

      track.scrollLeft = (maxScrollLeft * nextValue) / 100;
      setTopQuestScrollValue(nextValue);
      updateTopQuestScrollState();
    },
    [updateTopQuestScrollState]
  );

  const handleTopQuestPointerDown = useCallback((event) => {
    const track = topQuestTrackRef.current;
    if (!track) {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    topQuestDragRef.current = {
      isPointerDown: true,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
      hasDragged: false,
    };

    setIsTopQuestDragging(false);
  }, []);

  const handleTopQuestPointerMove = useCallback(
    (event) => {
      const track = topQuestTrackRef.current;
      const dragState = topQuestDragRef.current;

      if (!track || !dragState.isPointerDown) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      if (!dragState.hasDragged && Math.abs(deltaX) < 6) {
        return;
      }

      if (!dragState.hasDragged) {
        dragState.hasDragged = true;
        setIsTopQuestDragging(true);
      }

      track.scrollLeft = dragState.startScrollLeft - deltaX;
      updateTopQuestScrollState();
    },
    [updateTopQuestScrollState]
  );

  const finishTopQuestDrag = useCallback(() => {
    const track = topQuestTrackRef.current;
    const dragState = topQuestDragRef.current;

    if (!dragState.isPointerDown) {
      return;
    }

    if (dragState.hasDragged) {
      topQuestSuppressClickUntilRef.current = Date.now() + 220;
    }

    topQuestDragRef.current = {
      isPointerDown: false,
      startX: 0,
      startScrollLeft: 0,
      hasDragged: false,
    };

    setIsTopQuestDragging(false);
    updateTopQuestScrollState();
  }, [updateTopQuestScrollState]);

  const handleTopQuestCardClick = useCallback(
    (quest) => {
      if (Date.now() < topQuestSuppressClickUntilRef.current) {
        return;
      }

      window.location.href = `/explore/${quest.questId}`;
    },
    []
  );

  useEffect(() => {
    const handleWindowMouseMove = (event) => {
      handleTopQuestPointerMove(event);
    };

    const handleWindowMouseUp = () => {
      finishTopQuestDrag();
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [finishTopQuestDrag, handleTopQuestPointerMove]);

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
    currentLocationMarkerRef.current?.setMap(null);
    searchCircleRef.current?.setMap(null);
    currentLocationMarkerRef.current = null;
    searchCircleRef.current = null;

    if (currentLocation) {
      const currentPosition = new window.kakao.maps.LatLng(currentLocation.lat, currentLocation.lng);

      currentLocationMarkerRef.current = new window.kakao.maps.Marker({
        map,
        position: currentPosition,
        zIndex: 10,
      });
    }

    if (searchCenter) {
      const centerPosition = new window.kakao.maps.LatLng(searchCenter.lat, searchCenter.lng);

      searchCircleRef.current = new window.kakao.maps.Circle({
        center: centerPosition,
        radius: QUEST_SEARCH_RADIUS_METERS,
        strokeWeight: 2,
        strokeColor: '#4f6ef7',
        strokeOpacity: 0.8,
        strokeStyle: 'dash',
        fillColor: '#4f6ef7',
        fillOpacity: 0.08,
      });
      searchCircleRef.current.setMap(map);
    }

    visibleQuestList.forEach((quest) => {
      const position = new window.kakao.maps.LatLng(quest.latitude, quest.longitude);

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

    return () => {
      markerRefs.current.forEach((marker) => marker.setMap(null));
      overlayRefs.current.forEach((overlay) => overlay.setMap(null));
      markerRefs.current = [];
      overlayRefs.current = [];
      currentLocationMarkerRef.current?.setMap(null);
      searchCircleRef.current?.setMap(null);
      currentLocationMarkerRef.current = null;
      searchCircleRef.current = null;
    };
  }, [activeQuestId, currentLocation, handleQuestSelect, mapStatus, searchCenter, visibleQuestList]);

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

  return (
    <div className="main-page-shell">
      <div className="main-page">
        <section className="hero-map-section">
          <div className="hero-copy">
            <span className="hero-chip">MISSION BASED O2O PLATFORM</span>
            <h1 className="hero-title">
              <span className="hero-title-line">매일 걷는 그 길이</span>
              <span className="hero-title-line accent">혜택이 되는 순간</span>
            </h1>
            <p className="hero-description">
              오늘 뭐 먹지? 어디 갈까? 고민은 이제 그만.
              내 동선 위 퀘스트를 수행하고, 즉시 쿠폰을 받으며
              나만의 로컬 지도를 완성하세요.
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

          {questLoadError ? <div className="map-quest-empty map-quest-status">{questLoadError}</div> : null}
          {!questLoadError && radiusStatusMessage ? (
            <div className="map-quest-empty map-quest-status">{radiusStatusMessage}</div>
          ) : null}
        </section>

        <section className="hot-quest-section">
          <div className="hot-quest-head">
            <div className="section-heading">
              <span className="section-badge">HOT QUEST</span>
              <h2>리뷰 평점이 높은 추천 퀘스트</h2>
              <p>리뷰 평점 높은 순으로 상위 10개 퀘스트를 모아봤어요.</p>
            </div>

            <div className="hot-quest-nav">
              <button
                type="button"
                className="hot-quest-nav-btn"
                onClick={() => scrollTopRatedQuests(-1)}
                disabled={!canScrollTopQuestPrev}
                aria-label="추천 퀘스트 이전으로 이동"
              >
                &lt;
              </button>
              <button
                type="button"
                className="hot-quest-nav-btn"
                onClick={() => scrollTopRatedQuests(1)}
                disabled={!canScrollTopQuestNext}
                aria-label="추천 퀘스트 다음으로 이동"
              >
                &gt;
              </button>
            </div>
          </div>

          {topRatedLoading ? (
            <div className="panel-loading-state">추천 퀘스트를 불러오는 중입니다.</div>
          ) : null}

          {!topRatedLoading && topRatedError ? (
            <div className="panel-empty-state">{topRatedError}</div>
          ) : null}

          {!topRatedLoading && !topRatedError ? (
            topRatedQuests.length ? (
              <div className="hot-quest-carousel-shell">
                <div className="hot-quest-slider-stage">
                  <button
                    type="button"
                    className="hot-quest-nav-btn hot-quest-nav-btn-side is-prev"
                    onClick={() => scrollTopRatedQuests(-1)}
                    disabled={!canScrollTopQuestPrev}
                    aria-label="추천 퀘스트 이전으로 이동"
                  >
                    &lt;
                  </button>
                  <div
                    ref={topQuestTrackRef}
                    className={`hot-quest-track${isTopQuestDragging ? ' is-dragging' : ''}`}
                    onScroll={updateTopQuestScrollState}
                    onMouseDown={handleTopQuestPointerDown}
                  >
                    {topRatedQuests.map((quest, index) => (
                      <button
                        key={quest.questId}
                        type="button"
                        className="hot-quest-card"
                        onClick={() => handleTopQuestCardClick(quest)}
                      >
                        <div className="hot-quest-card-top">
                          <span className="hot-quest-rank">TOP {index + 1}</span>
                          <span className="hot-quest-score">★ {Number(quest.reviewAverage || 0).toFixed(1)}</span>
                        </div>

                        <div className="hot-quest-card-main">
                          <span className="hot-quest-region">{formatQuestRegion(quest)}</span>
                          <strong>{quest.title}</strong>
                          <p>{quest.description}</p>
                        </div>

                        <div className="hot-quest-card-meta">
                          <span>{quest.category || 'QUEST'}</span>
                          <span>리뷰 {quest.reviewCount}개</span>
                        </div>

                        <div className="hot-quest-card-location">
                          {quest.locationName || formatQuestAddress(quest)}
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="hot-quest-nav-btn hot-quest-nav-btn-side is-next"
                    onClick={() => scrollTopRatedQuests(1)}
                    disabled={!canScrollTopQuestNext}
                    aria-label="추천 퀘스트 다음으로 이동"
                  >
                    &gt;
                  </button>
                </div>

                <div className="hot-quest-range-row">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={topQuestScrollValue}
                    className="hot-quest-range"
                    onChange={handleTopQuestRangeChange}
                    aria-label="추천 퀘스트 좌우 이동"
                    disabled={topRatedQuests.length <= 1}
                  />
                </div>
              </div>
            ) : (
              <div className="panel-empty-state">추천할 퀘스트가 아직 없습니다.</div>
            )
          ) : null}
        </section>

        <section className="partner-banner-section">
          <div className="partner-banner partner-banner-cta">
            <span className="section-badge">BUSINESS PARTNER</span>
            <h2>우리 매장을 퀘스트 명소로 만들고 싶으신가요?</h2>
            <p>
              Local Quest 파트너가 되어 매장에 활기를 더하세요. 실방문객 중심의 마케팅 효과를 직접
              경험해보세요.
            </p>
            <Link to="/inquiry" className="partner-cta-btn">
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
                    <Link className="quest-panel-primary-link" to={`/explore/${selectedQuest.questId}`}>
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

                  {reviewLoading ? <div className="panel-loading-state">리뷰를 불러오는 중입니다.</div> : null}
                  {!reviewLoading && reviewError ? <div className="panel-empty-state">{reviewError}</div> : null}

                  {!reviewLoading && !reviewError ? (
                    <div className="quest-review-list">
                      {questReviews.length ? (
                        questReviews.map((review) => (
                          <article key={review.reviewId} className="quest-review-card">
                            <div className="quest-review-card-head">
                              <div className="quest-review-card-side">
                                <strong>{review.authorName || '로컬 유저'}</strong>
                                <span>{formatReviewDate(review.createdAt)}</span>
                              </div>

                              <div className="quest-review-card-side">
                                <span className="quest-review-rating">{renderStarText(review.rating)}</span>
                              </div>
                            </div>
                            <p>{review.content}</p>
                          </article>
                        ))
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
