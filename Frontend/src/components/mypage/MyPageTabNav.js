function MyPageTabNav({ tabs, activeTab, onChangeTab }) {
    return (
        <nav className="mypage-tab-nav" aria-label="마이페이지 탭">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    type="button"
                    className={`mypage-tab-button${activeTab === tab.key ? ' is-active' : ''}`}
                    onClick={() => onChangeTab(tab.key)}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    );
}

export default MyPageTabNav;
