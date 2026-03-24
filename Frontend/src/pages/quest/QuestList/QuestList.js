import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuestCard from '../../../components/quest/QuestCard';
import { questApi } from '../../../api/QuestApi';
import './QuestList.css';

const formatDuration = (timeLimit) => (timeLimit ? `${timeLimit}분` : '제한 없음');

const toQuestCardModel = (quest) => ({
  id: quest.questId,
  title: quest.title,
  description: quest.description,
  category: quest.category,
  difficulty: quest.rewardExp >= 300 ? '어려움' : quest.rewardExp >= 180 ? '보통' : '쉬움',
  location: '위치 정보 준비 중',
  duration: formatDuration(quest.timeLimit),
  reward: `${quest.rewardPoint}P`,
  status: quest.status,
});

function QuestList() {
  const navigate = useNavigate();
  const [questList, setQuestList] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('전체');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuestList = async () => {
      try {
        setLoading(true);
        const response = await questApi.getQuestList();
        setQuestList((response.data || []).map(toQuestCardModel));
      } catch (err) {
        setError('퀘스트 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestList();
  }, []);

  const filterOptions = ['전체', ...new Set(questList.map((quest) => quest.category))];
  const filteredQuestList =
    selectedFilter === '전체'
      ? questList
      : questList.filter((quest) => quest.category === selectedFilter);

  return (
    <div className="quest-list-page">
      <div className="quest-list-main">
        <section className="quest-list-hero">
          <div className="quest-list-hero-copy">
            <span className="quest-list-eyebrow">QUEST BOARD</span>
            <h1>지금 참여할 수 있는 로컬 퀘스트를 확인해보세요.</h1>
            <p>백엔드에 등록된 퀘스트 데이터를 기준으로 목록을 보여줍니다.</p>
          </div>

          <div className="quest-list-summary-card">
            <strong>{filteredQuestList.length}</strong>
            <span>진행 가능한 퀘스트</span>
            <p>카테고리별로 필터링하고 상세 페이지까지 바로 확인할 수 있습니다.</p>
          </div>
        </section>

        <section className="quest-list-toolbar">
          <div>
            <h2>{selectedFilter === '전체' ? '전체 퀘스트' : `${selectedFilter} 퀘스트`}</h2>
            <p>카테고리 목록은 백엔드 데이터 기준으로 생성됩니다.</p>
          </div>
          <div className="quest-list-filters">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                type="button"
                className={selectedFilter === filter ? 'active' : ''}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        <section className="quest-list-grid">
          {loading ? (
            <div className="quest-list-empty">
              <h3>퀘스트를 불러오는 중입니다.</h3>
            </div>
          ) : error ? (
            <div className="quest-list-empty">
              <h3>{error}</h3>
            </div>
          ) : filteredQuestList.length > 0 ? (
            filteredQuestList.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onClick={() => navigate(`/explore/${quest.id}`)}
              />
            ))
          ) : (
            <div className="quest-list-empty">
              <h3>선택한 카테고리에 해당하는 퀘스트가 없습니다.</h3>
              <p>다른 필터를 선택해서 다시 확인해보세요.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default QuestList;
