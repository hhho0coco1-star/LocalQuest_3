import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { questApi } from '../../../api/QuestApi';
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
    category: quest.category,
    difficulty: getDifficultyText(quest.rewardExp),
    locationSummary:
      locations.length > 0
        ? locations.map((location) => location.name).join(', ')
        : '지정된 장소 정보가 없습니다.',
    duration: formatDuration(quest.timeLimit),
    reward: `${quest.rewardPoint}P`,
    description: quest.description,
    locations,
  };
};

function QuestDetail() {
  const navigate = useNavigate();
  const { questId } = useParams();
  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuestDetail = async () => {
      try {
        setLoading(true);
        const response = await questApi.getQuestDetail(questId);
        setQuest(toQuestDetailModel(response.data));
      } catch (err) {
        setError('퀘스트를 찾을 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestDetail();
  }, [questId]);

  return (
    <div className="quest-detail-page">
      <div className="quest-detail-main">
        <button type="button" className="quest-detail-back" onClick={() => navigate('/explore')}>
          목록으로 돌아가기
        </button>

        {loading ? (
          <section className="quest-detail-empty">
            <h1>퀘스트를 불러오는 중입니다.</h1>
          </section>
        ) : quest ? (
          <section className="quest-detail-card">
            <div className="quest-detail-head">
              <div>
                <span className="quest-detail-category">{quest.category}</span>
                <h1>{quest.title}</h1>
                <p>{quest.description}</p>
              </div>
              <div className="quest-detail-summary">
                <strong>{quest.reward}</strong>
                <span>보상</span>
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
              <h2>방문 순서</h2>
              {quest.locations.length > 0 ? (
                <div className="quest-detail-location-list">
                  {quest.locations.map((location) => (
                    <article
                      key={location.questLocationId || location.locationId}
                      className="quest-detail-location-item"
                    >
                      <div className="quest-detail-location-order">{location.visitOrder}</div>
                      <div className="quest-detail-location-body">
                        <h3>{location.name}</h3>
                        {location.address && <p>{location.address}</p>}
                        {location.addressDetail && <p>{location.addressDetail}</p>}
                        {location.description && (
                          <span className="quest-detail-location-note">{location.description}</span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="quest-detail-empty-copy">아직 연결된 로케이션이 없습니다.</p>
              )}
            </div>
          </section>
        ) : (
          <section className="quest-detail-empty">
            <h1>{error || '퀘스트를 찾을 수 없습니다.'}</h1>
            <p>목록으로 돌아가 다른 퀘스트를 선택해주세요.</p>
          </section>
        )}
      </div>
    </div>
  );
}

export default QuestDetail;
