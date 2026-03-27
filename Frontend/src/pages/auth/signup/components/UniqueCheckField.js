import Input from '../../../../components/common/Input';

function UniqueCheckField({
    label,
    name,
    type = 'text',
    placeholder,
    value,
    onChange,
    onBlur,
    error,
    checkMessage,
    checkStatus,
}) {
    return (
        <div className="signup-field-group">
            <Input
                label={label}
                name={name}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                error={error}
            />
            {checkMessage && !error && (
                <p className={`field-check-message ${checkStatus}`}>
                    {checkMessage}
                </p>
            )}
        </div>
    );
}

export default UniqueCheckField;
