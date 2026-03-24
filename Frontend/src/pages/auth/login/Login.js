import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import './Login.css';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import LocalQuestLogo from '../../../components/common/LocalQuestLogo';
import { resolveBackendBaseUrl } from '../../../config/runtimeUrls';
import { userApi } from '../../../api/UserApi';
import { setAuth } from '../../../store/authSlice';

function Login() {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
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
    const dispatch = useDispatch();

    const handleLogin = async (e) => {
        e.preventDefault();

        const trimmedUserId = userId.trim();
        if (!trimmedUserId || !password) {
            alert('아이디와 비밀번호를 입력해주세요.');
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await userApi.login({
                userId: trimmedUserId,
                password
            });

            const data = response.data;
            dispatch(setAuth({
                accessToken: data.accessToken,
                expiresIn: data.expiresIn,
                user: {
                    userId: data.userId,
                    userLoginId: data.userLoginId,
                    name: data.name,
                    nickname: data.nickname,
                    role: data.role
                }
            }));

            navigate('/main');
        } catch (error) {
            const errorMessage = error.response?.data || '로그인에 실패했습니다.';
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
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

    const handleFindId = async (e) => {
        e.preventDefault();

        const trimmedName = findName.trim();
        const trimmedEmail = findEmail.trim();

        if (!trimmedName || !trimmedEmail) {
            setFindIdError('이름과 이메일을 모두 입력해주세요.');
            return;
        }

        const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailPattern.test(trimmedEmail)) {
            setFindIdError('올바른 이메일 형식을 입력해주세요.');
            return;
        }

        try {
            setIsFindingId(true);
            setFindIdError('');
            setFoundUserLoginId('');

            const response = await userApi.findId({
                name: trimmedName,
                email: trimmedEmail
            });

            const userLoginId = response.data?.userLoginId;
            if (!userLoginId) {
                setFindIdError('일치하는 아이디를 찾지 못했습니다.');
                return;
            }

            setFoundUserLoginId(userLoginId);
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.response?.data ||
                '아이디 찾기 요청 처리 중 오류가 발생했습니다.';
            setFindIdError(errorMessage);
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

    const handleFindPassword = async (e) => {
        e.preventDefault();

        const trimmedUserId = findPasswordUserId.trim();
        const trimmedEmail = findPasswordEmail.trim();

        if (!trimmedUserId || !trimmedEmail) {
            setFindPasswordError('아이디와 이메일을 모두 입력해주세요.');
            return;
        }

        const userIdPattern = /^[A-Za-z0-9]{4,20}$/;
        if (!userIdPattern.test(trimmedUserId)) {
            setFindPasswordError('아이디는 4~20자 영문/숫자만 사용할 수 있습니다.');
            return;
        }

        const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailPattern.test(trimmedEmail)) {
            setFindPasswordError('올바른 이메일 형식을 입력해주세요.');
            return;
        }

        try {
            setIsFindingPassword(true);
            setFindPasswordError('');

            const response = await userApi.findPassword({
                userId: trimmedUserId,
                email: trimmedEmail
            });

            alert(response.data?.message || '입력한 이메일로 임시 비밀번호를 전송했습니다.');
            setShowFindPasswordModal(false);
            setFindPasswordUserId('');
            setFindPasswordEmail('');
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.response?.data ||
                '비밀번호 찾기 요청 처리 중 오류가 발생했습니다.';
            setFindPasswordError(errorMessage);
        } finally {
            setIsFindingPassword(false);
        }
    };

    const handleSocialLogin = (provider) => {
        const apiBaseUrl = resolveBackendBaseUrl();
        window.location.href = `${apiBaseUrl}/api/users/oauth/${provider}/start`;
    };

    return (
        <div className="login-container">
            <div className="login-title">
                <Link to="/main" className="login-logo-link" aria-label="메인 페이지로 이동">
                    <LocalQuestLogo />
                </Link>
            </div>

            <form className="login-form" onSubmit={handleLogin}>
                <Input
                    placeholder="아이디"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                />

                <Input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <div className="login-options">
                    <label className="remember-login-id">
                        <input type="checkbox" />
                        아이디 저장
                    </label>
                </div>

                <Button
                    text={isSubmitting ? '로그인 중..' : '로그인'}
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                />
            </form>

            <div className="login-find">
                <button type="button" onClick={handleOpenFindIdModal}>아이디 찾기</button>
                <button type="button" onClick={handleOpenFindPasswordModal}>비밀번호 찾기</button>
                <button type="button" onClick={() => navigate('/terms')}>
                    회원가입
                </button>
            </div>

            {showFindIdModal && (
                <div className="find-id-modal-overlay" onClick={handleCloseFindIdModal}>
                    <div className="find-id-modal" onClick={(event) => event.stopPropagation()}>
                        <h3>아이디 찾기</h3>
                        <p className="find-id-guide">
                            가입 시 입력한 이름과 이메일을 입력하면 일치하는 아이디를 확인할 수 있습니다.
                        </p>

                        <form className="find-id-form" onSubmit={handleFindId}>
                            <Input
                                placeholder="이름"
                                value={findName}
                                onChange={(event) => setFindName(event.target.value)}
                            />
                            <Input
                                type="email"
                                placeholder="이메일"
                                value={findEmail}
                                onChange={(event) => setFindEmail(event.target.value)}
                            />

                            {findIdError && <p className="find-id-error">{findIdError}</p>}
                            {foundUserLoginId && (
                                <p className="find-id-result">
                                    조회된 아이디: <strong>{foundUserLoginId}</strong>
                                </p>
                            )}

                            <div className="find-id-actions">
                                <button
                                    type="button"
                                    className="find-id-cancel-btn"
                                    onClick={handleCloseFindIdModal}
                                    disabled={isFindingId}
                                >
                                    취소
                                </button>
                                <Button
                                    text={isFindingId ? '확인 중..' : '다음'}
                                    type="submit"
                                    variant="primary"
                                    disabled={isFindingId}
                                    className="find-id-next-btn"
                                />
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showFindPasswordModal && (
                <div className="find-password-modal-overlay" onClick={handleCloseFindPasswordModal}>
                    <div className="find-password-modal" onClick={(event) => event.stopPropagation()}>
                        <h3>비밀번호 찾기</h3>
                        <p className="find-password-guide">
                            가입한 아이디와 이메일을 입력하면 6자리 임시 비밀번호를 이메일로 보내드립니다.
                        </p>

                        <form className="find-password-form" onSubmit={handleFindPassword}>
                            <Input
                                placeholder="아이디"
                                value={findPasswordUserId}
                                onChange={(event) => setFindPasswordUserId(event.target.value)}
                            />
                            <Input
                                type="email"
                                placeholder="이메일"
                                value={findPasswordEmail}
                                onChange={(event) => setFindPasswordEmail(event.target.value)}
                            />

                            {findPasswordError && <p className="find-password-error">{findPasswordError}</p>}

                            <div className="find-password-actions">
                                <button
                                    type="button"
                                    className="find-password-cancel-btn"
                                    onClick={handleCloseFindPasswordModal}
                                    disabled={isFindingPassword}
                                >
                                    취소
                                </button>
                                <Button
                                    text={isFindingPassword ? '확인 중..' : '다음'}
                                    type="submit"
                                    variant="primary"
                                    disabled={isFindingPassword}
                                    className="find-password-next-btn"
                                />
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="social-login">
                <p>소셜 로그인</p>
                <Button
                    text="Google로 로그인"
                    variant="google"
                    onClick={() => handleSocialLogin('google')}
                />
                <Button
                    text="Naver로 로그인"
                    variant="naver"
                    onClick={() => handleSocialLogin('naver')}
                />
                <Button
                    text="Kakao로 로그인"
                    variant="kakao"
                    onClick={() => handleSocialLogin('kakao')}
                />
            </div>
        </div>
    );
}

export default Login;
