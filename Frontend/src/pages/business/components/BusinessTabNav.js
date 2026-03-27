import React from 'react';

function BusinessTabNav({ tabs, activeTab, onChangeTab }) {
  return (
    <nav className="business-tabs" role="tablist" aria-label="비즈니스 메뉴">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.key}
          className={`business-tab ${activeTab === tab.key ? 'is-active' : ''}`}
          onClick={() => onChangeTab(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default BusinessTabNav;
