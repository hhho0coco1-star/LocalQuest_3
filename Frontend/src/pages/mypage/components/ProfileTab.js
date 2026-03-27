import Button from '../../../components/common/Button';

function ProfileTab({
    isProfileLoading,
    profile,
    formState,
    isPushSupported,
    isSubmitting,
    hasChanged,
    errorMessage,
    feedbackMessage,
    onFieldChange,
    onPasswordFocus,
    onPasswordBlur,
    onPushToggle,
    onCancel,
    onSubmit,
}) {
    if (isProfileLoading) {
        return <div className="mypage-loading">회원 정보를 불러오는 중입니다.</div>;
    }

    return (
        <form className="mypage-form" onSubmit={onSubmit}>
            <div className="mypage-field-grid">
                <label className="mypage-field-row">
                    <span>이름</span>
                    <input type="text" value={profile.name} readOnly />
                </label>

                <label className="mypage-field-row">
                    <span>이메일</span>
                    <input type="text" value={profile.email} readOnly />
                </label>

                <label className="mypage-field-row">
                    <span>비밀번호</span>
                    <input
                        type="password"
                        name="password"
                        value={formState.password}
                        onChange={onFieldChange}
                        onFocus={onPasswordFocus}
                        onBlur={onPasswordBlur}
                        autoComplete="new-password"
                    />
                </label>

                <label className="mypage-field-row">
                    <span>닉네임</span>
                    <input
                        type="text"
                        name="nickname"
                        value={formState.nickname}
                        onChange={onFieldChange}
                    />
                </label>

                <label className="mypage-field-row">
                    <span>생일</span>
                    <input type="text" value={profile.birthdayLabel} readOnly />
                </label>

                <label className="mypage-field-row">
                    <span>성별</span>
                    <input type="text" value={profile.genderLabel} readOnly />
                </label>

                <label className="mypage-field-row mypage-field-row-full">
                    <span>가입일</span>
                    <input type="text" value={profile.createdAtLabel} readOnly />
                </label>

                <div className="mypage-field-row mypage-field-row-full">
                    <span>푸시 알림</span>
                    <button
                        type="button"
                        className={`mypage-push-toggle${formState.pushEnabled ? ' is-on' : ''}`}
                        onClick={onPushToggle}
                        aria-pressed={formState.pushEnabled}
                        disabled={isSubmitting || !isPushSupported}
                    >
                        <span className="mypage-push-toggle-thumb" />
                        <span className="mypage-push-toggle-text">
                            {formState.pushEnabled ? 'ON' : 'OFF'}
                        </span>
                    </button>
                </div>
            </div>

            {errorMessage ? <p className="mypage-feedback-message is-error">{errorMessage}</p> : null}
            {feedbackMessage ? <p className="mypage-feedback-message">{feedbackMessage}</p> : null}

            <div className="mypage-action-row">
                <Button
                    text="취소"
                    type="button"
                    variant="outline"
                    className="mypage-action-button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                />
                <Button
                    text={isSubmitting ? '수정 중..' : '수정'}
                    type="submit"
                    variant="primary"
                    className="mypage-action-button"
                    disabled={isSubmitting || !hasChanged}
                />
            </div>
        </form>
    );
}

export default ProfileTab;
