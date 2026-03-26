import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { inquiryApi } from '../../api/InquiryApi';
import { pushApi } from '../../api/PushApi';
import { userApi } from '../../api/UserApi';
import { clearAuth, updateUserProfile } from '../../store/authSlice';
import './MyPage.css';

const PASSWORD_MASK = '********';

const MY_PAGE_TABS = [
    { key: 'profile', label: '개인정보 수정' },
    { key: 'exploreStats', label: '탐험 통계' },
    { key: 'inquiryHistory', label: '1:1 문의내역' },
    { key: 'withdraw', label: '회원 탈퇴' },
];

const TAB_PLACEHOLDER_CONTENT = {
    exploreStats: {
        title: '탐험 통계',
        description: '탐험 통계 기능은 준비 중입니다.',
    },
    inquiryHistory: {
        title: '1:1 문의내역',
        description: '1:1 문의내역 기능은 준비 중입니다.',
    },
};

function formatDateValue(value) {
    if (!value) {
        return '-';
    }

    const parsed = toDate(value);
    if (Number.isNaN(parsed.getTime())) {
        return String(value);
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatReviewCreatedAt(value) {
    if (!value) {
        return '-';
    }

    const parsed = toDate(value);
    if (Number.isNaN(parsed.getTime())) {
        return String(value);
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    const hour = String(parsed.getHours()).padStart(2, '0');
    const minute = String(parsed.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
}

function toDate(value) {
    if (value instanceof Date) {
        return value;
    }

    if (Array.isArray(value) && value.length >= 3) {
        const year = Number(value[0]);
        const month = Number(value[1]);
        const day = Number(value[2]);
        const hour = Number(value[3] ?? 0);
        const minute = Number(value[4] ?? 0);
        const second = Number(value[5] ?? 0);

        if (
            Number.isFinite(year) &&
            Number.isFinite(month) &&
            Number.isFinite(day) &&
            Number.isFinite(hour) &&
            Number.isFinite(minute) &&
            Number.isFinite(second)
        ) {
            return new Date(year, month - 1, day, hour, minute, second);
        }
    }

    if (typeof value === 'string' && /^\d{4},\d{1,2},\d{1,2}(,\d{1,2}){0,3}$/.test(value.trim())) {
        const parts = value.split(',').map((part) => Number(part.trim()));
        return toDate(parts);
    }

    if (typeof value === 'object' && value !== null) {
        const year = Number(value.year);
        const month = Number(value.monthValue ?? value.month);
        const day = Number(value.dayOfMonth ?? value.day);
        const hour = Number(value.hour ?? 0);
        const minute = Number(value.minute ?? 0);
        const second = Number(value.second ?? 0);

        if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
            return new Date(year, month - 1, day, hour, minute, second);
        }
    }

    return new Date(value);
}

function resolveInquiryStatusLabel(statusValue) {
    const normalized = String(statusValue ?? '').trim().toUpperCase();
    if (normalized === 'ANSWERED') {
        return '답변 완료';
    }
    return '답변 대기';
}
function resolveGenderLabel(genderValue) {
    if (!genderValue) {
        return '-';
    }

    const normalized = String(genderValue).trim().toUpperCase();
    if (['M', 'MALE', '남', '남성'].includes(normalized)) {
        return '남성';
    }
    if (['F', 'FEMALE', '여', '여성'].includes(normalized)) {
        return '여성';
    }
    return String(genderValue);
}

function parseYnToBoolean(value) {
    if (typeof value === 'boolean') {
        return value;
    }

    const normalized = String(value ?? '').trim().toUpperCase();
    return normalized === 'Y' || normalized === 'TRUE' || normalized === '1';
}

function normalizeProfile(source, fallbackUser = null) {
    const data = source ?? {};
    const user = fallbackUser ?? {};

    const userId = Number(data.userId ?? user.userId ?? 0) || 0;
    const userLoginId = data.userLoginId ?? user.userLoginId ?? '';
    const name = data.name ?? user.name ?? '-';
    const email = data.email ?? user.email ?? '-';
    const nickname = data.nickname ?? user.nickname ?? '';
    const birth = data.birth ?? user.birth ?? user.birthday ?? user.birthDate ?? null;
    const gender = data.gender ?? user.gender ?? null;
    const createdAt = data.createdAt ?? data.created_at ?? user.createdAt ?? user.created_at ?? null;
    const role = data.role ?? user.role ?? '';
    const status = data.status ?? user.status ?? '';

    return {
        userId,
        userLoginId,
        name,
        email,
        nickname,
        birth,
        gender,
        createdAt,
        role,
        status,
        birthdayLabel: formatDateValue(birth),
        genderLabel: resolveGenderLabel(gender),
        createdAtLabel: formatDateValue(createdAt),
    };
}

function MyPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);

    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState(() => normalizeProfile(null, user));
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [initialPushEnabled, setInitialPushEnabled] = useState(false);
    const [formState, setFormState] = useState({
        password: PASSWORD_MASK,
        nickname: normalizeProfile(null, user).nickname,
        pushEnabled: false,
    });
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [myInquiries, setMyInquiries] = useState([]);
    const [isMyInquiriesLoading, setIsMyInquiriesLoading] = useState(false);
    const [myInquiriesError, setMyInquiriesError] = useState('');

    useEffect(() => {
        let isCancelled = false;

        const fetchProfile = async () => {
            setIsProfileLoading(true);
            setErrorMessage('');
            setFeedbackMessage('');

            try {
                const [profileResponse, pushSettingResponse] = await Promise.all([
                    userApi.getMyProfile(),
                    pushApi.getSettings().catch(() => null),
                ]);

                if (isCancelled) {
                    return;
                }

                const normalized = normalizeProfile(profileResponse.data);
                const pushEnabled = parseYnToBoolean(pushSettingResponse?.data?.pushAgree);

                setProfile(normalized);
                setInitialPushEnabled(pushEnabled);
                setFormState({
                    password: PASSWORD_MASK,
                    nickname: normalized.nickname,
                    pushEnabled,
                });

                dispatch(
                    updateUserProfile({
                        userId: normalized.userId,
                        userLoginId: normalized.userLoginId,
                        name: normalized.name,
                        email: normalized.email,
                        nickname: normalized.nickname,
                        birth: normalized.birth,
                        gender: normalized.gender,
                        createdAt: normalized.createdAt,
                        role: normalized.role,
                        status: normalized.status,
                    })
                );
            } catch (error) {
                if (isCancelled) {
                    return;
                }

                const message =
                    error.response?.data?.message ??
                    '회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
                setErrorMessage(message);
            } finally {
                if (!isCancelled) {
                    setIsProfileLoading(false);
                }
            }
        };

        fetchProfile();

        return () => {
            isCancelled = true;
        };
    }, [dispatch, user?.userId]);

    useEffect(() => {
        setFormState({
            password: PASSWORD_MASK,
            nickname: profile.nickname,
            pushEnabled: initialPushEnabled,
        });
    }, [profile.nickname, initialPushEnabled]);

    useEffect(() => {
        let isCancelled = false;

        const fetchMyInquiries = async () => {
            if (activeTab !== 'inquiryHistory') {
                return;
            }

            setIsMyInquiriesLoading(true);
            setMyInquiriesError('');

            try {
                const response = await inquiryApi.getMyInquiries();
                if (isCancelled) {
                    return;
                }
                setMyInquiries(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                if (isCancelled) {
                    return;
                }

                const message =
                    error.response?.data?.message ??
                    '문의내역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
                setMyInquiriesError(message);
                setMyInquiries([]);
            } finally {
                if (!isCancelled) {
                    setIsMyInquiriesLoading(false);
                }
            }
        };

        fetchMyInquiries();

        return () => {
            isCancelled = true;
        };
    }, [activeTab]);

    const hasChanged = useMemo(() => {
        const trimmedNickname = formState.nickname.trim();
        const hasNicknameChange = trimmedNickname !== profile.nickname;
        const hasPasswordChange =
            formState.password.trim() !== '' && formState.password !== PASSWORD_MASK;
        const hasPushChange = formState.pushEnabled !== initialPushEnabled;
        return hasNicknameChange || hasPasswordChange || hasPushChange;
    }, [formState.nickname, formState.password, formState.pushEnabled, profile.nickname, initialPushEnabled]);

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setFormState((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePasswordFocus = () => {
        setFormState((prev) =>
            prev.password === PASSWORD_MASK
                ? {
                    ...prev,
                    password: '',
                }
                : prev
        );
    };

    const handlePasswordBlur = () => {
        setFormState((prev) =>
            prev.password.trim()
                ? prev
                : {
                    ...prev,
                    password: PASSWORD_MASK,
                }
        );
    };

    const handlePushToggle = () => {
        setFormState((prev) => ({
            ...prev,
            pushEnabled: !prev.pushEnabled,
        }));
    };

    const handleCancel = () => {
        setFormState({
            password: PASSWORD_MASK,
            nickname: profile.nickname,
            pushEnabled: initialPushEnabled,
        });
        setErrorMessage('');
        setFeedbackMessage('입력한 변경사항을 취소했습니다.');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting) {
            return;
        }

        setErrorMessage('');
        setFeedbackMessage('');

        const trimmedNickname = formState.nickname.trim();
        if (!trimmedNickname) {
            setErrorMessage('닉네임은 비워둘 수 없습니다.');
            return;
        }

        const nextPassword =
            formState.password === PASSWORD_MASK ? '' : formState.password.trim();

        const hasNicknameChange = trimmedNickname !== profile.nickname;
        const hasPasswordChange = nextPassword !== '';
        const hasPushChange = formState.pushEnabled !== initialPushEnabled;

        if (!hasNicknameChange && !hasPasswordChange && !hasPushChange) {
            setFeedbackMessage('변경한 항목이 없습니다.');
            return;
        }

        try {
            setIsSubmitting(true);

            let updatedProfile = profile;

            if (hasNicknameChange || hasPasswordChange) {
                const response = await userApi.updateMyProfile({
                    nickname: trimmedNickname,
                    password: nextPassword,
                });

                updatedProfile = normalizeProfile(response.data, user);
                setProfile(updatedProfile);

                dispatch(
                    updateUserProfile({
                        userId: updatedProfile.userId,
                        userLoginId: updatedProfile.userLoginId,
                        name: updatedProfile.name,
                        email: updatedProfile.email,
                        nickname: updatedProfile.nickname,
                        birth: updatedProfile.birth,
                        gender: updatedProfile.gender,
                        createdAt: updatedProfile.createdAt,
                        role: updatedProfile.role,
                        status: updatedProfile.status,
                    })
                );
            }

            if (hasPushChange) {
                const nextPushEnabled = formState.pushEnabled;
                await pushApi.saveSettings({
                    pushAgree: nextPushEnabled,
                    marketingAgree: nextPushEnabled,
                    lunchPushAgree: nextPushEnabled,
                    dinnerPushAgree: nextPushEnabled,
                    weekendPushAgree: nextPushEnabled,
                });
                setInitialPushEnabled(nextPushEnabled);
            }

            setFormState({
                password: PASSWORD_MASK,
                nickname: updatedProfile.nickname,
                pushEnabled: formState.pushEnabled,
            });

            setFeedbackMessage('회원 정보가 수정되었습니다.');
        } catch (error) {
            const message =
                error.response?.data?.message ??
                '회원 정보 수정에 실패했습니다. 잠시 후 다시 시도해주세요.';
            setErrorMessage(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWithdraw = async () => {
        if (isWithdrawing) {
            return;
        }

        const shouldWithdraw = window.confirm(
            '회원 탈퇴 시 계정 정보와 활동 내역은 삭제되며 복구할 수 없습니다. 계속할까요?'
        );
        if (!shouldWithdraw) {
            return;
        }

        setErrorMessage('');
        setFeedbackMessage('');

        try {
            setIsWithdrawing(true);
            await userApi.withdrawMe();
            dispatch(clearAuth());
            navigate('/main', { replace: true });
        } catch (error) {
            const message =
                error.response?.data?.message ??
                '회원 탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요.';
            setErrorMessage(message);
        } finally {
            setIsWithdrawing(false);
        }
    };

    return (
        <div className="mypage-page">
            <section className="mypage-card">
                <header className="mypage-header">
                    <h1>마이페이지</h1>
                    <p>개인정보를 확인하고 수정할 수 있습니다.</p>
                </header>

                <div className="mypage-layout">
                    <nav className="mypage-tab-nav" aria-label="마이페이지 탭">
                        {MY_PAGE_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                className={`mypage-tab-button${activeTab === tab.key ? ' is-active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="mypage-tab-panel">
                        {activeTab === 'profile' ? (
                            isProfileLoading ? (
                                <div className="mypage-loading">회원 정보를 불러오는 중입니다.</div>
                            ) : (
                                <form className="mypage-form" onSubmit={handleSubmit}>
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
                                                onChange={handleFieldChange}
                                                onFocus={handlePasswordFocus}
                                                onBlur={handlePasswordBlur}
                                                autoComplete="new-password"
                                            />
                                        </label>

                                        <label className="mypage-field-row">
                                            <span>닉네임</span>
                                            <input
                                                type="text"
                                                name="nickname"
                                                value={formState.nickname}
                                                onChange={handleFieldChange}
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
                                                onClick={handlePushToggle}
                                                aria-pressed={formState.pushEnabled}
                                                disabled={isSubmitting}
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
                                            onClick={handleCancel}
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
                            )
                        ) : activeTab === 'inquiryHistory' ? (
                            <section className="mypage-inquiry-panel">
                                <h2>1:1 문의내역</h2>
                                {isMyInquiriesLoading ? (
                                    <div className="mypage-loading">문의내역을 불러오는 중입니다.</div>
                                ) : myInquiriesError ? (
                                    <p className="mypage-feedback-message is-error">{myInquiriesError}</p>
                                ) : myInquiries.length === 0 ? (
                                    <p className="mypage-inquiry-empty">등록한 문의가 없습니다.</p>
                                ) : (
                                    <div className="mypage-inquiry-list">
                                        {myInquiries.map((inquiry) => (
                                            <article key={inquiry.inquiryId} className="mypage-inquiry-item">
                                                <div className="mypage-inquiry-head">
                                                    <strong>{inquiry.title || `문의 #${inquiry.inquiryId}`}</strong>
                                                    <span className={`mypage-inquiry-status ${String(inquiry.status || '').toUpperCase() === 'ANSWERED' ? 'is-answered' : 'is-pending'}`}>
                                                        {resolveInquiryStatusLabel(inquiry.status)}
                                                    </span>
                                                </div>
                                                <p className="mypage-inquiry-date">등록일: {formatReviewCreatedAt(inquiry.createdAt)}</p>
                                                <p className="mypage-inquiry-content">{inquiry.content || '-'}</p>
                                                {String(inquiry.status || '').toUpperCase() === 'ANSWERED' ? (
                                                    <div className="mypage-inquiry-answer">
                                                        <p className="mypage-inquiry-answer-date">답변일: {formatReviewCreatedAt(inquiry.answeredAt)}</p>
                                                        <p className="mypage-inquiry-answer-content">{inquiry.answerContent || '-'}</p>
                                                    </div>
                                                ) : null}
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>
                        ) : activeTab === 'withdraw' ? (
                            <section className="mypage-withdraw-panel">
                                <h2>회원 탈퇴</h2>
                                <p>회원 탈퇴 시 계정 정보와 활동 내역은 삭제되며 복구할 수 없습니다.</p>
                                {errorMessage ? <p className="mypage-feedback-message is-error">{errorMessage}</p> : null}
                                <div className="mypage-withdraw-action-row">
                                    <Button
                                        text={isWithdrawing ? '처리 중..' : '회원 탈퇴'}
                                        type="button"
                                        variant="danger"
                                        className="mypage-action-button"
                                        onClick={handleWithdraw}
                                        disabled={isWithdrawing}
                                    />
                                </div>
                            </section>
                        ) : (
                            <section className="mypage-placeholder-panel">
                                <h2>{TAB_PLACEHOLDER_CONTENT[activeTab]?.title ?? '준비 중'}</h2>
                                <p>{TAB_PLACEHOLDER_CONTENT[activeTab]?.description ?? '해당 기능은 준비 중입니다.'}</p>
                            </section>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default MyPage;
