import Button from '../../common/Button';
import Input from '../../common/Input';

function FindPasswordModal({
    isOpen,
    userId,
    onChangeUserId,
    email,
    onChangeEmail,
    errorMessage,
    isSubmitting,
    onClose,
    onSubmit,
}) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="find-password-modal-overlay" onClick={onClose}>
            <div className="find-password-modal" onClick={(event) => event.stopPropagation()}>
                <h3>비밀번호 찾기</h3>
                <p className="find-password-guide">
                    가입한 아이디와 이메일을 입력하면 6자리 임시 비밀번호를 이메일로 보내드립니다.
                </p>

                <form className="find-password-form" onSubmit={onSubmit}>
                    <Input
                        placeholder="아이디"
                        value={userId}
                        onChange={(event) => onChangeUserId(event.target.value)}
                    />
                    <Input
                        type="email"
                        placeholder="이메일"
                        value={email}
                        onChange={(event) => onChangeEmail(event.target.value)}
                    />

                    {errorMessage && <p className="find-password-error">{errorMessage}</p>}

                    <div className="find-password-actions">
                        <button
                            type="button"
                            className="find-password-cancel-btn"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            취소
                        </button>
                        <Button
                            text={isSubmitting ? '확인 중..' : '다음'}
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting}
                            className="find-password-next-btn"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}

export default FindPasswordModal;
