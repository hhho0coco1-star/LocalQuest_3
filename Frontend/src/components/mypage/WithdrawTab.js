import Button from '../common/Button';

function WithdrawTab({
    errorMessage,
    isWithdrawing,
    onWithdraw,
}) {
    return (
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
                    onClick={onWithdraw}
                    disabled={isWithdrawing}
                />
            </div>
        </section>
    );
}

export default WithdrawTab;
