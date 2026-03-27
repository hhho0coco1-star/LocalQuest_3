import Button from '../../../components/common/Button';
import { TERMS } from '../../../data/termsData';
import { useTermsPage } from './hooks/useTermsPage';
import './Terms.css';

function Terms() {
    const {
        checks,
        handleAllCheck,
        handleSingleCheck,
        handlePrev,
        handleNext,
    } = useTermsPage();

    return (
        <div className="terms-container">
            <h2 className="terms-title">이용약관 동의</h2>

            <div className="terms-box">
                <div className="check-item all">
                    <label>
                        <input type="checkbox" checked={checks.all} onChange={handleAllCheck} />
                        <strong>전체 동의</strong>
                    </label>
                </div>

                <hr />

                <div className="check-item">
                    <label>
                        <input type="checkbox" checked={checks.term1} onChange={(e) => handleSingleCheck('term1', e.target.checked)} />
                        <span>[필수] 이용약관 동의</span>
                    </label>
                    <div className="terms-content">{TERMS.SERVICE}</div>
                </div>

                <div className="check-item">
                    <label>
                        <input type="checkbox" checked={checks.term2} onChange={(e) => handleSingleCheck('term2', e.target.checked)} />
                        <span>[필수] 개인정보 수집 및 이용 동의</span>
                    </label>
                    <div className="terms-content">{TERMS.PRIVACY}</div>
                </div>

                <div className="check-item">
                    <label>
                        <input type="checkbox" checked={checks.term3} onChange={(e) => handleSingleCheck('term3', e.target.checked)} />
                        <span>[선택] 마케팅 정보 수신 동의</span>
                    </label>
                    <div className="terms-content">{TERMS.MARKETING}</div>
                </div>
            </div>

            <div className="terms-buttons">
                <Button text="이전" variant="secondary" onClick={handlePrev} />
                <Button text="다음" variant="primary" onClick={handleNext} />
            </div>
        </div>
    );
}

export default Terms;
