import { Link } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import LocalQuestLogo from '../../../components/common/LocalQuestLogo';
import FindIdModal from '../../../components/auth/login/FindIdModal';
import FindPasswordModal from '../../../components/auth/login/FindPasswordModal';
import SocialLoginSection from '../../../components/auth/login/SocialLoginSection';
import { useLoginPage } from '../../../hooks/auth/login/useLoginPage';
import './Login.css';

function Login() {
    const {
        userId,
        setUserId,
        password,
        setPassword,
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
        handleMoveToTerms,
        handleOpenFindIdModal,
        handleCloseFindIdModal,
        handleFindId,
        handleOpenFindPasswordModal,
        handleCloseFindPasswordModal,
        handleFindPassword,
        handleSocialLogin,
    } = useLoginPage();

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
                <button type="button" onClick={handleMoveToTerms}>
                    회원가입
                </button>
            </div>

            <FindIdModal
                isOpen={showFindIdModal}
                findName={findName}
                onChangeFindName={setFindName}
                findEmail={findEmail}
                onChangeFindEmail={setFindEmail}
                findIdError={findIdError}
                foundUserLoginId={foundUserLoginId}
                isFindingId={isFindingId}
                onClose={handleCloseFindIdModal}
                onSubmit={handleFindId}
            />

            <FindPasswordModal
                isOpen={showFindPasswordModal}
                userId={findPasswordUserId}
                onChangeUserId={setFindPasswordUserId}
                email={findPasswordEmail}
                onChangeEmail={setFindPasswordEmail}
                errorMessage={findPasswordError}
                isSubmitting={isFindingPassword}
                onClose={handleCloseFindPasswordModal}
                onSubmit={handleFindPassword}
            />

            <SocialLoginSection onSocialLogin={handleSocialLogin} />
        </div>
    );
}

export default Login;
