import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import QuestCard from '../../../components/quest/QuestCard';
import { questApi } from '../../../api/QuestApi';
import './QuestList.css';

const formatDuration = (timeLimit) => (timeLimit ? `${timeLimit}분` : '');

const isActiveQuest = (quest) => String(quest?.status || 'ACTIVE').trim().toUpperCase() === 'ACTIVE';

const toQuestCardModel = (quest) => ({
  id: Number(quest.questId),
  title: quest.title,
  description: quest.description,
  difficultyKey: quest.rewardExp >= 300 ? 'hard' : quest.rewardExp >= 180 ? 'normal' : 'easy',
  difficultyLabel: quest.rewardExp >= 300 ? '어려움' : quest.rewardExp >= 180 ? '보통' : '쉬움',
  location: '',
  duration: formatDuration(quest.timeLimit),
  rewardPoint: `${quest.rewardPoint}P`,
  rewardExp: `${quest.rewardExp}EXP`,
  status: quest.status,
});

function QuestList() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [questList, setQuestList] = useState([]);
  const [acceptedQuestIds, setAcceptedQuestIds] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptingQuestId, setAcceptingQuestId] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchQuestList = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await questApi.getQuestList();
        if (!isCancelled) {
          setQuestList((response.data || []).filter(isActiveQuest).map(toQuestCardModel));
        }
      } catch (err) {
        if (!isCancelled) {
          setError('퀘스트를 불러오지 못했어요.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchQuestList();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchAcceptedQuestIds = async () => {
      if (!isAuthenticated) {
        setAcceptedQuestIds([]);
        return;
      }

      try {
        const response = await questApi.getMyQuestOverview();
        if (isCancelled) {
          return;
        }

        const ongoingQuests = Array.isArray(response.data?.ongoingQuests) ? response.data.ongoingQuests : [];
        const completedQuests = Array.isArray(response.data?.completedQuests) ? response.data.completedQuests : [];
        const nextQuestIds = [...ongoingQuests, ...completedQuests]
          .map((quest) => Number(quest.questId))
          .filter((questId) => Number.isFinite(questId));

        setAcceptedQuestIds(Array.from(new Set(nextQuestIds)));
      } catch (err) {
        if (!isCancelled) {
          setAcceptedQuestIds([]);
        }
      }
    };

    fetchAcceptedQuestIds();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  const handleAcceptQuest = async (questId) => {
    if (!isAuthenticated) {
      alert('로그인 후 퀘스트에 참여할 수 있어요.');
      navigate('/login');
      return;
    }

    if (acceptingQuestId === questId || acceptedQuestIds.includes(questId)) {
      return;
    }

    try {
      setAcceptingQuestId(questId);
      const response = await questApi.acceptQuest(questId);
      const userQuestId = response.data?.userQuestId;
      const alreadyAccepted = Boolean(response.data?.alreadyAccepted);

      setAcceptedQuestIds((prev) => (prev.includes(questId) ? prev : [...prev, questId]));
      setQuestList((prev) => prev.filter((quest) => Number(quest.id) !== Number(questId)));
      alert(alreadyAccepted ? '이미 담은 퀘스트예요.' : '퀘스트를 담았어요.');

      if (userQuestId) {
        navigate(`/mypage/${userQuestId}`);
      }
    } catch (err) {
      const message = err.response?.data?.message ?? '퀘스트를 담지 못했어요. 잠시 후 다시 시도해주세요.';
      alert(message);
    } finally {
      setAcceptingQuestId(null);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setSearchKeyword(searchInput.trim());
  };

  const handleSearchReset = () => {
    setSearchInput('');
    setSearchKeyword('');
  };

  const visibleQuestList = isAuthenticated
    ? questList.filter((quest) => !acceptedQuestIds.includes(Number(quest.id)))
    : questList;

  const searchedQuestList = useMemo(() => {
    if (!searchKeyword) {
      return visibleQuestList;
    }

    const normalizedKeyword = searchKeyword.toLowerCase();
    return visibleQuestList.filter((quest) => {
      const title = (quest.title || '').toLowerCase();
      const description = (quest.description || '').toLowerCase();

      return title.includes(normalizedKeyword) || description.includes(normalizedKeyword);
    });
  }, [searchKeyword, visibleQuestList]);

  return (
    <div className="quest-list-page">
      <div className="quest-list-main">
        <section className="quest-list-toolbar">
          <div className="quest-list-toolbar-copy">
            <h2>퀘스트 둘러보기</h2>
            <p>{searchKeyword ? `"${searchKeyword}" 검색 결과` : ''}</p>
          </div>
          <div className="quest-list-toolbar-actions">
            <form className="quest-list-search" onSubmit={handleSearchSubmit}>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="퀘스트 검색"
                aria-label="퀘스트 검색"
              />
              <button type="submit">검색</button>
              <button type="button" className="ghost" onClick={handleSearchReset}>
                초기화
              </button>
            </form>
          </div>
        </section>

        <section className="quest-list-grid">
          {loading ? (
            <div className="quest-list-empty">
              <h3>퀘스트를 불러오는 중이에요.</h3>
            </div>
          ) : error ? (
            <div className="quest-list-empty">
              <h3>{error}</h3>
            </div>
          ) : searchedQuestList.length > 0 ? (
            searchedQuestList.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onClick={() => navigate(`/explore/${quest.id}`)}
                onAccept={() => handleAcceptQuest(quest.id)}
                acceptDisabled={acceptedQuestIds.includes(quest.id)}
                acceptLoading={acceptingQuestId === quest.id}
              />
            ))
          ) : (
            <div className="quest-list-empty">
              <h3>표시할 퀘스트가 없어요.</h3>
              <p>검색어를 바꿔 다시 확인해주세요.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default QuestList;
