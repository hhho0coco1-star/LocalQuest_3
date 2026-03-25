import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { questApi } from '../../../api/QuestApi';
import './MyQuest.css';

const STAR_OPTIONS = [1, 2, 3, 4, 5];

function formatDateTime(value) {
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
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${date} ${hours}:${minutes}`;
}

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
    return `${totalCount}개 장소를 아직 시작하지 않았습니다.`;
  }

  return `${totalCount}개 장소 중 ${completedCount}곳 방문 완료`;
}

function getQuestDueText(quest) {
  if (quest.questStatus === 'COMPLETED') {
    return `${formatDateTime(quest.completedAt)} 완료`;
  }

  if (!quest.dueAt) {
    return '';
  }

  const dueDate = new Date(quest.dueAt);
  if (Number.isNaN(dueDate.getTime())) {
    return '';
  }

  const diffMs = dueDate.getTime() - Date.now();
  if (diffMs <= 0) {
    return '마감됨';
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  if (days >= 1) {
    return `${days}일 남음`;
  }

  const hours = totalHours;
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${Math.max(1, minutes)}분 남음`;
  }

  return `${hours}시간 ${minutes}분 남음`;
}

function getQuestStatusLabel(status) {
  if (status === 'IN_PROGRESS') {
    return '진행 중';
  }

  if (status === 'SAVED') {
    return '수락됨';
  }

  if (status === 'COMPLETED') {
    return '완료';
  }

  if (status === 'ABANDONED') {
    return '포기';
  }

  return status || '상태 정보 없음';
}

function MyQuest() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [overview, setOverview] = useState({
    ongoingQuests: [],
    completedQuests: [],
    ongoingCount: 0,
    completedCount: 0,
    totalRewardPoint: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [completingUserQuestId, setCompletingUserQuestId] = useState(null);
  const [cancelingUserQuestId, setCancelingUserQuestId] = useState(null);
  const [reviewingQuest, setReviewingQuest] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
  const [reviewError, setReviewError] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [myReviewsByQuestId, setMyReviewsByQuestId] = useState({});

  const applyOverview = (response) => {
    setOverview({
      ongoingQuests: Array.isArray(response.data?.ongoingQuests) ? response.data.ongoingQuests : [],
      completedQuests: Array.isArray(response.data?.completedQuests)
        ? response.data.completedQuests
        : [],
      ongoingCount: Number(response.data?.ongoingCount) || 0,
      completedCount: Number(response.data?.completedCount) || 0,
      totalRewardPoint: Number(response.data?.totalRewardPoint) || 0,
    });
  };

  const fetchMyQuestOverview = async () => {
    const response = await questApi.getMyQuestOverview();
    applyOverview(response);
  };

  const refreshMyReviewMap = async (completedQuests) => {
    if (!user?.userId || !completedQuests.length) {
      setMyReviewsByQuestId({});
      return;
    }

    const responses = await Promise.all(
      completedQuests.map((quest) => questApi.getQuestReviews(quest.questId))
    );

    const nextMyReviews = {};

    completedQuests.forEach((quest, index) => {
      const reviews = Array.isArray(responses[index].data) ? responses[index].data : [];
      const myReview = reviews.find((review) => Number(review.userId) === Number(user.userId));

      if (myReview) {
        nextMyReviews[quest.questId] = myReview;
      }
    });

    setMyReviewsByQuestId(nextMyReviews);
  };

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        const response = await questApi.getMyQuestOverview();
        if (isCancelled) {
          return;
        }

        applyOverview(response);
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

    load();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadMyReviewState = async () => {
      try {
        const completedQuests = overview.completedQuests;
        if (!user?.userId || !completedQuests.length) {
          if (!isCancelled) {
            setMyReviewsByQuestId({});
          }
          return;
        }

        const responses = await Promise.all(
          completedQuests.map((quest) => questApi.getQuestReviews(quest.questId))
        );

        if (isCancelled) {
          return;
        }

        const nextMyReviews = {};

        completedQuests.forEach((quest, index) => {
          const reviews = Array.isArray(responses[index].data) ? responses[index].data : [];
          const myReview = reviews.find((review) => Number(review.userId) === Number(user.userId));

          if (myReview) {
            nextMyReviews[quest.questId] = myReview;
          }
        });

        setMyReviewsByQuestId(nextMyReviews);
      } catch (error) {
        if (!isCancelled) {
          setMyReviewsByQuestId({});
        }
      }
    };

    loadMyReviewState();

    return () => {
      isCancelled = true;
    };
  }, [overview.completedQuests, user?.userId]);

  const handleCompleteQuest = async (event, quest) => {
    event.stopPropagation();

    if (completingUserQuestId === quest.userQuestId) {
      return;
    }

    try {
      setCompletingUserQuestId(quest.userQuestId);
      await questApi.completeMyQuest(quest.userQuestId);
      await fetchMyQuestOverview();
      alert('퀘스트를 완료했습니다.');
    } catch (error) {
      const message = error.response?.data?.message ?? '퀘스트 완료 처리에 실패했습니다.';
      alert(message);
    } finally {
      setCompletingUserQuestId(null);
    }
  };

  const handleCancelQuest = async (event, quest) => {
    event.stopPropagation();

    if (cancelingUserQuestId === quest.userQuestId) {
      return;
    }

    const confirmed = window.confirm('이 퀘스트를 취소하시겠습니까? 진행 기록은 유지됩니다.');
    if (!confirmed) {
      return;
    }

    try {
      setCancelingUserQuestId(quest.userQuestId);
      await questApi.cancelMyQuest(quest.userQuestId);
      await fetchMyQuestOverview();
      alert('퀘스트를 취소했습니다.');
    } catch (error) {
      const message = error.response?.data?.message ?? '퀘스트 취소 처리에 실패했습니다.';
      alert(message);
    } finally {
      setCancelingUserQuestId(null);
    }
  };

  const openReviewModal = (event, quest) => {
    event.stopPropagation();

    const existingReview = myReviewsByQuestId[quest.questId];
    setReviewingQuest(quest);
    setReviewForm({
      rating: Number(existingReview?.rating) || 5,
      content: existingReview?.content || '',
    });
    setReviewError('');
  };

  const closeReviewModal = () => {
    if (isSubmittingReview) {
      return;
    }

    setReviewingQuest(null);
    setReviewForm({ rating: 5, content: '' });
    setReviewError('');
  };

  const handleReviewChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!reviewingQuest?.questId || !user?.userId || isSubmittingReview) {
      return;
    }

    const trimmedContent = reviewForm.content.trim();
    if (!trimmedContent) {
      setReviewError('리뷰 내용을 입력해주세요.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      setReviewError('');

      const existingReview = myReviewsByQuestId[reviewingQuest.questId];
      const payload = {
        userId: user.userId,
        rating: Number(reviewForm.rating),
        content: trimmedContent,
      };

      if (existingReview?.reviewId) {
        await questApi.updateQuestReview(reviewingQuest.questId, existingReview.reviewId, payload);
      } else {
        await questApi.createQuestReview(reviewingQuest.questId, payload);
      }

      await refreshMyReviewMap(overview.completedQuests);
      setReviewingQuest(null);
      setReviewForm({ rating: 5, content: '' });
      alert(existingReview?.reviewId ? '리뷰가 수정되었습니다.' : '리뷰가 등록되었습니다.');
    } catch (error) {
      setReviewError(error.response?.data?.message || '리뷰 처리 중 문제가 발생했습니다.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReviewDelete = async () => {
    if (!reviewingQuest?.questId || !user?.userId || isSubmittingReview) {
      return;
    }

    const existingReview = myReviewsByQuestId[reviewingQuest.questId];
    if (!existingReview?.reviewId) {
      return;
    }

    const confirmed = window.confirm('작성한 리뷰를 삭제하시겠습니까?');
    if (!confirmed) {
      return;
    }

    try {
      setIsSubmittingReview(true);
      setReviewError('');
      await questApi.deleteQuestReview(reviewingQuest.questId, existingReview.reviewId, user.userId);
      await refreshMyReviewMap(overview.completedQuests);
      setReviewingQuest(null);
      setReviewForm({ rating: 5, content: '' });
      alert('리뷰가 삭제되었습니다.');
    } catch (error) {
      setReviewError(error.response?.data?.message || '리뷰 삭제 중 문제가 발생했습니다.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const recommendedQuests = useMemo(() => {
    const totalQuestCount = overview.ongoingCount + overview.completedCount;

    return [
      `현재 내 퀘스트는 총 ${totalQuestCount}개입니다.`,
      `진행 중인 퀘스트 ${overview.ongoingCount}개, 완료한 퀘스트 ${overview.completedCount}개를 확인할 수 있습니다.`,
      `완료 보상 누적 포인트는 ${overview.totalRewardPoint.toLocaleString()}P입니다.`,
    ];
  }, [overview.completedCount, overview.ongoingCount, overview.totalRewardPoint]);

  const hasMyReview = (questId) => Boolean(myReviewsByQuestId[questId]);

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
            <h1>내가 진행 중인 퀘스트와 완료 기록을 한 번에 관리해보세요.</h1>
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
              <p>수락한 퀘스트의 현재 진행 상태를 확인해보세요.</p>
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
                      {getQuestDueText(quest) ? <span>{getQuestDueText(quest)}</span> : null}
                    </div>
                    {quest.questStatus !== 'COMPLETED' ? (
                      <div className="my-quest-card-actions">
                        <button
                          type="button"
                          className="my-quest-cancel-button"
                          onClick={(event) => handleCancelQuest(event, quest)}
                          disabled={cancelingUserQuestId === quest.userQuestId}
                        >
                          {cancelingUserQuestId === quest.userQuestId
                            ? '취소 처리 중...'
                            : '퀘스트 취소하기'}
                        </button>
                        {Number(quest.totalLocationCount) > 0 &&
                        Number(quest.completedLocationCount) >= Number(quest.totalLocationCount) ? (
                          <button
                            type="button"
                            className="my-quest-complete-button"
                            onClick={(event) => handleCompleteQuest(event, quest)}
                            disabled={completingUserQuestId === quest.userQuestId}
                          >
                            {completingUserQuestId === quest.userQuestId
                              ? '완료 처리 중...'
                              : '퀘스트 완료하기'}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
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
                    <span>
                      {quest.completedLocationCount}/{quest.totalLocationCount} 장소 완료
                    </span>
                    <strong>{quest.rewardPoint}P</strong>
                  </div>
                  <div className="my-quest-history-actions">
                    <button
                      type="button"
                      className="my-quest-review-button"
                      onClick={(event) => openReviewModal(event, quest)}
                    >
                      {hasMyReview(quest.questId) ? '리뷰 수정' : '리뷰 쓰기'}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="my-quest-empty">아직 완료한 퀘스트가 없습니다.</div>
            )}
          </div>
        </section>
      </div>

      {reviewingQuest ? (
        <div className="my-quest-review-modal-overlay" onClick={closeReviewModal}>
          <div className="my-quest-review-modal" onClick={(event) => event.stopPropagation()}>
            <div className="my-quest-review-modal-head">
              <div>
                <span className="my-quest-review-chip">
                  {hasMyReview(reviewingQuest.questId) ? '리뷰 수정' : '리뷰 쓰기'}
                </span>
                <h2>{reviewingQuest.title}</h2>
              </div>
              <button type="button" className="my-quest-review-close" onClick={closeReviewModal}>
                x
              </button>
            </div>

            <form className="my-quest-review-form" onSubmit={handleReviewSubmit}>
              <div className="my-quest-review-rating-row">
                <span>별점</span>
                <div className="my-quest-review-stars" aria-label="별점 선택">
                  {STAR_OPTIONS.map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`my-quest-review-star-button${
                        star <= reviewForm.rating ? ' is-active' : ''
                      }`}
                      onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                    >
                      {star <= reviewForm.rating ? '★' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className="my-quest-review-textarea"
                name="content"
                value={reviewForm.content}
                onChange={handleReviewChange}
                placeholder="완료한 퀘스트 경험을 남겨주세요."
              />

              {reviewError ? <p className="my-quest-review-message is-error">{reviewError}</p> : null}

              <div className="my-quest-review-actions">
                {hasMyReview(reviewingQuest.questId) ? (
                  <button
                    type="button"
                    className="my-quest-review-delete"
                    onClick={handleReviewDelete}
                    disabled={isSubmittingReview}
                  >
                    삭제
                  </button>
                ) : null}
                <button
                  type="button"
                  className="my-quest-review-cancel"
                  onClick={closeReviewModal}
                  disabled={isSubmittingReview}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="my-quest-review-submit"
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview
                    ? '처리 중...'
                    : hasMyReview(reviewingQuest.questId)
                      ? '리뷰 수정'
                      : '리뷰 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MyQuest;
