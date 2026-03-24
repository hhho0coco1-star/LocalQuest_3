import React from 'react';
import { FaRegClock } from 'react-icons/fa';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import './QuestCard.css';

function QuestCard({ quest, onClick }) {
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
        <span className={`quest-card-badge quest-card-badge-${quest.difficulty.toLowerCase()}`}>
          {quest.difficulty}
        </span>
        <span className="quest-card-category">{quest.category}</span>
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
      </div>
    </article>
  );
}

export default QuestCard;
