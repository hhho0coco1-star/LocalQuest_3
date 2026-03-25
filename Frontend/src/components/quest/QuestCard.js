import React from 'react';
import { FaRegClock } from 'react-icons/fa';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import './QuestCard.css';

function QuestCard({
  quest,
  onClick,
  onAccept,
  acceptDisabled = false,
  acceptLoading = false,
}) {
  const difficultyClassName = quest.difficultyKey || String(quest.difficulty || '').toLowerCase();
  const difficultyLabel = quest.difficultyLabel || quest.difficulty;

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <article
      className="quest-card"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="quest-card-top">
        <span className={`quest-card-badge quest-card-badge-${difficultyClassName}`}>
          {difficultyLabel}
        </span>
      </div>

      <div className="quest-card-content">
        <h3>{quest.title}</h3>
        <p>{quest.description}</p>
      </div>

      <div className="quest-card-meta">
        <span>
          <HiOutlineLocationMarker />
          {quest.location}
        </span>
        <span>
          <FaRegClock />
          {quest.duration}
        </span>
      </div>

      <div className="quest-card-bottom">
        <div>
          <strong>{quest.reward}</strong>
          <span>보상</span>
        </div>

        <div className="quest-card-actions">
          <button
            type="button"
            className="quest-card-button"
            onClick={(event) => {
              event.stopPropagation();
              onClick();
            }}
          >
            자세히 보기
          </button>
          <button
            type="button"
            className="quest-card-button quest-card-button-accept"
            onClick={(event) => {
              event.stopPropagation();
              onAccept?.();
            }}
            disabled={acceptDisabled || acceptLoading}
          >
            {acceptLoading ? '수락 중...' : acceptDisabled ? '수락 완료' : '퀘스트 수락'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default QuestCard;
