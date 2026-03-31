import Button from '../../common/Button';
import Input from '../../common/Input';

function FindIdModal({
    isOpen,
    findName,
    onChangeFindName,
    findEmail,
    onChangeFindEmail,
    findIdError,
    foundUserLoginId,
    isFindingId,
    onClose,
    onSubmit,
}) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="find-id-modal-overlay" onClick={onClose}>
            <div className="find-id-modal" onClick={(event) => event.stopPropagation()}>
                <h3>아이디 찾기</h3>
                <p className="find-id-guide">
                    가입 시 입력한 이름과 이메일을 입력하면 일치하는 아이디를 확인할 수 있습니다.
                </p>

                <form className="find-id-form" onSubmit={onSubmit}>
                    <Input
                        placeholder="이름"
                        value={findName}
                        onChange={(event) => onChangeFindName(event.target.value)}
                    />
                    <Input
                        type="email"
                        placeholder="이메일"
                        value={findEmail}
                        onChange={(event) => onChangeFindEmail(event.target.value)}
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
                            onClick={onClose}
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
    );
}

export default FindIdModal;
