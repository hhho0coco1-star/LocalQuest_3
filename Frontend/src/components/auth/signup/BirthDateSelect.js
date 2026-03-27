function BirthDateSelect({
    birthYear,
    birthMonth,
    birthDay,
    years,
    months,
    days,
    onChange,
    errorMessage,
}) {
    return (
        <div className="signup-field-group">
            <label className="lq-label">생년월일</label>
            <div className="birth-dropdowns">
                <select
                    name="birthYear"
                    value={birthYear}
                    onChange={onChange}
                    className={`lq-select ${errorMessage ? 'is-error' : ''}`}
                >
                    <option value="">년</option>
                    {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
                <select
                    name="birthMonth"
                    value={birthMonth}
                    onChange={onChange}
                    className={`lq-select ${errorMessage ? 'is-error' : ''}`}
                >
                    <option value="">월</option>
                    {months.map((month) => <option key={month} value={month}>{month}</option>)}
                </select>
                <select
                    name="birthDay"
                    value={birthDay}
                    onChange={onChange}
                    className={`lq-select ${errorMessage ? 'is-error' : ''}`}
                >
                    <option value="">일</option>
                    {days.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
            </div>
            {errorMessage && <span className="lq-error-msg">{errorMessage}</span>}
        </div>
    );
}

export default BirthDateSelect;
