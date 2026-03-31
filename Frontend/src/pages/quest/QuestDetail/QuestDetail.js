import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { questApi } from '../../../api/QuestApi';
import { hasValidCoordinates, loadKakaoMapSdk } from '../../../utils/kakaoMap';
import './QuestDetail.css';

const getDifficultyText = (rewardExp) => {
  if (rewardExp >= 300) return '어려움';
  if (rewardExp >= 180) return '보통';
  return '쉬움';
};

const formatDuration = (timeLimit) => (timeLimit ? `${timeLimit}분` : '제한 없음');

const toQuestDetailModel = (quest) => {
  const locations = Array.isArray(quest.locations)
    ? [...quest.locations].sort((a, b) => (a.visitOrder || 0) - (b.visitOrder || 0))
    : [];

  return {
    title: quest.title,
    difficulty: getDifficultyText(quest.rewardExp),
    locationSummary:
      locations.length > 0
        ? locations.map((location) => location.name).join(', ')
        : '등록된 장소 정보가 없어요.',
    duration: formatDuration(quest.timeLimit),
    rewardPoint: `${quest.rewardPoint}P`,
    rewardExp: `${quest.rewardExp}EXP`,
    description: quest.description,
    locations,
  };
};

function QuestDetail() {
  const navigate = useNavigate();
  const { questId } = useParams();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const kakaoMapKey = process.env.REACT_APP_KAKAO_MAP_KEY;

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapMarkerRef = useRef(null);

  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAccepted, setIsAccepted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);
  const [mapLoadState, setMapLoadState] = useState('idle');

  useEffect(() => {
    let isCancelled = false;

    const fetchQuestDetail = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await questApi.getQuestDetail(questId);
        if (!isCancelled) {
          setQuest(toQuestDetailModel(response.data));
        }
      } catch (fetchError) {
        if (!isCancelled) {
          setError('퀘스트를 찾을 수 없어요.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchQuestDetail();

    return () => {
      isCancelled = true;
    };
  }, [questId]);

  useEffect(() => {
    let isCancelled = false;

    const fetchAcceptedState = async () => {
      if (!isAuthenticated) {
        setIsAccepted(false);
        return;
      }

      try {
        const response = await questApi.getMyQuestOverview();
        if (isCancelled) {
          return;
        }

        const allQuests = [
          ...(Array.isArray(response.data?.ongoingQuests) ? response.data.ongoingQuests : []),
          ...(Array.isArray(response.data?.completedQuests) ? response.data.completedQuests : []),
        ];

        setIsAccepted(allQuests.some((userQuest) => Number(userQuest.questId) === Number(questId)));
      } catch (overviewError) {
        if (!isCancelled) {
          setIsAccepted(false);
        }
      }
    };

    fetchAcceptedState();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, questId]);

  useEffect(() => {
    let isCancelled = false;

    const renderLocationMap = async () => {
      if (!selectedMapLocation || !mapContainerRef.current) {
        return;
      }

      if (!kakaoMapKey) {
        setMapLoadState('missing-key');
        return;
      }

      try {
        setMapLoadState('loading');
        const kakao = await loadKakaoMapSdk(kakaoMapKey);

        if (isCancelled || !mapContainerRef.current) {
          return;
        }

        const position = new kakao.maps.LatLng(
          Number(selectedMapLocation.latitude),
          Number(selectedMapLocation.longitude)
        );

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new kakao.maps.Map(mapContainerRef.current, {
            center: position,
            level: 3,
          });
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
        if (!isCancelled) {
          setMapLoadState(mapError.message === 'missing-key' ? 'missing-key' : 'error');
        }
      }
    };

    renderLocationMap();

    return () => {
      isCancelled = true;
    };
  }, [kakaoMapKey, selectedMapLocation]);

  const handleAcceptQuest = async () => {
    if (!isAuthenticated) {
      alert('로그인 후 퀘스트를 담을 수 있어요.');
      navigate('/login');
      return;
    }

    if (isAccepted || isAccepting) {
      return;
    }

    try {
      setIsAccepting(true);
      const response = await questApi.acceptQuest(questId);
      const userQuestId = response.data?.userQuestId;
      const alreadyAccepted = Boolean(response.data?.alreadyAccepted);

      setIsAccepted(true);
      alert(alreadyAccepted ? '이미 담은 퀘스트예요.' : '퀘스트를 담았어요.');

      if (userQuestId) {
        navigate(`/mypage/${userQuestId}`);
      }
    } catch (acceptError) {
      const message =
        acceptError.response?.data?.message ||
        '퀘스트를 담지 못했어요. 잠시 후 다시 시도해주세요.';
      alert(message);
    } finally {
      setIsAccepting(false);
    }
  };

  const openMapModal = (location) => {
    if (!hasValidCoordinates(location)) {
      return;
    }

    setSelectedMapLocation(location);
  };

  const closeMapModal = () => {
    setSelectedMapLocation(null);
    setMapLoadState('idle');
    mapMarkerRef.current = null;
    mapInstanceRef.current = null;
  };

  const openKakaoMapWindow = () => {
    if (!selectedMapLocation || !hasValidCoordinates(selectedMapLocation)) {
      return;
    }

    const url = `https://map.kakao.com/link/map/${encodeURIComponent(
      selectedMapLocation.name || '퀘스트 위치'
    )},${selectedMapLocation.latitude},${selectedMapLocation.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="quest-detail-page">
      <div className="quest-detail-main">
        <button type="button" className="quest-detail-back" onClick={() => navigate('/explore')}>
          목록으로 돌아가기
        </button>

        {loading ? (
          <section className="quest-detail-empty">
            <h1>퀘스트를 불러오는 중이에요.</h1>
          </section>
        ) : quest ? (
          <section className="quest-detail-card">
            <div className="quest-detail-head">
              <div>
                <h1>{quest.title}</h1>
                <p>{quest.description}</p>
              </div>
              <div className="quest-detail-summary">
                <span>보상</span>
                <strong>{quest.rewardPoint} · {quest.rewardExp}</strong>
                <button
                  type="button"
                  className="quest-detail-accept-button"
                  onClick={handleAcceptQuest}
                  disabled={isAccepted || isAccepting}
                >
                  {isAccepting ? '수락 중...' : isAccepted ? '수락 완료' : '퀘스트 수락'}
                </button>
              </div>
            </div>

            <div className="quest-detail-meta">
              <article>
                <span>난이도</span>
                <strong>{quest.difficulty}</strong>
              </article>
              <article>
                <span>포함 장소</span>
                <strong>{quest.locationSummary}</strong>
              </article>
              <article>
                <span>제한 시간</span>
                <strong>{quest.duration}</strong>
              </article>
            </div>

            <div className="quest-detail-steps">
              <h2>방문 장소</h2>
              {quest.locations.length > 0 ? (
                <div className="quest-detail-location-list">
                  {quest.locations.map((location) => {
                    const clickable = hasValidCoordinates(location);

                    return (
                      <article
                        key={location.questLocationId || location.locationId}
                        className={`quest-detail-location-item${clickable ? ' is-clickable' : ''}`}
                        onClick={() => openMapModal(location)}
                        onKeyDown={(event) => {
                          if (!clickable) {
                            return;
                          }

                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openMapModal(location);
                          }
                        }}
                        role={clickable ? 'button' : undefined}
                        tabIndex={clickable ? 0 : undefined}
                      >
                        <div className="quest-detail-location-order">{location.visitOrder}</div>
                        <div className="quest-detail-location-body">
                          <h3>{location.name}</h3>
                          {location.address ? <p>{location.address}</p> : null}
                          {location.addressDetail ? <p>{location.addressDetail}</p> : null}
                          {clickable ? (
                            <span className="quest-detail-location-map-hint">눌러서 지도 보기</span>
                          ) : null}
                          {location.description ? (
                            <span className="quest-detail-location-note">{location.description}</span>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="quest-detail-empty-copy">등록된 방문 장소가 없어요.</p>
              )}
            </div>
          </section>
        ) : (
          <section className="quest-detail-empty">
            <h1>{error || '퀘스트를 찾을 수 없어요.'}</h1>
            <p>목록으로 돌아가 다른 퀘스트를 확인해주세요.</p>
          </section>
        )}
      </div>

      {selectedMapLocation ? (
        <div className="quest-location-map-modal-overlay" onClick={closeMapModal}>
          <div className="quest-location-map-modal" onClick={(event) => event.stopPropagation()}>
            <div className="quest-location-map-modal-head">
              <div>
                <span className="quest-location-map-chip">지도 보기</span>
                <h2>{selectedMapLocation.name}</h2>
                <p>
                  {[selectedMapLocation.address, selectedMapLocation.addressDetail]
                    .filter(Boolean)
                    .join(' ')}
                </p>
              </div>
              <button
                type="button"
                className="quest-location-map-close"
                onClick={closeMapModal}
              >
                x
              </button>
            </div>

            <div className="quest-location-map-canvas-wrap">
              <div ref={mapContainerRef} className="quest-location-map-canvas" />
              {mapLoadState === 'loading' ? (
                <div className="quest-location-map-state">지도를 불러오는 중이에요.</div>
              ) : null}
              {mapLoadState === 'missing-key' ? (
                <div className="quest-location-map-state">카카오 지도 키가 설정되지 않았어요.</div>
              ) : null}
              {mapLoadState === 'error' ? (
                <div className="quest-location-map-state">지도를 표시하지 못했어요.</div>
              ) : null}
            </div>

            <div className="quest-location-map-footer">
              <span className="quest-location-map-coords">
                {selectedMapLocation.latitude}, {selectedMapLocation.longitude}
              </span>
              <button
                type="button"
                className="quest-location-map-link-button"
                onClick={openKakaoMapWindow}
              >
                카카오맵에서 보기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default QuestDetail;
