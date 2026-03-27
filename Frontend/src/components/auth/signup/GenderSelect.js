function GenderSelect({ value, onSelect, errorMessage }) {
    return (
        <div className="signup-field-group">
            <label className="lq-label">성별</label>
            <div className="gender-box-group">
                <button
                    type="button"
                    className={`gender-box ${value === 'M' ? 'active' : ''} ${errorMessage ? 'is-error' : ''}`}
                    onClick={() => onSelect('M')}
                >
                    남성
                </button>
                <button
                    type="button"
                    className={`gender-box ${value === 'F' ? 'active' : ''} ${errorMessage ? 'is-error' : ''}`}
                    onClick={() => onSelect('F')}
                >
                    여성
                </button>
            </div>
            {errorMessage && <span className="lq-error-msg">{errorMessage}</span>}
        </div>
    );
}

export default GenderSelect;
