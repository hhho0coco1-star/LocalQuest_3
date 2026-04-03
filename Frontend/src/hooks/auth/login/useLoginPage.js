import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { userApi } from '../../../api/UserApi';
import { resolveBackendBaseUrl } from '../../../config/runtimeUrls';
import { setAuth } from '../../../store/authSlice';
import { resolveApiErrorMessage } from '../../../utils/errorMessage';
import {
    resolveLoginRedirectPath,
    toAuthPayload,
    validateFindIdInput,
    validateFindPasswordInput,
} from '../../../utils/auth/login/loginUtils';

const REMEMBERED_LOGIN_ID_KEY = 'lq_saved_login_id';

export function useLoginPage() {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [rememberLoginId, setRememberLoginId] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showFindIdModal, setShowFindIdModal] = useState(false);
    const [findName, setFindName] = useState('');
    const [findEmail, setFindEmail] = useState('');
    const [findIdError, setFindIdError] = useState('');
    const [foundUserLoginId, setFoundUserLoginId] = useState('');
    const [isFindingId, setIsFindingId] = useState(false);

    const [showFindPasswordModal, setShowFindPasswordModal] = useState(false);
    const [findPasswordUserId, setFindPasswordUserId] = useState('');
    const [findPasswordEmail, setFindPasswordEmail] = useState('');
    const [findPasswordError, setFindPasswordError] = useState('');
    const [isFindingPassword, setIsFindingPassword] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const savedUserId = (window.localStorage.getItem(REMEMBERED_LOGIN_ID_KEY) || '').trim();
            if (!savedUserId) {
                return;
            }

            setUserId(savedUserId);
            setRememberLoginId(true);
        } catch (error) {
            // ignore browser storage errors
        }
    }, []);

    const handleLogin = async (event) => {
        event.preventDefault();

        const trimmedUserId = userId.trim();
        if (!trimmedUserId || !password) {
            alert('아이디와 비밀번호를 입력해주세요.');
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await userApi.login({
                userId: trimmedUserId,
                password,
            });

            if (typeof window !== 'undefined') {
                try {
                    if (rememberLoginId) {
                        window.localStorage.setItem(REMEMBERED_LOGIN_ID_KEY, trimmedUserId);
                    } else {
                        window.localStorage.removeItem(REMEMBERED_LOGIN_ID_KEY);
                    }
                } catch (error) {
                    // ignore browser storage errors
                }
            }

            dispatch(setAuth(toAuthPayload(response.data)));
            navigate(resolveLoginRedirectPath(location.search), { replace: true });
        } catch (error) {
            alert(resolveApiErrorMessage(error, '로그인에 실패했습니다.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRememberLoginIdChange = (checked) => {
        setRememberLoginId(Boolean(checked));

        if (checked || typeof window === 'undefined') {
            return;
        }

        try {
            window.localStorage.removeItem(REMEMBERED_LOGIN_ID_KEY);
        } catch (error) {
            // ignore browser storage errors
        }
    };

    const handleMoveToTerms = () => {
        navigate('/terms');
    };

    const handleOpenFindIdModal = () => {
        setFindName('');
        setFindEmail('');
        setFindIdError('');
        setFoundUserLoginId('');
        setShowFindIdModal(true);
    };

    const handleCloseFindIdModal = () => {
        if (isFindingId) {
            return;
        }

        setShowFindIdModal(false);
        setFindIdError('');
        setFoundUserLoginId('');
    };

    const handleFindId = async (event) => {
        event.preventDefault();

        const validationMessage = validateFindIdInput(findName, findEmail);
        if (validationMessage) {
            setFindIdError(validationMessage);
            return;
        }

        try {
            setIsFindingId(true);
            setFindIdError('');
            setFoundUserLoginId('');

            const response = await userApi.findId({
                name: findName.trim(),
                email: findEmail.trim(),
            });

            const userLoginId = response.data?.userLoginId;
            if (!userLoginId) {
                setFindIdError('일치하는 아이디를 찾지 못했습니다.');
                return;
            }

            setFoundUserLoginId(userLoginId);
        } catch (error) {
            setFindIdError(resolveApiErrorMessage(error, '아이디 찾기 요청 처리 중 오류가 발생했습니다.'));
        } finally {
            setIsFindingId(false);
        }
    };

    const handleOpenFindPasswordModal = () => {
        setFindPasswordUserId('');
        setFindPasswordEmail('');
        setFindPasswordError('');
        setShowFindPasswordModal(true);
    };

    const handleCloseFindPasswordModal = () => {
        if (isFindingPassword) {
            return;
        }

        setShowFindPasswordModal(false);
        setFindPasswordError('');
    };

    const handleFindPassword = async (event) => {
        event.preventDefault();

        const validationMessage = validateFindPasswordInput(findPasswordUserId, findPasswordEmail);
        if (validationMessage) {
            setFindPasswordError(validationMessage);
            return;
        }

        try {
            setIsFindingPassword(true);
            setFindPasswordError('');

            const response = await userApi.findPassword({
                userId: findPasswordUserId.trim(),
                email: findPasswordEmail.trim(),
            });

            alert(response.data?.message || '입력한 이메일로 임시 비밀번호를 전송했습니다.');
            setShowFindPasswordModal(false);
            setFindPasswordUserId('');
            setFindPasswordEmail('');
        } catch (error) {
            setFindPasswordError(resolveApiErrorMessage(error, '비밀번호 찾기 요청 처리 중 오류가 발생했습니다.'));
        } finally {
            setIsFindingPassword(false);
        }
    };

    const handleSocialLogin = (provider) => {
        const apiBaseUrl = resolveBackendBaseUrl();
        window.location.href = `${apiBaseUrl}/api/users/oauth/${provider}/start`;
    };

    return {
        userId,
        setUserId,
        password,
        setPassword,
        rememberLoginId,
        isSubmitting,
        showFindIdModal,
        findName,
        setFindName,
        findEmail,
        setFindEmail,
        findIdError,
        foundUserLoginId,
        isFindingId,
        showFindPasswordModal,
        findPasswordUserId,
        setFindPasswordUserId,
        findPasswordEmail,
        setFindPasswordEmail,
        findPasswordError,
        isFindingPassword,
        handleLogin,
        handleRememberLoginIdChange,
        handleMoveToTerms,
        handleOpenFindIdModal,
        handleCloseFindIdModal,
        handleFindId,
        handleOpenFindPasswordModal,
        handleCloseFindPasswordModal,
        handleFindPassword,
        handleSocialLogin,
    };
}
