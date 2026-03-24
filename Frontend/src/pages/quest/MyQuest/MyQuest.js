import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questApi } from '../../../api/QuestApi';
import './MyQuest.css';

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const date = String(parsed.getDate()).padStart(2, '0');
  return `${year}.${month}.${date}`;
}

function getQuestStepText(quest) {
  const totalCount = Number(quest.totalLocationCount) || 0;
  const completedCount = Number(quest.completedLocationCount) || 0;

  if (totalCount <= 0) {
    return '연결된 장소 정보가 아직 없습니다.';
  }

  if (quest.questStatus === 'SAVED') {
    return `${totalCount}개 장소 중 아직 시작 전입니다.`;
  }

  return `${totalCount}개 장소 중 ${completedCount}곳 방문 완료`;
}

function getQuestDueText(quest) {
  if (quest.questStatus === 'COMPLETED') {
    return `${formatDate(quest.completedAt)} 완료`;
  }

  if (!quest.startedAt || !quest.timeLimit) {
    return '마감 정보 없음';
  }

  const dueDate = new Date(quest.startedAt);
  dueDate.setMinutes(dueDate.getMinutes() + Number(quest.timeLimit));
  return formatDate(dueDate);
}

function getQuestStatusLabel(status) {
  if (status === 'IN_PROGRESS') {
    return '진행 중';
  }

  if (status === 'SAVED') {
    return '저장됨';
  }

  if (status === 'COMPLETED') {
    return '완료';
  }

  return status || '알 수 없음';
}

function MyQuest() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState({
    ongoingQuests: [],
    completedQuests: [],
    ongoingCount: 0,
    completedCount: 0,
    totalRewardPoint: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const fetchMyQuestOverview = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const response = await questApi.getMyQuestOverview();
        if (!isCancelled) {
          setOverview({
            ongoingQuests: Array.isArray(response.data?.ongoingQuests) ? response.data.ongoingQuests : [],
            completedQuests: Array.isArray(response.data?.completedQuests) ? response.data.completedQuests : [],
            ongoingCount: Number(response.data?.ongoingCount) || 0,
            completedCount: Number(response.data?.completedCount) || 0,
            totalRewardPoint: Number(response.data?.totalRewardPoint) || 0,
          });
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage('내 퀘스트 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchMyQuestOverview();

    return () => {
      isCancelled = true;
    };
  }, []);

  const recommendedQuests = useMemo(() => {
    const totalQuestCount = overview.ongoingCount + overview.completedCount;
    const completedCount = overview.completedCount;
    const totalRewardPoint = overview.totalRewardPoint;

    return [
      `현재 내 퀘스트는 총 ${totalQuestCount}개입니다.`,
      `진행 중인 퀘스트 ${overview.ongoingCount}개, 완료한 퀘스트 ${completedCount}개를 확인할 수 있습니다.`,
      `완료 보상 누적 포인트는 ${totalRewardPoint.toLocaleString()}P입니다.`,
    ];
  }, [overview.completedCount, overview.ongoingCount, overview.totalRewardPoint]);

  if (isLoading) {
    return (
      <div className="my-quest-page">
        <div className="my-quest-main">
          <div className="my-quest-feedback">내 퀘스트 정보를 불러오는 중입니다.</div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="my-quest-page">
        <div className="my-quest-main">
          <div className="my-quest-feedback is-error">{errorMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-quest-page">
      <div className="my-quest-main">
        <section className="my-quest-hero">
          <div className="my-quest-hero-copy">
            <span className="my-quest-eyebrow">MY QUEST</span>
            <h1>내가 진행 중인 퀘스트와 완료 기록을 한 번에 관리해보세요</h1>
            <p>현재 진행 상황과 보상, 완료 이력까지 한 화면에서 확인할 수 있도록 구성했습니다.</p>
          </div>

          <div className="my-quest-stat-grid">
            <article>
              <strong>{overview.ongoingCount}</strong>
              <span>진행 중</span>
            </article>
            <article>
              <strong>{overview.completedCount}</strong>
              <span>완료</span>
            </article>
            <article>
              <strong>{overview.totalRewardPoint.toLocaleString()}P</strong>
              <span>완료 보상</span>
            </article>
          </div>
        </section>

        <section className="my-quest-content">
          <div className="my-quest-section">
            <div className="my-quest-section-heading">
              <h2>진행 중인 퀘스트</h2>
              <p>저장한 퀘스트와 진행 중인 퀘스트의 현재 상태를 확인해보세요.</p>
            </div>

            <div className="my-quest-card-list">
              {overview.ongoingQuests.length ? (
                overview.ongoingQuests.map((quest) => (
                  <article
                    key={quest.userQuestId}
                    className="my-quest-card my-quest-card-clickable"
                    onClick={() => navigate(`/mypage/${quest.userQuestId}`)}
                  >
                    <div className="my-quest-card-top">
                      <h3>{quest.title}</h3>
                      <span className="my-quest-chip">{getQuestStatusLabel(quest.questStatus)}</span>
                    </div>
                    <p>{getQuestStepText(quest)}</p>
                    <div className="my-quest-progress">
                      <div className="my-quest-progress-bar">
                        <span style={{ width: `${quest.progressPercent}%` }} />
                      </div>
                      <strong>{quest.progressPercent}%</strong>
                    </div>
                    <div className="my-quest-card-meta">
                      <span>보상 {quest.rewardPoint}P</span>
                      <span>마감 {getQuestDueText(quest)}</span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="my-quest-empty">아직 진행 중인 퀘스트가 없습니다.</div>
              )}
            </div>
          </div>

          <aside className="my-quest-side-panel">
            <h2>요약</h2>
            <ul>
              {recommendedQuests.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="my-quest-history">
          <div className="my-quest-section-heading">
            <h2>완료한 퀘스트</h2>
            <p>최근 완료한 퀘스트 기록입니다.</p>
          </div>

          <div className="my-quest-history-list">
            {overview.completedQuests.length ? (
              overview.completedQuests.map((quest) => (
                <article
                  key={quest.userQuestId}
                  className="my-quest-history-item my-quest-card-clickable"
                  onClick={() => navigate(`/mypage/${quest.userQuestId}`)}
                >
                  <div>
                    <h3>{quest.title}</h3>
                    <p>{formatDate(quest.completedAt)} 완료</p>
                  </div>
                  <div className="my-quest-history-meta">
                    <span>{quest.completedLocationCount}/{quest.totalLocationCount} 장소 완료</span>
                    <strong>{quest.rewardPoint}P</strong>
                  </div>
                </article>
              ))
            ) : (
              <div className="my-quest-empty">아직 완료한 퀘스트가 없습니다.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default MyQuest;
