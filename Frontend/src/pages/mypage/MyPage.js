import BadgeTab from './components/BadgeTab';
import InquiryTab from './components/InquiryTab';
import MyPageTabNav from './components/MyPageTabNav';
import ProfileTab from './components/ProfileTab';
import WithdrawTab from './components/WithdrawTab';
import { useMyPage } from './hooks/useMyPage';
import { MY_PAGE_TABS } from './utils/myPageUtils';
import './MyPage.css';

function MyPage() {
    const {
        activeTab,
        setActiveTab,
        profile,
        isProfileLoading,
        isSubmitting,
        isWithdrawing,
        formState,
        isPushSupported,
        hasChanged,
        errorMessage,
        feedbackMessage,
        isMyBadgeLoading,
        myBadgeError,
        myBadgeSummary,
        myBadgeHints,
        filteredMyBadgeItems,
        showEarnedBadgeOnly,
        setShowEarnedBadgeOnly,
        myInquiries,
        isMyInquiriesLoading,
        myInquiriesError,
        handleFieldChange,
        handlePasswordFocus,
        handlePasswordBlur,
        handlePushToggle,
        handleCancel,
        handleSubmit,
        handleWithdraw,
    } = useMyPage();

    return (
        <div className="mypage-page">
            <section className="mypage-card">
                <header className="mypage-header">
                    <h1>마이페이지</h1>
                    <p>개인정보를 확인하고 수정할 수 있습니다.</p>
                </header>

                <div className="mypage-layout">
                    <MyPageTabNav
                        tabs={MY_PAGE_TABS}
                        activeTab={activeTab}
                        onChangeTab={setActiveTab}
                    />

                    <div className="mypage-tab-panel">
                        {activeTab === 'profile' ? (
                            <ProfileTab
                                isProfileLoading={isProfileLoading}
                                profile={profile}
                                formState={formState}
                                isPushSupported={isPushSupported}
                                isSubmitting={isSubmitting}
                                hasChanged={hasChanged}
                                errorMessage={errorMessage}
                                feedbackMessage={feedbackMessage}
                                onFieldChange={handleFieldChange}
                                onPasswordFocus={handlePasswordFocus}
                                onPasswordBlur={handlePasswordBlur}
                                onPushToggle={handlePushToggle}
                                onCancel={handleCancel}
                                onSubmit={handleSubmit}
                            />
                        ) : activeTab === 'myBadges' ? (
                            <section className="mypage-badge-panel">
                                <BadgeTab
                                    isMyBadgeLoading={isMyBadgeLoading}
                                    myBadgeError={myBadgeError}
                                    myBadgeSummary={myBadgeSummary}
                                    myBadgeHints={myBadgeHints}
                                    showEarnedBadgeOnly={showEarnedBadgeOnly}
                                    onToggleEarnedOnly={() => setShowEarnedBadgeOnly((prev) => !prev)}
                                    filteredMyBadgeItems={filteredMyBadgeItems}
                                />
                            </section>
                        ) : activeTab === 'inquiryHistory' ? (
                            <InquiryTab
                                isMyInquiriesLoading={isMyInquiriesLoading}
                                myInquiriesError={myInquiriesError}
                                myInquiries={myInquiries}
                            />
                        ) : (
                            <WithdrawTab
                                errorMessage={errorMessage}
                                isWithdrawing={isWithdrawing}
                                onWithdraw={handleWithdraw}
                            />
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default MyPage;
