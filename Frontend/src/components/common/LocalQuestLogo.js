import React from 'react';
import logoIcon from '../../assets/icons/lq-icon.svg';
import './LocalQuestLogo.css';

function LocalQuestLogo({ className = '' }) {
  return (
    <div className={`lq-logo ${className}`.trim()}>
      <img src={logoIcon} alt="LOCAL QUEST" className="lq-logo-icon" />
      <span className="lq-logo-text" aria-label="LOCAL QUEST">LOCAL QUEST</span>
    </div>
  );
}

export default LocalQuestLogo;
