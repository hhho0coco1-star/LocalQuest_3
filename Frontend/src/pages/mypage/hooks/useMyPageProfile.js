import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { pushApi } from '../../../api/PushApi';
import { userApi } from '../../../api/UserApi';
import {
    deactivatePushSubscriptionForCurrentDevice,
    ensurePushSubscriptionForCurrentDevice,
    isPushSupported as isPushSupportedBrowser,
    parseYnToBoolean,
} from '../../../push/pushSync';
import { clearAuth, updateUserProfile } from '../../../store/authSlice';
import { resolveApiErrorMessage } from '../../../utils/errorMessage';
import {
    PASSWORD_MASK,
    hasProfileFormChanged,
    normalizeProfile,
} from '../utils/myPageUtils';

function toUserProfilePayload(profile) {
    return {
        userId: profile.userId,
        userLoginId: profile.userLoginId,
        name: profile.name,
        email: profile.email,
        nickname: profile.nickname,
        birth: profile.birth,
        gender: profile.gender,
        createdAt: profile.createdAt,
        role: profile.role,
        status: profile.status,
    };
}

export function useMyPageProfile() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);

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

    const isPushSupported = isPushSupportedBrowser();

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

                dispatch(updateUserProfile(toUserProfilePayload(normalized)));
            } catch (error) {
                if (isCancelled) {
                    return;
                }

                const message = resolveApiErrorMessage(
                    error,
                    '회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
                );
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

    const hasChanged = useMemo(
        () => hasProfileFormChanged(formState, profile.nickname, initialPushEnabled),
        [formState, profile.nickname, initialPushEnabled]
    );

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
                dispatch(updateUserProfile(toUserProfilePayload(updatedProfile)));
            }

            if (hasPushChange) {
                const nextPushEnabled = formState.pushEnabled;

                if (nextPushEnabled) {
                    await ensurePushSubscriptionForCurrentDevice({ requestPermission: true });
                    await pushApi.saveSettings({
                        pushAgree: true,
                        marketingAgree: false,
                        lunchPushAgree: true,
                        dinnerPushAgree: true,
                        weekendPushAgree: true,
                    });
                } else {
                    await deactivatePushSubscriptionForCurrentDevice();
                    await pushApi.saveSettings({
                        pushAgree: false,
                        marketingAgree: false,
                        lunchPushAgree: false,
                        dinnerPushAgree: false,
                        weekendPushAgree: false,
                    });
                }

                setInitialPushEnabled(nextPushEnabled);
            }

            setFormState({
                password: PASSWORD_MASK,
                nickname: updatedProfile.nickname,
                pushEnabled: formState.pushEnabled,
            });

            setFeedbackMessage('회원 정보가 수정되었습니다.');
        } catch (error) {
            const message = resolveApiErrorMessage(
                error,
                '회원 정보 수정에 실패했습니다. 잠시 후 다시 시도해주세요.'
            );
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
            const message = resolveApiErrorMessage(
                error,
                '회원 탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요.'
            );
            setErrorMessage(message);
        } finally {
            setIsWithdrawing(false);
        }
    };

    return {
        profile,
        isProfileLoading,
        isSubmitting,
        isWithdrawing,
        formState,
        isPushSupported,
        hasChanged,
        errorMessage,
        feedbackMessage,
        handleFieldChange,
        handlePasswordFocus,
        handlePasswordBlur,
        handlePushToggle,
        handleCancel,
        handleSubmit,
        handleWithdraw,
    };
}
